const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// POST /api/payment/create-order - create Razorpay order
router.post('/create-order', protect, async (req, res) => {
  try {
    const { amount } = req.body; // amount in INR

    // In production, initialize Razorpay here:
    // const Razorpay = require('razorpay');
    // const razorpay = new Razorpay({
    //   key_id: process.env.RAZORPAY_KEY_ID,
    //   key_secret: process.env.RAZORPAY_KEY_SECRET,
    // });
    // const order = await razorpay.orders.create({
    //   amount: Math.round(amount * 100), // paise
    //   currency: 'INR',
    //   receipt: `txn_${Date.now()}`,
    // });

    // Mock response for development (replace with real Razorpay in production)
    const mockOrder = {
      id: `order_mock_${Date.now()}`,
      amount: Math.round(amount * 100),
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_AXa5IGEOp6MUpe',
    };

    res.json(mockOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payment/verify - verify payment signature
router.post('/verify', protect, async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    // In production, verify HMAC signature:
    // const crypto = require('crypto');
    // const body = razorpayOrderId + '|' + razorpayPaymentId;
    // const expectedSig = crypto
    //   .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    //   .update(body)
    //   .digest('hex');
    // if (expectedSig !== razorpaySignature) {
    //   return res.status(400).json({ error: 'Payment verification failed' });
    // }

    res.json({ success: true, message: 'Payment verified' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
