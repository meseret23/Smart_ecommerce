
import { Router, type Request, type Response } from 'express';
import { pool } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Get the logged-in user's notifications
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ success: false, message: 'Unauthorized.' });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT id, user_id, order_id, message, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );

    const unreadResult = await pool.query(
      `SELECT COUNT(*) AS unread_count
       FROM notifications
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );

    res.status(200).json({
      success: true,
      notifications: result.rows,
      unread_count: Number(unreadResult.rows[0].unread_count),
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch notifications.',
    });
  }
});

// Mark one notification as read
router.patch('/:id/read', authenticateToken, async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const notificationId = Number(req.params.id);

  if (!userId) {
    res.status(401).json({ success: false, message: 'Unauthorized.' });
    return;
  }

  if (!Number.isInteger(notificationId) || notificationId <= 0) {
    res.status(400).json({
      success: false,
      message: 'Invalid notification ID.',
    });
    return;
  }

  try {
    const result = await pool.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [notificationId, userId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({
        success: false,
        message: 'Notification not found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to update notification.',
    });
  }
});

// Mark all of the logged-in user's notifications as read
router.patch('/read-all', authenticateToken, async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ success: false, message: 'Unauthorized.' });
    return;
  }

  try {
    await pool.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to update notifications.',
    });
  }
});

export default router;
