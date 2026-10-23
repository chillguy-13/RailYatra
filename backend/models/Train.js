const mongoose = require('mongoose');

const trainSchema = new mongoose.Schema(
  {
    trainNo: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    trainName: {
      type: String,
      required: true,
      trim: true,
    },
    source: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    numberOfCoaches: {
      type: Number,
      required: true,
      min: 1,
    },
    totalSeats: {
      type: Number,
    },
    fare: {
      type: Number,
      required: true,
      min: 0,
    },
    availableSeats: {
      type: Number,
    },
  },
  { timestamps: true }
);

// Compound index for route search performance
trainSchema.index({ source: 1, destination: 1 });

// Auto-calculate totalSeats and availableSeats before save
trainSchema.pre('save', function (next) {
  if (this.isModified('numberOfCoaches') || this.isNew) {
    const total = this.numberOfCoaches * 60;
    this.totalSeats = total;
    if (this.isNew && this.availableSeats === undefined) {
      this.availableSeats = total;
    }
  }
  next();
});

module.exports = mongoose.model('Train', trainSchema);
