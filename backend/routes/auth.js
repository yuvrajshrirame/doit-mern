import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const router = express.Router();

// ── Token helpers ─────────────────────────────────────────────────────────────

const generateAccessToken = (user) =>
  jwt.sign(
    { user: { id: user._id, isAnonymous: user.isAnonymous } },
    process.env.ACCESS_TOKEN_SECRET || 'access_fallback_secret',
    { expiresIn: '15m' }
  );

const generateRefreshToken = (user) =>
  jwt.sign(
    { user: { id: user._id, isAnonymous: user.isAnonymous } },
    process.env.REFRESH_TOKEN_SECRET || 'refresh_fallback_secret',
    { expiresIn: '7d' }
  );

const isProduction = process.env.NODE_ENV === 'production';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,          // must be true for sameSite:'none' to work
  sameSite: isProduction ? 'none' : 'lax', // 'none' required for cross-origin (Vercel ↔ Render)
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: '/',
};

/**
 * Issue both tokens, persist the refresh token on the user document,
 * set it as an httpOnly cookie, and return the access token + public user data.
 */
const issueTokens = async (user, res) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshToken = refreshToken;
  await user.save();

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

  return {
    token: accessToken,
    user: {
      id: user._id,
      email: user.email,
      displayName: user.displayName,
      isAnonymous: user.isAnonymous,
    },
  };
};

// ── Routes ────────────────────────────────────────────────────────────────────

// @route   POST /api/auth/anonymous
// @desc    Sign in anonymously
router.post('/anonymous', async (req, res) => {
  try {
    const user = new User({ isAnonymous: true, displayName: 'Guest User' });
    await user.save();
    const payload = await issueTokens(user, res);
    res.json(payload);
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

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // issueTokens saves the user with refreshToken set
    const payload = await issueTokens(user, res);
    res.json(payload);
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
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const payload = await issueTokens(user, res);
    res.json(payload);
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

    const { email, name } = ticket.getPayload();

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, displayName: name, isAnonymous: false });
    }

    const payload = await issueTokens(user, res);
    res.json(payload);
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
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already linked to another account' });
    }

    const user = await User.findById(req.user.id);
    if (!user || !user.isAnonymous) {
      return res.status(400).json({ message: 'User is not anonymous or not found' });
    }

    user.email = email;
    user.displayName = displayName || user.displayName;
    user.isAnonymous = false;

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    const payload = await issueTokens(user, res);
    res.json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message, stack: err.stack });
  }
});

// @route   POST /api/auth/refresh
// @desc    Issue a new access token using the httpOnly refresh token cookie
router.post('/refresh', async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return res.status(401).json({ message: 'No refresh token' });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.REFRESH_TOKEN_SECRET || 'refresh_fallback_secret'
    );

    const user = await User.findById(decoded.user.id);

    if (!user || user.refreshToken !== token) {
      return res.status(403).json({ message: 'Refresh token invalid or reused' });
    }

    // Rotate the refresh token on every use
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE_OPTIONS);

    res.json({ token: newAccessToken });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(403).json({ message: 'Refresh token expired or invalid' });
  }
});

// @route   POST /api/auth/logout
// @desc    Clear the refresh token cookie and invalidate the stored token
router.post('/logout', async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (token) {
    try {
      const decoded = jwt.verify(
        token,
        process.env.REFRESH_TOKEN_SECRET || 'refresh_fallback_secret'
      );
      const user = await User.findById(decoded.user.id);
      if (user) {
        user.refreshToken = null;
        await user.save();
      }
    } catch (_) {
      // Token already expired — still clear the cookie
    }
  }

  res.clearCookie('refreshToken', { ...REFRESH_COOKIE_OPTIONS, maxAge: 0 });
  res.json({ message: 'Logged out' });
});

// @route   GET /api/auth/me
// @desc    Get user data
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -refreshToken');
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
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.displayName = displayName;
    await user.save();

    res.json({
      id: user._id,
      email: user.email,
      displayName: user.displayName,
      isAnonymous: user.isAnonymous,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message, stack: err.stack });
  }
});

export default router;
