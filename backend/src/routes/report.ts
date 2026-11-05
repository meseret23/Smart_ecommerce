
import { Router, type Request, type Response } from 'express';
import { pool } from '../db.js';
import {
  authenticateToken,
  requireRole,
} from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = Router();

// CUSTOMER: Submit a damaged-product report

const createIssueReport = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = Number(req.user?.id);
    const { order_id, product_id, description } = req.body;

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
      return;
    }

    const orderId = Number(order_id);
    const productId = Number(product_id);

    if (
      !Number.isSafeInteger(orderId) ||
      orderId <= 0 ||
      !Number.isSafeInteger(productId) ||
      productId <= 0 ||
      typeof description !== 'string' ||
      !description.trim()
    ) {
      res.status(400).json({
        success: false,
        message: 'Valid order, product, and description are required.'
      });
      return;
    }

    if (description.trim().length > 2000) {
      res.status(400).json({
        success: false,
        message: 'Description cannot exceed 2000 characters.'
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'A photo of the damaged product is required.'
      });
      return;
    }

    // Verify order ownership, delivery status, and product membership
    const checkQuery = `
      SELECT oi.id
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      WHERE o.id = $1
        AND o.user_id = $2
        AND o.status IN ('delivered', 'completed')
        AND oi.product_id = $3
    `;

    const checkResult = await pool.query(checkQuery, [
      orderId,
      userId,
      productId
    ]);

    if (checkResult.rows.length === 0) {
      res.status(403).json({
        success: false,
        message: 'You can only report products from your own delivered orders.'
      });
      return;
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    // Prevent duplicate reports for the same purchased item
    const existingReport = await pool.query(
      `SELECT id FROM reports
       WHERE user_id = $1
         AND order_id = $2
         AND product_id = $3
         AND category = 'damaged'
         AND status <> 'rejected'`,
      [userId, orderId, productId]
    );

    if (existingReport.rows.length > 0) {
      res.status(409).json({
        success: false,
        message: 'A report already exists for this product.'
      });
      return;
    }

    // Save the damage report
    const insertQuery = `
      INSERT INTO reports (
        user_id,
        order_id,
        product_id,
        category,
        description,
        image_url
      )
      VALUES ($1, $2, $3, 'damaged', $4, $5)
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      userId,
      orderId,
      productId,
      description.trim(),
      imageUrl
    ]);

    const report = result.rows[0];

    // Notify all admins about the new damage report
    try {
      await pool.query(
        `INSERT INTO notifications (user_id, order_id, message)
         SELECT id, $1, $2
         FROM users
         WHERE role = 'admin'`,
        [
          orderId,
          `A customer submitted a damage report for product #${productId}, order #${orderId}.`
        ]
      );
    } catch (notificationError) {
      console.error('Could not notify admins:', notificationError);
    }

    res.status(201).json({
      success: true,
      message: 'Damaged-product report submitted successfully.',
      report
    });

  } catch (error) {
    console.error('Error creating damage report:', error);

    res.status(500).json({
      success: false,
      message: 'Could not submit your report.'
    });
  }
};

// CUSTOMER: View their own reports
const getIssueReports = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = Number(req.user?.id);

    const result = await pool.query(
      `SELECT r.*, p.name AS product_name
       FROM reports r
       LEFT JOIN products p ON p.id = r.product_id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );

    res.status(200).json({
      success: true,
      reports: result.rows
    });

  } catch (error) {
    console.error('Error fetching customer reports:', error);

    res.status(500).json({
      success: false,
      message: 'Could not retrieve reports.'
    });
  }
};

// ADMIN: View all damaged-product reports
const getAllIssueReports = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT
         r.*,
         p.name AS product_name,
         u.full_name AS customer_name,
         u.email AS customer_email
       FROM reports r
       LEFT JOIN products p ON p.id = r.product_id
       LEFT JOIN users u ON u.id = r.user_id
       WHERE r.category = 'damaged'
       ORDER BY r.created_at DESC`
    );

    res.status(200).json({
      success: true,
      reports: result.rows
    });

  } catch (error) {
    console.error('Error fetching admin reports:', error);

    res.status(500).json({
      success: false,
      message: 'Could not retrieve reports.'
    });
  }
};

// ADMIN: Update report status and notes


const updateReportStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const reportId = Number(req.params.id);
    const { status, admin_notes } = req.body;

    const allowedStatuses = [
      'pending',
      'in_review',
      'resolved',
      'rejected'
    ];

    if (
      !Number.isSafeInteger(reportId) ||
      reportId <= 0 ||
      !allowedStatuses.includes(status)
    ) {
      res.status(400).json({
        success: false,
        message: 'Invalid report ID or status.'
      });
      return;
    }

    if (
      admin_notes !== undefined &&
      admin_notes !== null &&
      typeof admin_notes !== 'string'
    ) {
      res.status(400).json({
        success: false,
        message: 'Admin notes must be valid text.'
      });
      return;
    }

    if (
      typeof admin_notes === 'string' &&
      admin_notes.trim().length > 2000
    ) {
      res.status(400).json({
        success: false,
        message: 'Admin notes cannot exceed 2000 characters.'
      });
      return;
    }

    // Update the report
    const result = await pool.query(
      `UPDATE reports
       SET status = $1,
           admin_notes = $2,
           updated_at = NOW()
       WHERE id = $3
         AND category = 'damaged'
       RETURNING *`,
      [
        status,
        typeof admin_notes === 'string'
          ? admin_notes.trim()
          : null,
        reportId
      ]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Report not found.'
      });
      return;
    }

    const report = result.rows[0];

    // Notify the customer about the report update
    try {
      let notificationMessage =
        `Your damage report #${report.id} has been updated. ` +
        `New status: ${status.replace('_', ' ')}.`;

      if (
        typeof admin_notes === 'string' &&
        admin_notes.trim()
      ) {
        notificationMessage += ` Admin response: ${admin_notes.trim()}`;
      }

      await pool.query(
        `INSERT INTO notifications (
           user_id,
           order_id,
           message
         )
         VALUES ($1, $2, $3)`,
        [
          report.user_id,
          report.order_id,
          notificationMessage
        ]
      );
    } catch (notificationError) {
      console.error(
        'Could not notify customer:',
        notificationError
      );
    }

    res.status(200).json({
      success: true,
      message: 'Report updated successfully.',
      report
    });

  } catch (error) {
    console.error('Error updating report:', error);

    res.status(500).json({
      success: false,
      message: 'Could not update report.'
    });
  }
};



// CUSTOMER ROUTES
router.post(
  '/',
  authenticateToken,
  upload.single('damage_image'),
  createIssueReport
);

router.get(
  '/',
  authenticateToken,
  getIssueReports
);

// ADMIN ROUTES
router.get(
  '/admin',
  authenticateToken,
  requireRole('admin'),
  getAllIssueReports
);

router.patch(
  '/:id/status',
  authenticateToken,
  requireRole('admin'),
  updateReportStatus
);

export default router;
