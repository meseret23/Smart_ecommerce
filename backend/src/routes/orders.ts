import { Router, Request, Response } from 'express';
import { pool } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { PoolClient } from 'pg';
import axios from 'axios';

const router = Router();


export const createOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = Number(req.user?.id);

  if (!Number.isSafeInteger(userId) || userId <= 0) {
    res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
    return;
  }

  let client: PoolClient | undefined;
  let transactionStarted = false;

  try {
    client = await pool.connect();

    await client.query('BEGIN');
    transactionStarted = true;
    const cartResult = await client.query(
      `SELECT id
       FROM carts
       WHERE user_id = $1
       FOR UPDATE`,
      [userId]
    );

    if (cartResult.rows.length === 0) {
      await client.query('ROLLBACK');
      transactionStarted = false;

      res.status(404).json({
        success: false,
        message: 'Cart not found.',
      });
      return;
    }

    const cartId = Number(cartResult.rows[0].id);
    const itemsResult = await client.query(
      `SELECT
         ci.product_id,
         ci.quantity,
         p.name AS product_name,
         p.price,
         p.stock_quantity
       FROM cart_items AS ci
       JOIN products AS p ON p.id = ci.product_id
       WHERE ci.cart_id = $1
       ORDER BY p.id
       FOR UPDATE OF ci, p`,
      [cartId]
    );

    const items = itemsResult.rows;

    if (items.length === 0) {
      await client.query('ROLLBACK');
      transactionStarted = false;

      res.status(400).json({
        success: false,
        message: 'Your cart is empty.',
      });
      return;
    }

    let totalCents = 0;

    for (const item of items) {
      const quantity = Number(item.quantity);
      const stock = Number(item.stock_quantity);
      const price = Number(item.price);

      if (
        !Number.isSafeInteger(quantity) ||
        quantity <= 0 ||
        !Number.isFinite(price) ||
        price < 0
      ) {
        await client.query('ROLLBACK');
        transactionStarted = false;

        res.status(400).json({
          success: false,
          message: `Invalid cart data for ${item.product_name}.`,
        });
        return;
      }

      if (quantity > stock) {
        await client.query('ROLLBACK');
        transactionStarted = false;

        res.status(409).json({
          success: false,
          message: `Insufficient stock for ${item.product_name}.`,
          product_id: item.product_id,
          available_stock: stock,
          requested_quantity: quantity,
        });
        return;
      }

      const priceCents = Math.round(price * 100);
      totalCents += priceCents * quantity;

      if (!Number.isSafeInteger(totalCents)) {
        await client.query('ROLLBACK');
        transactionStarted = false;

        res.status(400).json({
          success: false,
          message: 'Order total is too large.',
        });
        return;
      }
    }

    const totalAmount = (totalCents / 100).toFixed(2);

    // STEP 4: Create the order.
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, total_amount)
       VALUES ($1, $2)
       RETURNING id, user_id, status, total_amount, created_at`,
      [userId, totalAmount]
    );

    const order = orderResult.rows[0];
    const orderId = order.id;

    // STEP 5: Create order items and safely reduce stock.
    for (const item of items) {
      const quantity = Number(item.quantity);

      const stockResult = await client.query(
        `UPDATE products
         SET stock_quantity = stock_quantity - $1
         WHERE id = $2
           AND stock_quantity >= $1
         RETURNING id`,
        [quantity, item.product_id]
      );

      if (stockResult.rowCount !== 1) {
        await client.query('ROLLBACK');
        transactionStarted = false;

        res.status(409).json({
          success: false,
          message: `Stock changed for ${item.product_name}. Please try again.`,
        });
        return;
      }

      await client.query(
        `INSERT INTO order_items
           (order_id, product_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.product_id, quantity, item.price]
      );
    }

    // STEP 6: Clear the cart only after order creation succeeds.
    await client.query(
      `DELETE FROM cart_items
       WHERE cart_id = $1`,
      [cartId]
    );

    // STEP 7: Commit all checkout changes together.
    await client.query('COMMIT');
    transactionStarted = false;

    res.status(201).json({
      success: true,
      message: 'Order created successfully.',
      order: {
        id: order.id,
        user_id: order.user_id,
        status: order.status,
        total_amount: order.total_amount,
        created_at: order.created_at,
      },
    });
  } catch (error) {
    if (client && transactionStarted) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Order transaction rollback failed:', rollbackError);
      }
    }

    console.error('Create order error:', error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Could not create your order. Please try again.',
      });
    }
  } finally {
    client?.release();
  }
};

