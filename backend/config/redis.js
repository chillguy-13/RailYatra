const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`;

let isConnected = false;

const redisClient = new Redis(redisUrl, {
  maxRetriesPerRequest: 2,
  connectTimeout: 3000,
  enableOfflineQueue: false, // Prevents hanging requests if Redis is offline
  retryStrategy(times) {
    if (times > 3) {
      return null; // Stop retrying after 3 attempts during initial/offline run
    }
    return Math.min(times * 500, 2000);
  },
});

redisClient.on('connect', () => {
  isConnected = true;
  console.log('⚡ Redis connected successfully for distributed locks & caching');
});

redisClient.on('ready', () => {
  isConnected = true;
});

redisClient.on('error', (err) => {
  if (isConnected) {
    console.warn('⚠️  Redis connection warning:', err.message);
  }
  isConnected = false;
});

redisClient.on('close', () => {
  isConnected = false;
});

const isRedisAvailable = () => isConnected && redisClient.status === 'ready';

module.exports = {
  redisClient,
  isRedisAvailable,
};
