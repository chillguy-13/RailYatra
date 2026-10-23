const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Booking = require('../models/Booking');
const Train = require('../models/Train');
const { protect, adminOnly } = require('../middleware/auth');
const {
  acquireSeatLocks,
  releaseSeatLocks,
  invalidateCachePattern,
} = require('../utils/lockService');

const HOLD_DURATION_SECONDS = 60; // 60 seconds temporary hold for payment

// POST /api/bookings - create temporary hold booking protected by Redis TTL lock
router.post('/', protect, async (req, res) => {
  const { trainNo, selectedSeats } = req.body;
  const userId = req.user._id.toString();

  if (!selectedSeats || !Array.isArray(selectedSeats) || selectedSeats.length === 0 || selectedSeats.length > 4) {
    return res.status(400).json({ error: 'Select between 1 and 4 seats' });
  }

  const uniqueSeats = [...new Set(selectedSeats)];
  if (uniqueSeats.length !== selectedSeats.length) {
    return res.status(400).json({ error: 'Duplicate seat numbers in selection' });
  }

  const train = await Train.findOne({ trainNo }).lean();
  if (!train) return res.status(404).json({ error: 'Train not found' });

  if (train.availableSeats < uniqueSeats.length) {
    return res.status(400).json({ error: 'Not enough seats available on this train' });
  }

  // Step 1: Acquire atomic Redis TTL distributed locks for 60 seconds
  const lockResult = await acquireSeatLocks(train._id.toString(), uniqueSeats, userId, HOLD_DURATION_SECONDS);

  if (!lockResult.success) {
    return res.status(409).json({
      error: lockResult.message || `Seat ${lockResult.conflictSeat} is currently held by another passenger. Please try another seat.`,
      conflictSeat: lockResult.conflictSeat,
    });
  }

  try {
    // Step 2: Check for permanently confirmed bookings in DB (paid: true)
    const existingConflict = await Booking.findOne({
      train: train._id,
      seatNumbers: { $in: uniqueSeats },
      paid: true,
      status: 'CONFIRMED',
    })
      .select('seatNumbers')
      .lean();

    if (existingConflict) {
      const bookedSeat = uniqueSeats.find((s) => existingConflict.seatNumbers.includes(s));
      await releaseSeatLocks(train._id.toString(), uniqueSeats, userId);
      return res.status(409).json({
        error: `Seat ${bookedSeat} is already booked`,
        conflictSeat: bookedSeat,
      });
    }

    // Step 3: Create the pending booking document with 60-second expiration
    const totalFare = train.fare * uniqueSeats.length;
    const expiresAt = new Date(Date.now() + HOLD_DURATION_SECONDS * 1000);

    const booking = await Booking.create({
      bookingId: uuidv4(),
      user: req.user._id,
      train: train._id,
      seatsBooked: uniqueSeats.length,
      seatNumbers: uniqueSeats,
      fare: totalFare,
      paid: false,
      status: 'PENDING_PAYMENT',
      expiresAt,
      bookingTime: new Date(),
    });

    // Invalidate cached train lists
    invalidateCachePattern('railyatra:trains:*');

    // NOTE: We KEEP the Redis lock active during the 60s payment window so other passengers see the seat as HELD!

    const populated = await Booking.findById(booking._id)
      .populate('user', 'username email')
      .populate('train')
      .lean();

    res.status(201).json({
      ...populated,
      holdExpiresAt: expiresAt,
      holdTtlSeconds: HOLD_DURATION_SECONDS,
    });
  } catch (err) {
    await releaseSeatLocks(train._id.toString(), uniqueSeats, userId);
    res.status(500).json({ error: err.message || 'Booking creation failed' });
  }
});

// POST /api/bookings/:bookingId/cancel - cancel pending hold and release Redis lock immediately
router.post('/:bookingId/cancel', protect, async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.bookingId });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'ROLE_ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (booking.paid) {
      return res.status(400).json({ error: 'Confirmed paid booking cannot be cancelled via this endpoint' });
    }

    booking.status = 'CANCELLED';
    await booking.save();

    // Release Redis lock immediately so seats become available instantly
    await releaseSeatLocks(booking.train.toString(), booking.seatNumbers, booking.user.toString());
    invalidateCachePattern('railyatra:trains:*');

    res.json({ message: 'Hold cancelled and seats released successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/bookings/:bookingId/pay - mark as paid and confirm permanent reservation
router.patch('/:bookingId/pay', protect, async (req, res) => {
  try {
    const { razorpayPaymentId, razorpayOrderId } = req.body;

    const booking = await Booking.findOne({ bookingId: req.params.bookingId });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'ROLE_ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (booking.paid) {
      return res.json(booking); // already paid
    }

    // Check if the 60-second hold expired
    if (booking.expiresAt && new Date() > new Date(booking.expiresAt) && booking.status !== 'CONFIRMED') {
      booking.status = 'EXPIRED';
      await booking.save();
      await releaseSeatLocks(booking.train.toString(), booking.seatNumbers, booking.user.toString());
      return res.status(410).json({
        error: 'Seat reservation expired. The 60-second hold window has ended. Please select your seats again.',
      });
    }

    // Atomically decrement train availableSeats upon payment
    const updatedTrain = await Train.findOneAndUpdate(
      { _id: booking.train, availableSeats: { $gte: booking.seatsBooked } },
      { $inc: { availableSeats: -booking.seatsBooked } },
      { new: true }
    );

    if (!updatedTrain) {
      booking.status = 'EXPIRED';
      await booking.save();
      await releaseSeatLocks(booking.train.toString(), booking.seatNumbers, booking.user.toString());
      return res.status(409).json({ error: 'Seats no longer available on this train' });
    }

    booking.paid = true;
    booking.status = 'CONFIRMED';
    booking.razorpayPaymentId = razorpayPaymentId;
    booking.razorpayOrderId = razorpayOrderId;
    await booking.save();

    // Release Redis temporary hold lock (seats are now permanently confirmed in DB)
    await releaseSeatLocks(booking.train.toString(), booking.seatNumbers, booking.user.toString());
    invalidateCachePattern('railyatra:trains:*');

    const populated = await Booking.findById(booking._id)
      .populate('user', 'username email')
      .populate('train')
      .lean();

    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bookings/my - get current user's confirmed bookings
router.get('/my', protect, async (req, res) => {
  try {
    const bookings = await Booking.find({
      user: req.user._id,
      paid: true,
      status: 'CONFIRMED',
    })
      .populate('train')
      .sort({ bookingTime: -1 })
      .lean();
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bookings/:bookingId - get specific booking
router.get('/:bookingId', protect, async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.bookingId })
      .populate('user', 'username email role')
      .populate('train')
      .lean();

    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const isOwner = booking.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ROLE_ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bookings - admin: get all bookings
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'username email')
      .populate('train', 'trainName trainNo source destination')
      .sort({ bookingTime: -1 })
      .lean();
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
