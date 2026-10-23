const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const exists = await User.findOne({ username });
    if (exists) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const user = await User.create({ username, email, password, role: 'ROLE_USER' });

    res.status(201).json({
      message: 'Registration successful',
      token: generateToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    res.json({
      message: 'Login successful',
      token: generateToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me - get current user
router.get('/me', protect, async (req, res) => {
  res.json({
    id: req.user._id,
    username: req.user.username,
    email: req.user.email,
    role: req.user.role,
  });
});

module.exports = router;
