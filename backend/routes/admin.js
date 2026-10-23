const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Train = require('../models/Train');
const Booking = require('../models/Booking');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/admin/stats - dashboard statistics (fast parallel aggregation)
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const [totalUsers, totalTrains, totalBookings, paidBookings, revenueResult] = await Promise.all([
      User.countDocuments({ role: 'ROLE_USER' }),
      Train.countDocuments(),
      Booking.countDocuments(),
      Booking.countDocuments({ paid: true }),
      Booking.aggregate([
        { $match: { paid: true } },
        { $group: { _id: null, total: { $sum: '$fare' } } },
      ]),
    ]);

    const totalRevenue = revenueResult[0]?.total || 0;

    res.json({
      totalUsers,
      totalTrains,
      totalBookings,
      paidBookings,
      totalRevenue,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users - list all users (lean query)
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({ role: 'ROLE_USER' })
      .select('username email role createdAt')
      .sort({ createdAt: -1 })
      .lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/bookings - list recent bookings with full details (paginated & lean)
router.get('/bookings', protect, adminOnly, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      Booking.find()
        .select('bookingId user train seatsBooked fare paid bookingTime seatNumbers')
        .populate('user', 'username email')
        .populate('train', 'trainName trainNo source destination fare')
        .sort({ bookingTime: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Booking.countDocuments(),
    ]);

    res.json({
      bookings,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
