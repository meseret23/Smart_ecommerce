
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
    const { full_name, emailOrPhone, password, role } = req.body ?? {};

    // 1. Basic type checking and validation
    if (
      typeof full_name !== 'string' ||
      typeof password !== 'string' ||
      !full_name.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: 'Full name and password are required.',
      });
    }

    const name = full_name.trim();

    if (name.length > 120) {
      return res.status(400).json({
        success: false,
        message: 'Full name must be 120 characters or fewer.',
      });
    }

    // Password length validation (bcrypt 72 byte limit check)
    if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({
        success: false,
        message: 'Password must be between 8 and 72 bytes.',
      });
    }

    // 2. Prevent unauthorized admin registration
    // Only allow 'customer' or 'seller' via public registration
    const userRole = role === 'seller' ? 'seller' : 'customer';

    // 3. Determine if input is Email or Phone number
    const inputStr = (emailOrPhone || req.body.email || req.body.phone || '').toString().trim();
    
    if (!inputStr) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address or phone number.',
      });
    }

    let email: string | null = null;
    let phone: string | null = null;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Ethiopian phone format check (supports 09..., 07..., or +251...)
    const phoneRegex = /^(?:\+251|0)?[79]\d{8}$/;

    if (emailRegex.test(inputStr)) {
      email = inputStr.toLowerCase();
    } else if (phoneRegex.test(inputStr)) {
      // Normalize Ethiopian phone number format to standard 09... / 07...
      phone = inputStr.startsWith('+251') ? '0' + inputStr.slice(4) : inputStr;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address or Ethiopian phone number (e.g. 0912345678).',
      });
    }

    // 4. Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, 12);

    // 5. Insert user into PostgreSQL (handling existing email or phone conflict)
    const result = await pool.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING
       RETURNING id, full_name, email, phone, role, created_at`,
      [name, email, phone, passwordHash, userRole]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email or phone number already exists.',
      });
    }

    const newUser = result.rows[0];

    // 6. Generate JWT token so the user is logged in automatically upon registration
    const token = jwt.sign(
      { id: newUser.id, role: newUser.role },
      getJwtSecret(),
      { subject: String(newUser.id), expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: newUser,
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
    const { identifier, password } = req.body ?? {};

    // Support legacy/alternative 'email' or 'phone' payload keys if sent by frontend
    const loginInput = identifier || req.body?.email || req.body?.phone;

    if (
      typeof loginInput !== 'string' ||
      typeof password !== 'string' ||
      !loginInput.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: 'Phone/Email and password are required.',
      });
    }

    const normalizedInput = loginInput.trim().toLowerCase();

    // Query database for matching email OR matching phone number
    const result = await pool.query(
      `SELECT id, full_name, email, phone, password_hash, role
       FROM users
       WHERE LOWER(email) = $1 OR phone = $1`,
      [normalizedInput]
    );

    const user = result.rows[0];

   
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }


    const token = jwt.sign(
      { id: user.id, role: user.role },
      getJwtSecret(),
      {
        subject: String(user.id),
        expiresIn: '7d', 
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);

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
