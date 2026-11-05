import { Router, Request, Response } from 'express';
import { pool } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { PoolClient } from 'pg';
import axios from 'axios';

const router = Router();
export const getAllOrders = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const sql = `
      SELECT
        o.*,
        u.full_name AS customer_name,
        u.email AS customer_email
      FROM orders AS o
      LEFT JOIN users AS u ON u.id = o.user_id
      ORDER BY o.created_at DESC
    `;

    const result = await pool.query(sql);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      orders: result.rows,
    });
  } catch (error) {
    console.error('Get all orders error:', error);

    res.status(500).json({
      success: false,
      message: 'Could not retrieve orders.',
    });
  }
};



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

    // STEP 1: Lock the customer's cart
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

    // STEP 2: Detect missing or inactive products
    const invalidItemsResult = await client.query(
      `SELECT
         ci.product_id,
         p.name AS product_name,
         p.is_active
       FROM cart_items AS ci
       LEFT JOIN products AS p ON p.id = ci.product_id
       WHERE ci.cart_id = $1
         AND (p.id IS NULL OR p.is_active = FALSE)
       FOR UPDATE OF ci`,
      [cartId]
    );

    if (invalidItemsResult.rows.length > 0) {
      await client.query('ROLLBACK');
      transactionStarted = false;

      res.status(409).json({
        success: false,
        message: 'Some products in your cart are no longer available.',
        unavailable_items: invalidItemsResult.rows,
      });
      return;
    }

    // STEP 3: Fetch available cart items and lock products
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
         AND p.is_active = TRUE
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

    // STEP 4: Validate quantities, stock, and prices
    let totalCents = 0;

    for (const item of items) {
      const quantity = Number(item.quantity);
      const stock = Number(item.stock_quantity);
      const price = Number(item.price);

      if (
        !Number.isSafeInteger(quantity) ||
        quantity <= 0 ||
        !Number.isSafeInteger(stock) ||
        stock < 0 ||
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

    // STEP 5: Create the order
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, total_amount)
       VALUES ($1, $2)
       RETURNING id, user_id, status, total_amount, created_at`,
      [userId, totalAmount]
    );

    const order = orderResult.rows[0];
    const orderId = order.id;

    // STEP 6: Create order items and reduce stock
    for (const item of items) {
      const quantity = Number(item.quantity);

      const stockResult = await client.query(
        `UPDATE products
         SET stock_quantity = stock_quantity - $1
         WHERE id = $2
           AND stock_quantity >= $1
           AND is_active = TRUE
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

    // STEP 7: Clear the cart
    await client.query(
      `DELETE FROM cart_items
       WHERE cart_id = $1`,
      [cartId]
    );

    // STEP 8: Commit transaction
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
        console.error(
          'Order transaction rollback failed:',
          rollbackError
        );
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
      SELECT
        o.*,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', oi.id,
              'product_id', oi.product_id,
              'product_name', p.name,
              'image_url', p.image_url,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'::json
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
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
  'paid',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'completed',
  'cancelled',
  'failed',
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
    console.log("Updating order:", {
  orderId,
  status,
  database: (await pool.query("SELECT current_database()")).rows[0],
});

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

export const initializePayment = async (
    req: Request,
    res: Response
): Promise<void> => {
    const userId = Number(req.user?.id);
    const orderId = Number(req.params.order_id);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
        res.status(401).json({
            success: false,
            message: 'Please log in to continue.'
        });
        return;
    }

    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
        res.status(400).json({
            success: false,
            message: 'Invalid order ID.'
        });
        return;
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Find and lock the order
        const orderResult = await client.query(
            `SELECT id, user_id, total_amount, status
             FROM orders
             WHERE id = $1 AND user_id = $2
             FOR UPDATE`,
            [orderId, userId]
        );

        if (orderResult.rows.length === 0) {
            await client.query('ROLLBACK');
            res.status(404).json({
                success: false,
                message: 'Order not found.'
            });
            return;
        }

        const order = orderResult.rows[0];

        if (order.status !== 'pending') {
            await client.query('ROLLBACK');
            res.status(400).json({
                success: false,
                message: `Order is already ${order.status}.`
            });
            return;
        }

        // 2. Get customer information
        const userResult = await client.query(
            `SELECT email, full_name
             FROM users
             WHERE id = $1`,
            [userId]
        );

        if (userResult.rows.length === 0 || !userResult.rows[0].email) {
            await client.query('ROLLBACK');
            res.status(400).json({
                success: false,
                message: 'A valid customer email is required for payment.'
            });
            return;
        }

        const user = userResult.rows[0];
        const nameParts = (user.full_name || 'Customer').trim().split(/\s+/);

        const firstName = nameParts[0] || 'Customer';
        const lastName = nameParts.slice(1).join(' ') || 'Customer';

        // 3. Generate a unique Chapa transaction reference
        const txRef = `smartmarket-tx-${Date.now()}-${userId}-${orderId}`;

        // 4. Create a pending payment record
        const paymentResult = await client.query(
            `INSERT INTO payments (
                order_id,
                amount,
                status,
                payment_method,
                provider_reference
            )
            VALUES ($1, $2, 'pending', 'Chapa', $3)
            RETURNING id`,
            [orderId, order.total_amount, txRef]
        );

        const paymentId = paymentResult.rows[0].id;

        await client.query('COMMIT');

        // 5. Initialize payment with Chapa
        const backendUrl = (
            process.env.BACKEND_URL || 'http://localhost:5000'
        ).replace(/\/$/, '');

        const frontendUrl = (
            process.env.FRONTEND_URL || 'http://localhost:5173'
        ).replace(/\/$/, '');

        const chapaResponse = await axios.post(
            'https://api.chapa.co/v1/transaction/initialize',
            {
                amount: Number(order.total_amount).toFixed(2),
                currency: 'ETB',
                email: user.email,
                first_name: firstName,
                last_name: lastName,
                tx_ref: txRef,
                callback_url: `${backendUrl}/api/orders/verify/${txRef}`,
                return_url: `${frontendUrl}/checkout/success?order_id=${orderId}`
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const checkoutUrl = chapaResponse.data?.data?.checkout_url;

        if (!checkoutUrl) {
            throw new Error('Chapa did not return a checkout URL.');
        }

        res.status(200).json({
            success: true,
            message: 'Payment initialized successfully.',
            checkout_url: checkoutUrl,
            tx_ref: txRef,
            payment_id: paymentId
        });

    } catch (error: any) {
        await client.query('ROLLBACK').catch(() => {});

        console.error(
            'Chapa payment initialization error:',
            error.response?.data || error.message
        );

        res.status(500).json({
            success: false,
            message: 'Failed to initialize payment.'
        });

    } finally {
        client.release();
    }
};


export const verifyPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  const tx_ref = req.params.tx_ref;

  if (!tx_ref) {
    res.status(400).json({
      success: false,
      message: 'Transaction reference is required.',
    });
    return;
  }

  let client: PoolClient | undefined;
  let transactionStarted = false;

  try {
    // STEP 1: Find the payment using its transaction reference
    const paymentResult = await pool.query(
      `SELECT id, order_id, amount, status, provider_reference
       FROM payments
       WHERE provider_reference = $1`,
      [tx_ref]
    );

    if (paymentResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Payment record not found.',
      });
      return;
    }

    const payment = paymentResult.rows[0];

    // STEP 2: Ask Chapa to verify the transaction
    const chapaResponse = await axios.get(
      `https://api.chapa.co/v1/transaction/verify/${encodeURIComponent(tx_ref)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        },
      }
    );

    const transactionDetails = chapaResponse.data?.data;

    if (!transactionDetails) {
      res.status(400).json({
        success: false,
        message: 'Invalid response from Chapa.',
      });
      return;
    }

    // STEP 3: Only accept a successful payment
    if (transactionDetails.status !== 'success') {
      res.status(400).json({
        success: false,
        message: `Payment is not successful. Current status: ${transactionDetails.status || 'unknown'}.`,
      });
      return;
    }

    // STEP 4: Confirm transaction reference
    if (transactionDetails.tx_ref !== tx_ref) {
      res.status(400).json({
        success: false,
        message: 'Transaction reference mismatch.',
      });
      return;
    }

    // STEP 5: Confirm payment amount and currency
    const chapaAmount = Number(transactionDetails.amount);
    const databaseAmount = Number(payment.amount);

    if (
      !Number.isFinite(chapaAmount) ||
      Math.round(chapaAmount * 100) !==
        Math.round(databaseAmount * 100)
    ) {
      res.status(400).json({
        success: false,
        message: 'Payment amount does not match the order.',
      });
      return;
    }

    if (transactionDetails.currency !== 'ETB') {
      res.status(400).json({
        success: false,
        message: 'Payment currency does not match.',
      });
      return;
    }

    // STEP 6: Update payment and order atomically
    client = await pool.connect();

    await client.query('BEGIN');
    transactionStarted = true;

    const lockedPayment = await client.query(
      `SELECT id, order_id, amount, status
       FROM payments
       WHERE provider_reference = $1
       FOR UPDATE`,
      [tx_ref]
    );

    if (lockedPayment.rows.length === 0) {
      throw new Error('Payment record no longer exists.');
    }

    const currentPayment = lockedPayment.rows[0];

    // Protect against duplicate verification requests
    if (currentPayment.status === 'success') {
      const existingOrder = await client.query(
        `SELECT id, user_id, status, total_amount, created_at
         FROM orders
         WHERE id = $1`,
        [currentPayment.order_id]
      );

      await client.query('COMMIT');
      transactionStarted = false;

      res.status(200).json({
        success: true,
        message: 'Payment was already verified.',
        order: existingOrder.rows[0],
      });
      return;
    }

    const lockedOrder = await client.query(
      `SELECT id, total_amount, status
       FROM orders
       WHERE id = $1
       FOR UPDATE`,
      [currentPayment.order_id]
    );

    if (lockedOrder.rows.length === 0) {
      throw new Error('Associated order not found.');
    }

    const order = lockedOrder.rows[0];

    if (
      Math.round(Number(order.total_amount) * 100) !==
      Math.round(Number(currentPayment.amount) * 100)
    ) {
      throw new Error('Payment amount does not match the order total.');
    }

    if (order.status !== 'pending' && order.status !== 'paid') {
      throw new Error('Order is not eligible for payment confirmation.');
    }

    // Update payment record
    await client.query(
      `UPDATE payments
       SET status = 'success'
       WHERE id = $1`,
      [currentPayment.id]
    );

    // Update order record
    const updatedOrder = await client.query(
      `UPDATE orders
       SET status = 'paid',
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, user_id, status, total_amount, created_at`,
      [currentPayment.order_id]
    );

    await client.query('COMMIT');
    transactionStarted = false;

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully.',
      order: updatedOrder.rows[0],
    });

  } catch (error: any) {
    if (client && transactionStarted) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Payment rollback failed:', rollbackError);
      }
    }

    console.error(
      'Payment verification error:',
      error.response?.data || error.message
    );

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Could not verify payment. Please try again.',
      });
    }

  } finally {
    client?.release();
  }
};



export const getOrderStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = Number(req.user?.id);
  const orderId = Number(req.params.order_id);

  if (!Number.isSafeInteger(userId) || userId <= 0) {
    res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
    return;
  }

  if (!Number.isSafeInteger(orderId) || orderId <= 0) {
    res.status(400).json({
      success: false,
      message: 'Invalid order ID.',
    });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT
         o.id,
         o.user_id,
         o.status,
         o.total_amount,
         o.created_at,
         (
           SELECT p.status
           FROM payments p
           WHERE p.order_id = o.id
           ORDER BY p.created_at DESC, p.id DESC
           LIMIT 1
         ) AS payment_status
       FROM orders o
       WHERE o.id = $1
         AND o.user_id = $2`,
      [orderId, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      order: result.rows[0],
    });
  } catch (error) {
    console.error('Get order status error:', error);

    res.status(500).json({
      success: false,
      message: 'Could not retrieve order status.',
    });
  }
};


router.get(
  '/:order_id/status',
  authenticateToken,
  getOrderStatus
);


router.post(
  '/:order_id/pay',
  authenticateToken,
  initializePayment
);


router.get(
  '/verify/:tx_ref',
  verifyPayment
);

router.get(
  '/',
  authenticateToken,
  requireRole('admin'),
  getAllOrders
);

router.get(
  '/my',
  authenticateToken,
  getMyOrders
);

router.patch(
  '/:order_id/status',
  authenticateToken,
  requireRole('admin'),
  updateOrderStatus
);

router.get(
  '/:order_id',
  authenticateToken,
  getOrderById
);

router.post(
  '/',
  authenticateToken,
  createOrder
);

export default router;
