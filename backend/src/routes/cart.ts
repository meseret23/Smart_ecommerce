
import { Router, type Request, type Response } from 'express';
import { pool } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

const getCartItems = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // The user ID comes from our verified authentication token.
    const userId = Number(req.user!.id);

    const sql = `
      SELECT
        p.id AS product_id,
        p.name,
        p.price,
        ci.quantity,
        (p.price * ci.quantity) AS item_subtotal
      FROM carts c
      JOIN cart_items ci ON ci.cart_id = c.id
      JOIN products p ON p.id = ci.product_id
      WHERE c.user_id = $1
      ORDER BY ci.added_at DESC;
    `;

    const result = await pool.query(sql, [userId]);

    const items = result.rows;

    const cartSubtotal = items.reduce(
      (total: number, item: { item_subtotal: string | number }) =>
        total + Number(item.item_subtotal),
      0,
    );

    res.status(200).json({
      success: true,
      items,
      itemCount: items.reduce(
        (total: number, item: { quantity: number }) =>
          total + Number(item.quantity),
        0,
      ),
      cartSubtotal: cartSubtotal.toFixed(2),
    });
  } catch (error) {
    console.error('Failed to retrieve cart:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve your cart.',
    });
  }
};


const addToCart = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { product_id, quantity } = req.body ?? {};

  // STEP 1: Validate the client's input.
  if (
    !Number.isInteger(product_id) ||
    product_id <= 0 ||
    !Number.isInteger(quantity) ||
    quantity <= 0
  ) {
    res.status(400).json({
      success: false,
      message: 'Product ID and quantity must be positive integers.',
    });
    return;
  }

  let client;

  try {
    // STEP 2: Get a database connection and start a transaction.
    client = await pool.connect();
    await client.query('BEGIN');

    // STEP 3: Find the product and lock its row.
    const productResult = await client.query(
      `SELECT id, name, price, stock_quantity
       FROM products
       WHERE id = $1
       FOR UPDATE`,
      [product_id],
    );

    if (productResult.rows.length === 0) {
      await client.query('ROLLBACK');

      res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
      return;
    }

    const product = productResult.rows[0];
    const stock = Number(product.stock_quantity);

    // STEP 4: Identify the authenticated customer.
    const userId = Number(req.user!.id);

    // Create a cart if this customer doesn't have one yet.
    await client.query(
      `INSERT INTO carts (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId],
    );

    const cartResult = await client.query(
      'SELECT id FROM carts WHERE user_id = $1',
      [userId],
    );

    const cartId = cartResult.rows[0].id;

    // STEP 5: Find the current quantity of this product.
    const existingResult = await client.query(
      `SELECT quantity
       FROM cart_items
       WHERE cart_id = $1 AND product_id = $2`,
      [cartId, product_id],
    );

    const existingQuantity =
      existingResult.rows.length > 0
        ? Number(existingResult.rows[0].quantity)
        : 0;

    const newQuantity = existingQuantity + quantity;

    // STEP 6: Check the combined quantity against stock.
    if (newQuantity > stock) {
      await client.query('ROLLBACK');

      res.status(409).json({
        success: false,
        message: 'Requested quantity exceeds available stock.',
        availableStock: stock,
        quantityAlreadyInCart: existingQuantity,
      });
      return;
    }

    // STEP 7: Insert the item or increase its existing quantity.
    const itemResult = await client.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (cart_id, product_id)
       DO UPDATE SET
         quantity = cart_items.quantity + EXCLUDED.quantity,
         added_at = NOW()
       RETURNING product_id, quantity`,
      [cartId, product_id, quantity],
    );

    // STEP 8: Commit the transaction.
    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      message: 'Product added to cart successfully.',
      item: {
        ...itemResult.rows[0],
        name: product.name,
        price: product.price,
      },
    });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK').catch(() => undefined);
    }

    console.error('Failed to add product to cart:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to add product to cart.',
    });
  } finally {
    client?.release();
  }
};

router.post('/', authenticateToken, addToCart);
router.get('/', authenticateToken, getCartItems);

export default router;
