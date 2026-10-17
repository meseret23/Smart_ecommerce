
import { Router } from 'express';
import { pool } from '../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not configured.');
  }

  return secret;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, password } = req.body ?? {};

    if (
      typeof full_name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !full_name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, and password are required.',
      });
    }

    const name = full_name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (name.length > 120) {
      return res.status(400).json({
        success: false,
        message: 'Full name must be 120 characters or fewer.',
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    if (
      password.length < 8 ||
      Buffer.byteLength(password, 'utf8') > 72
    ) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters and no more than 72 bytes.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING
       RETURNING id, full_name, email, role, created_at`,
      [name, normalizedEmail, passwordHash, 'customer'],
    );

    if (result.rows.length === 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Registration failed:', error);

    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred during registration.',
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const result = await pool.query(
      `SELECT id, full_name, email, password_hash, role
       FROM users
       WHERE email = $1`,
      [normalizedEmail],
    );

    const user = result.rows[0];

    // Use the same response for an unknown email and wrong password.
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = jwt.sign(
      { role: user.role },
      getJwtSecret(),
      {
        subject: String(user.id),
        expiresIn: '2h',
      },
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login failed:', error);

    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred during login.',
    });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, full_name, email, role, created_at
       FROM users
       WHERE id = $1`,
      [req.user!.id],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists.',
      });
    }

    return res.status(200).json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Fetching current user failed:', error);

    return res.status(500).json({
      success: false,
      message: 'Could not retrieve the current user.',
    });
  }
});

export default router;
