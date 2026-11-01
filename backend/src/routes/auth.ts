
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

router.post('/register', async (req, res) => {
  try {
    const { full_name, fullName, email, phone, password, role = 'customer' } = req.body ?? {};
    const validRoles = ['customer', 'seller', 'admin'];
    const userRole = validRoles.includes(role) ? role : 'customer';

    const nameInput = (full_name || fullName)?.trim();

    // 1. Basic Type & Presence Validation
    if (
      !nameInput ||
      typeof email !== 'string' ||
      typeof phone !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !phone.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, phone number, and password are required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    // 2. Name Length Check
    if (nameInput.length > 120) {
      return res.status(400).json({
        success: false,
        message: 'Full name must be 120 characters or fewer.',
      });
    }

    // 3. Email Format Check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    // 4. Ethiopian Phone Format Check (09..., 07..., or +251...)
    const ethiopianPhoneRegex = /^(?:\+251|0)[97]\d{8}$/;
    if (!ethiopianPhoneRegex.test(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid Ethiopian phone number (e.g., 0911223344 or +251911223344).',
      });
    }

    // 5. Password Security Check
    if (
      password.length < 8 ||
      Buffer.byteLength(password, 'utf8') > 72
    ) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters and no more than 72 bytes.',
      });
    }

    // 6. Hash Password
    const passwordHash = await bcrypt.hash(password, 12);

    // 7. Insert into PostgreSQL
    const result = await pool.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING
       RETURNING id, full_name, email, phone, role, created_at`,
      [nameInput, normalizedEmail, normalizedPhone, passwordHash, userRole]
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