export const getMyOrders = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
    return;
  }

  try {
    const sql = `
      SELECT *
      FROM orders
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;

    const result = await pool.query(sql, [userId]);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      orders: result.rows,
    });
  } catch (error) {
    console.error('Get my orders error:', error);

    res.status(500).json({
      success: false,
      message: 'Could not retrieve your orders.',
    });
  }
};


export const getOrderById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;
  const orderId = Number(req.params.order_id);

  if (!userId) {
    res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
    return;
  }

  if (!Number.isSafeInteger(orderId) || orderId <= 0) {
    res.status(400).json({
      success: false,
      message: 'Order ID must be a positive integer.',
    });
    return;
  }

  try {
    const orderSql = `
      SELECT *
      FROM orders
      WHERE user_id = $1 AND id = $2
    `;

    const orderResult = await pool.query(orderSql, [
      userId,
      orderId,
    ]);

    if (orderResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
      return;
    }

    const itemsSql = `
      SELECT
        oi.product_id,
        p.name AS product_name,
        oi.quantity,
        oi.unit_price
      FROM order_items AS oi
      JOIN products AS p ON p.id = oi.product_id
      WHERE oi.order_id = $1
      ORDER BY oi.id
    `;

    const itemsResult = await pool.query(itemsSql, [orderId]);

    res.status(200).json({
      success: true,
      order: orderResult.rows[0],
      items: itemsResult.rows,
    });
  } catch (error) {
    console.error('Get order by ID error:', error);

    res.status(500).json({
      success: false,
      message: 'Could not retrieve the order.',
    });
  }
};


export const updateOrderStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  const orderId = Number(req.params.order_id);
  const { status } = req.body;

  // STEP 1: Validate the order ID.
  if (!Number.isSafeInteger(orderId) || orderId <= 0) {
    res.status(400).json({
      success: false,
      message: 'Order ID must be a positive integer.',
    });
    return;
  }

  // STEP 2: Validate the requested status.
  const allowedStatuses = [
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
  ];

  if (
    typeof status !== 'string' ||
    !allowedStatuses.includes(status)
  ) {
    res.status(400).json({
      success: false,
      message: 'Invalid order status.',
      allowedStatuses,
    });
    return;
  }

  try {
    // STEP 3: Update the order in the database.
    const sql = `
      UPDATE orders
      SET status = $1,
          updated_at = NOW()
      WHERE id = $2
      RETURNING id, user_id, status, total_amount, created_at, updated_at
    `;

    const result = await pool.query(sql, [status, orderId]);

    // STEP 4: Check whether the order exists.
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
      return;
    }

    // STEP 5: Return the updated order.
    res.status(200).json({
      success: true,
      message: 'Order status updated successfully.',
      order: result.rows[0],
    });
  } catch (error) {
    console.error('Update order status error:', error);

    res.status(500).json({
      success: false,
      message: 'Could not update order status.',
    });
  }
};

export const initializePayment = async (req: Request, res: Response): Promise<void> => {
    const userId = Number(req.user?.id);
    const orderId = Number(req.params.order_id);

    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
        res.status(400).json({ success: false, message: 'Invalid order ID.' });
        return;
    }

    try {
        const orderQuery = `
            SELECT id, user_id, total_amount, status 
            FROM orders 
            WHERE id = $1 AND user_id = $2
        `;
        const orderResult = await pool.query(orderQuery, [orderId, userId]);

        if (orderResult.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Order not found.' });
            return;
        }

        const order = orderResult.rows[0];

        if (order.status !== 'pending') {
            res.status(400).json({ success: false, message: `Order is already ${order.status}.` });
            return;
        }

        const userQuery = `SELECT email, full_name FROM users WHERE id = $1`;
        const userResult = await pool.query(userQuery, [userId]);
        
        const userEmail = userResult.rows[0]?.email || 'customer@smartmarket.com';
        const fullName = userResult.rows[0]?.full_name || 'Customer';
        const nameParts = fullName.trim().split(' ');
        const firstName = nameParts[0] || 'Customer';
        const lastName = nameParts.slice(1).join(' ') || 'Customer';

        const tx_ref = `smartmarket-tx-${Date.now()}-${userId}-${orderId}`;
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';

        const chapaResponse = await axios.post(
            'https://api.chapa.co/v1/transaction/initialize',
            {
                amount: order.total_amount.toString(),
                currency: 'ETB',
                email: userEmail,
                first_name: firstName,
                last_name: lastName,
                tx_ref: tx_ref,
                callback_url: `${backendUrl}/api/orders/verify/${tx_ref}`,
                return_url: `http://localhost:3000/checkout/success?order_id=${orderId}`,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        res.status(200).json({
            success: true,
            message: 'Payment initialized successfully.',
            checkout_url: chapaResponse.data.data.checkout_url,
            tx_ref: tx_ref,
        });

    } catch (error: any) {
        console.error('Chapa payment initialization error:', error.response?.data || error.message);
        res.status(500).json({ success: false, message: 'Failed to initialize payment.' });
    }
};

