const { redisClient, isRedisAvailable } = require('../config/redis');

const LOCK_PREFIX = 'railyatra:lock:train';
const DEFAULT_LOCK_TTL_SECONDS = 60; // 60 seconds seat hold duration

// Lua script to atomically acquire locks for multiple seats
const ACQUIRE_LOCKS_LUA = `
for i = 1, #KEYS do
  local val = redis.call('GET', KEYS[i])
  if val and val ~= ARGV[1] then
    return KEYS[i]
  end
end
for i = 1, #KEYS do
  redis.call('SET', KEYS[i], ARGV[1], 'PX', ARGV[2])
end
return 'OK'
`;

// Lua script to atomically release locks only if owned by the caller
const RELEASE_LOCKS_LUA = `
local count = 0
for i = 1, #KEYS do
  local val = redis.call('GET', KEYS[i])
  if val == ARGV[1] then
    redis.call('DEL', KEYS[i])
    count = count + 1
  end
end
return count
`;

/**
 * Acquire distributed TTL locks for a set of seats on a train
 * @param {string|number} trainId - Train ID or Train Number
 * @param {string[]} seatNumbers - Array of seat strings (e.g. ['1-1A', '1-1B'])
 * @param {string} ownerId - Unique identifier for the user / session
 * @param {number} [ttlSeconds] - TTL in seconds (defaults to 60)
 * @returns {Promise<{success: boolean, locked: string[], conflictSeat?: string, message?: string}>}
 */
const acquireSeatLocks = async (trainId, seatNumbers, ownerId, ttlSeconds = DEFAULT_LOCK_TTL_SECONDS) => {
  if (!seatNumbers || seatNumbers.length === 0) {
    return { success: true, locked: [] };
  }

  if (!isRedisAvailable()) {
    // Redis unavailable: Return success to allow DB-level concurrency controls
    return { success: true, locked: seatNumbers, isFallback: true };
  }

  try {
    const keys = seatNumbers.map((seat) => `${LOCK_PREFIX}:${trainId}:seat:${seat}`);
    const ttlMs = ttlSeconds * 1000;

    const result = await redisClient.eval(
      ACQUIRE_LOCKS_LUA,
      keys.length,
      ...keys,
      String(ownerId),
      ttlMs
    );

    if (result === 'OK') {
      return {
        success: true,
        locked: seatNumbers,
        ttlSeconds,
      };
    } else {
      // result is the conflicting key name: 'railyatra:lock:train:{id}:seat:{seatNo}'
      const conflictSeat = result.split(':seat:')[1] || result;
      return {
        success: false,
        conflictSeat,
        message: `Seat ${conflictSeat} is currently held by another user. Please try another seat.`,
      };
    }
  } catch (err) {
    console.error('Redis lock acquisition error:', err.message);
    // On unexpected Redis execution error, fail open to DB-level checks
    return { success: true, locked: seatNumbers, isFallback: true };
  }
};

/**
 * Release distributed locks for seats owned by a specific owner
 * @param {string|number} trainId
 * @param {string[]} seatNumbers
 * @param {string} ownerId
 */
const releaseSeatLocks = async (trainId, seatNumbers, ownerId) => {
  if (!seatNumbers || seatNumbers.length === 0 || !isRedisAvailable()) {
    return 0;
  }

  try {
    const keys = seatNumbers.map((seat) => `${LOCK_PREFIX}:${trainId}:seat:${seat}`);
    const releasedCount = await redisClient.eval(
      RELEASE_LOCKS_LUA,
      keys.length,
      ...keys,
      String(ownerId)
    );
    return releasedCount;
  } catch (err) {
    console.error('Redis lock release error:', err.message);
    return 0;
  }
};

/**
 * Get all active held/locked seats for a train along with remaining TTL
 * @param {string|number} trainId
 * @returns {Promise<Array<{seatId: string, ttl: number}>>}
 */
const getActiveLockedSeats = async (trainId) => {
  if (!isRedisAvailable()) {
    return [];
  }

  try {
    const pattern = `${LOCK_PREFIX}:${trainId}:seat:*`;
    const keys = [];
    let cursor = '0';

    do {
      const [nextCursor, matchedKeys] = await redisClient.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      );
      cursor = nextCursor;
      if (matchedKeys && matchedKeys.length > 0) {
        keys.push(...matchedKeys);
      }
    } while (cursor !== '0');

    if (keys.length === 0) return [];

    const pipeline = redisClient.pipeline();
    keys.forEach((key) => {
      pipeline.ttl(key);
    });
    const ttls = await pipeline.exec();

    const lockedSeats = [];
    keys.forEach((key, index) => {
      const seatId = key.split(':seat:')[1];
      const ttl = ttls[index] && ttls[index][1] ? ttls[index][1] : 0;
      if (ttl > 0 && seatId) {
        lockedSeats.push({ seatId, ttl });
      }
    });

    return lockedSeats;
  } catch (err) {
    console.error('Redis getActiveLockedSeats error:', err.message);
    return [];
  }
};

/**
 * Basic cache helpers
 */
const getCache = async (key) => {
  if (!isRedisAvailable()) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

const setCache = async (key, data, ttlSeconds = 30) => {
  if (!isRedisAvailable()) return;
  try {
    await redisClient.set(key, JSON.stringify(data), 'EX', ttlSeconds);
  } catch {
    // silent catch for cache
  }
};

const invalidateCachePattern = async (pattern) => {
  if (!isRedisAvailable()) return;
  try {
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 50);
      cursor = nextCursor;
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } while (cursor !== '0');
  } catch {
    // silent catch
  }
};

module.exports = {
  acquireSeatLocks,
  releaseSeatLocks,
  getActiveLockedSeats,
  getCache,
  setCache,
  invalidateCachePattern,
  DEFAULT_LOCK_TTL_SECONDS,
};
