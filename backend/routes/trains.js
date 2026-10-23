const express = require('express');
const router = express.Router();
const Train = require('../models/Train');
const Booking = require('../models/Booking');
const { protect, adminOnly } = require('../middleware/auth');
const {
  getActiveLockedSeats,
  getCache,
  setCache,
  invalidateCachePattern,
} = require('../utils/lockService');

// GET /api/trains - get all trains (with Redis caching for lightning-fast reads)
router.get('/', protect, async (req, res) => {
  try {
    const cacheKey = 'railyatra:trains:all';
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const trains = await Train.find().sort({ trainNo: 1 }).lean();
    await setCache(cacheKey, trains, 30);

    res.json(trains);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/trains/:trainNo - get single train + confirmed booked seats + active Redis held seats
router.get('/:trainNo', protect, async (req, res) => {
  try {
    const train = await Train.findOne({ trainNo: Number(req.params.trainNo) }).lean();
    if (!train) return res.status(404).json({ error: 'Train not found' });

    // Fetch ONLY confirmed/paid booked seats
    const confirmedBookings = await Booking.find({
      train: train._id,
      paid: true,
      status: 'CONFIRMED',
    })
      .select('seatNumbers')
      .lean();
    const bookedSeats = confirmedBookings.flatMap((b) => b.seatNumbers || []);

    // Fetch actively held/locked seats from Redis TTL lock manager (active within 60s window)
    const activeLocks = await getActiveLockedSeats(train._id.toString());
    const lockedSeatsSet = new Set(activeLocks.map((l) => l.seatId));

    // Fallback if Redis is offline: check active pending bookings within expiresAt
    const pendingActiveBookings = await Booking.find({
      train: train._id,
      paid: false,
      status: 'PENDING_PAYMENT',
      expiresAt: { $gt: new Date() },
    })
      .select('seatNumbers')
      .lean();

    pendingActiveBookings.flatMap((b) => b.seatNumbers || []).forEach((s) => {
      lockedSeatsSet.add(s);
    });

    // Remove any confirmed booked seats from locked set for clarity
    bookedSeats.forEach((b) => lockedSeatsSet.delete(b));

    res.json({
      train,
      bookedSeats,
      lockedSeats: Array.from(lockedSeatsSet),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/trains - add train (admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { trainNo, trainName, source, destination, numberOfCoaches, fare } = req.body;

    const exists = await Train.findOne({ trainNo: Number(trainNo) }).select('_id').lean();
    if (exists) return res.status(409).json({ error: 'Train number already exists' });

    const train = await Train.create({
      trainNo: Number(trainNo),
      trainName: trainName.trim(),
      source: source.trim(),
      destination: destination.trim(),
      numberOfCoaches: Number(numberOfCoaches),
      fare: Number(fare),
    });

    invalidateCachePattern('railyatra:trains:*');
    res.status(201).json(train);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/trains/:trainNo - update train (admin only)
router.put('/:trainNo', protect, adminOnly, async (req, res) => {
  try {
    const train = await Train.findOne({ trainNo: Number(req.params.trainNo) });
    if (!train) return res.status(404).json({ error: 'Train not found' });

    const { trainName, source, destination, numberOfCoaches, fare } = req.body;

    const oldTotal = train.totalSeats || train.numberOfCoaches * 60;
    const oldAvailable = train.availableSeats ?? oldTotal;

    if (trainName) train.trainName = trainName.trim();
    if (source) train.source = source.trim();
    if (destination) train.destination = destination.trim();
    if (fare !== undefined) train.fare = Number(fare);

    if (numberOfCoaches && Number(numberOfCoaches) !== train.numberOfCoaches) {
      const newTotal = Number(numberOfCoaches) * 60;
      const diff = newTotal - oldTotal;
      train.numberOfCoaches = Number(numberOfCoaches);
      train.totalSeats = newTotal;
      train.availableSeats = Math.max(oldAvailable + diff, 0);
    }

    await train.save({ validateModifiedOnly: true });
    invalidateCachePattern('railyatra:trains:*');

    res.json(train);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/trains/:trainNo - delete train (admin only)
router.delete('/:trainNo', protect, adminOnly, async (req, res) => {
  try {
    const train = await Train.findOne({ trainNo: Number(req.params.trainNo) }).select('_id').lean();
    if (!train) return res.status(404).json({ error: 'Train not found' });

    await Booking.deleteMany({ train: train._id });
    await Train.deleteOne({ _id: train._id });

    invalidateCachePattern('railyatra:trains:*');
    res.json({ message: 'Train deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
