import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const router = express.Router();

// Generate JWT Helper
const generateToken = (user) => {
  return jwt.sign(
    { user: { id: user._id, isAnonymous: user.isAnonymous } },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '30d' }
  );
};

// @route   POST /api/auth/anonymous
// @desc    Sign in anonymously
router.post('/anonymous', async (req, res) => {
  try {
    let user = new User({
      isAnonymous: true,
      displayName: 'Guest User'
    });
    await user.save();

    const token = generateToken(user);
    res.json({ token, user: { id: user._id, displayName: user.displayName, isAnonymous: true } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message, stack: err.stack });
  }
});

// @route   POST /api/auth/register
// @desc    Register user
router.post('/register', async (req, res) => {
  const { email, password, displayName } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new User({ email, password, displayName, isAnonymous: false });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const token = generateToken(user);
    res.json({ token, user: { id: user._id, email: user.email, displayName: user.displayName, isAnonymous: false } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message, stack: err.stack });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const token = generateToken(user);
    res.json({ token, user: { id: user._id, email: user.email, displayName: user.displayName, isAnonymous: false } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message, stack: err.stack });
  }
});

// @route   POST /api/auth/google
// @desc    Authenticate user with Google & get token
router.post('/google', async (req, res) => {
  const { credential } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    let user = await User.findOne({ email });
    
    if (!user) {
      // Create new user if they don't exist
      user = new User({ 
        email, 
        displayName: name, 
        isAnonymous: false,
      });
      await user.save();
    }

    const token = generateToken(user);
    res.json({ token, user: { id: user._id, email: user.email, displayName: user.displayName, isAnonymous: false } });
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(500).json({ message: 'Google authentication failed', details: err.message });
  }
});

// @route   POST /api/auth/link
// @desc    Link anonymous account to permanent account
router.post('/link', auth, async (req, res) => {
  const { email, password, displayName } = req.body;

  try {
    // Check if email already in use
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already linked to another account' });
    }

    // Find the current anonymous user
    let user = await User.findById(req.user.id);
    if (!user || !user.isAnonymous) {
      return res.status(400).json({ message: 'User is not anonymous or not found' });
    }

    // Upgrade the user
    user.email = email;
    user.displayName = displayName || user.displayName;
    user.isAnonymous = false;

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const token = generateToken(user);
    res.json({ token, user: { id: user._id, email: user.email, displayName: user.displayName, isAnonymous: false } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message, stack: err.stack });
  }
});

// @route   GET /api/auth/me
// @desc    Get user data
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message, stack: err.stack });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile (display name)
router.put('/profile', auth, async (req, res) => {
  const { displayName } = req.body;
  try {
    let user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.displayName = displayName;
    await user.save();

    res.json({ id: user._id, email: user.email, displayName: user.displayName, isAnonymous: user.isAnonymous });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message, stack: err.stack });
  }
});

export default router;
