const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      default: uuidv4,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    train: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Train',
      required: true,
      index: true,
    },
    seatsBooked: {
      type: Number,
      required: true,
      min: 1,
      max: 4,
    },
    fare: {
      type: Number,
      required: true,
    },
    paid: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'EXPIRED'],
      default: 'PENDING_PAYMENT',
      index: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 60 * 1000), // 60 seconds hold TTL
      index: true,
    },
    bookingTime: {
      type: Date,
      default: Date.now,
      index: true,
    },
    seatNumbers: {
      type: [String],
      required: true,
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
  },
  { timestamps: true }
);

// Compound indexes for fast lookup and double booking query optimization
bookingSchema.index({ train: 1, seatNumbers: 1, paid: 1 });
bookingSchema.index({ user: 1, bookingTime: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
