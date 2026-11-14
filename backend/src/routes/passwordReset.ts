import {Router , Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Resend } from "resend";
import { pool } from '../db.js';

const resend = new Resend(process.env.RESEND_API_KEY);
const router = Router();

const genericMessage =
  "If an account exists with that email, a password reset link will be sent.";

export const requestPasswordReset = async (
  req: Request,
  res: Response
) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const userResult = await pool.query(
      "SELECT id, email FROM users WHERE LOWER(email) = $1",
      [normalizedEmail]
    );

    if (userResult.rows.length === 0) {
      return res.status(200).json({ message: genericMessage });
    }

    const user = userResult.rows[0];


    const rawToken = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await pool.query(
      `DELETE FROM password_reset_tokens
       WHERE user_id = $1`,
      [user.id]
    );

    await pool.query(
      `INSERT INTO password_reset_tokens
       (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, tokenHash, expiresAt]
    );

    const resetLink =
      `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;

    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: user.email,
      subject: "Reset your SmartMarket password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; padding: 30px;">
          <h2 style="color: #4f46e5;">Reset your password</h2>

          <p>We received a request to reset your SmartMarket password.</p>

          <p>Click the button below to choose a new password.</p>

          <a href="${resetLink}"
             style="display: inline-block; padding: 14px 24px;
             background: #4f46e5; color: white; text-decoration: none;
             border-radius: 8px; font-weight: bold;">
             Reset Password
          </a>

          <p>This link expires in 15 minutes and can only be used once.</p>

          <p>If you did not request this, you can ignore this email.</p>

          <p>SmartMarket Team</p>
        </div>
      `,
    });

    return res.status(200).json({ message: genericMessage });

  } catch (error) {
    console.error("Password reset request failed:", error);

    return res.status(500).json({
      message: "Unable to process your request right now.",
    });
  }
};


export const resetPassword = async (
  req: Request,
  res: Response
) => {
  const client = await pool.connect();

  try {
    const { token, newPassword } = req.body;

    if (
      typeof token !== "string" ||
      typeof newPassword !== "string" ||
      newPassword.length < 8 ||
      newPassword.length > 128
    ) {
      return res.status(400).json({
        message: "Please provide a valid token and a password of at least 8 characters.",
      });
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    await client.query("BEGIN");

    const tokenResult = await client.query(
      `SELECT id, user_id
       FROM password_reset_tokens
       WHERE token_hash = $1
       AND expires_at > NOW()
       AND used_at IS NULL
       FOR UPDATE`,
      [tokenHash]
    );

    if (tokenResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "This reset link is invalid or has expired.",
      });
    }

    const resetRecord = tokenResult.rows[0];

    const hashedPassword = await bcrypt.hash(newPassword, 12);

  await client.query(
  `UPDATE users
   SET password_hash = $1
   WHERE id = $2`,
  [hashedPassword, resetRecord.user_id]
);
    await client.query(
      `UPDATE password_reset_tokens
       SET used_at = NOW()
       WHERE user_id = $1`,
      [resetRecord.user_id]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      message: "Your password has been reset successfully.",
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Password reset failed:", error);

    return res.status(500).json({
      message: "Unable to reset your password right now.",
    });

  } finally {
    client.release();
  }
};

router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);
export default router;