export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
    const tx_ref = req.params.tx_ref as string;

    if (!tx_ref) {
        res.status(400).json({ success: false, message: 'Transaction reference is required.' });
        return;
    }

    try {
        // 1. Verify with Chapa API
        const chapaResponse = await axios.get(
            `https://api.chapa.co/v1/transaction/verify/${tx_ref}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
                },
            }
        );

        // Chapa's response structure: chapaResponse.data.data holds the transaction details
        const chapaData = chapaResponse.data;
        const transactionDetails = chapaData?.data;

        // Check if Chapa transaction is successful OR pending (for sandbox testing)
        const paymentStatus = transactionDetails?.status;

        if (paymentStatus === 'success' || paymentStatus === 'pending') {
            // 2. Extract orderId safely from tx_ref (e.g. "smartmarket-tx-TIMESTAMP-USERID-ORDERID")
            const parts = tx_ref.split('-');
            const orderId = parts[parts.length - 1];

            // 3. Update PostgreSQL order status to 'paid'
            const updateQuery = `
                UPDATE orders 
                SET status = 'paid', updated_at = NOW() 
                WHERE id = $1 
                RETURNING *;
            `;
            const updateResult = await pool.query(updateQuery, [orderId]);

            if (updateResult.rows.length === 0) {
                res.status(404).json({ success: false, message: 'Order not found in database.' });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Payment verified and order status updated to paid.',
                order: updateResult.rows[0],
                chapa_details: transactionDetails
            });
        } else {
            res.status(400).json({ 
                success: false, 
                message: `Payment status is ${paymentStatus}. Verification failed.` 
            });
        }
    } catch (error: any) {
        console.error('Detailed Verification Error:', error.response?.data || error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during verification.',
            error_details: error.response?.data || error.message 
        });
    }
};


router.get('/my', authenticateToken, getMyOrders);
router.get('/verify/:tx_ref', authenticateToken, verifyPayment);

router.post('/:order_id/pay', authenticateToken, initializePayment);
router.patch(
  '/:order_id/status',
  authenticateToken,
  requireRole('admin'),
  updateOrderStatus
);
router.get('/:order_id', authenticateToken, getOrderById);


router.post('/', authenticateToken, createOrder);
export default router;