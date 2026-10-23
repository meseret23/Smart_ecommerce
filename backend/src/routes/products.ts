import { Router, type Request, type Response } from 'express';
import { pool } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

const getProductByName = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { name } = req.params;

  try {
    const sql = 'SELECT * FROM products WHERE name = $1';
    const result = await pool.query(sql, [name]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Product not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Failed to fetch product:', error);

    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const getProductById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({
      success: false,
      message: 'Product ID must be a positive integer',
    });
    return;
  }

  try {
    const sql = `
      SELECT
        id,
        name,
        description,
        price,
        stock_quantity,
        created_at,
        seller_id,
        category_id
      FROM products
      WHERE id = $1
    `;

    const result = await pool.query(sql, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Product not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Failed to fetch product by ID:', error);

    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const getAllProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { search, categoryId, sortBy, order, page, limit } = req.query;

    // Validate search input
    if (search !== undefined && typeof search !== 'string') {
      res.status(400).json({
        success: false,
        message: 'search must be a string',
      });
      return;
    }

    // Validate category ID
    let parsedCategoryId: number | undefined;

    if (categoryId !== undefined) {
      parsedCategoryId = Number(categoryId);

      if (
        typeof categoryId !== 'string' ||
        !Number.isInteger(parsedCategoryId) ||
        parsedCategoryId <= 0
      ) {
        res.status(400).json({
          success: false,
          message: 'categoryId must be a positive integer',
        });
        return;
      }
    }

    // Validate sorting
    const allowedSortFields: Record<string, string> = {
      name: 'name',
      price: 'price',
      created_at: 'created_at',
    };

    const selectedSort =
      typeof sortBy === 'string' ? sortBy : 'created_at';

    if (!Object.hasOwn(allowedSortFields, selectedSort)) {
      res.status(400).json({
        success: false,
        message: 'sortBy must be name, price, or created_at',
      });
      return;
    }

    const selectedOrder =
      typeof order === 'string' ? order.toLowerCase() : 'desc';

    if (!['asc', 'desc'].includes(selectedOrder)) {
      res.status(400).json({
        success: false,
        message: 'order must be asc or desc',
      });
      return;
    }

    // Validate pagination
    const parsedPage = page === undefined ? 1 : Number(page);
    const parsedLimit = limit === undefined ? 10 : Number(limit);

    if (
      (typeof page !== 'undefined' &&
        (typeof page !== 'string' ||
          !Number.isInteger(parsedPage) ||
          parsedPage < 1)) ||
      (typeof limit !== 'undefined' &&
        (typeof limit !== 'string' ||
          !Number.isInteger(parsedLimit) ||
          parsedLimit < 1 ||
          parsedLimit > 50))
    ) {
      res.status(400).json({
        success: false,
        message: 'page must be positive; limit must be between 1 and 50',
      });
      return;
    }

    // Build safe WHERE conditions
    const conditions: string[] = [];
    const values: (string | number)[] = [];

    if (typeof search === 'string' && search.trim() !== '') {
      values.push(`%${search.trim()}%`);
      conditions.push(`name ILIKE $${values.length}`);
    }

    if (parsedCategoryId !== undefined) {
      values.push(parsedCategoryId);
      conditions.push(`category_id = $${values.length}`);
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

    // Count matching products before pagination
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM products
      ${whereClause}
    `;

    const countResult = await pool.query(countSql, values);
    const total: number = countResult.rows[0].total;

    // Retrieve the requested page
    const offset = (parsedPage - 1) * parsedLimit;
    const dataValues = [...values, parsedLimit, offset];

    const sql = `
      SELECT
        id,
        name,
        description,
        price,
        stock_quantity,
        created_at,
        seller_id,
        category_id
      FROM products
      ${whereClause}
      ORDER BY ${allowedSortFields[selectedSort]} ${selectedOrder.toUpperCase()}, id ASC
      LIMIT $${dataValues.length - 1}
      OFFSET $${dataValues.length}
    `;

    const result = await pool.query(sql, dataValues);

    res.status(200).json({
      success: true,
      data: result.rows,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch products:', error);

    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const createProductReview = async (req: Request, res: Response): Promise<void> => {
  try {
   const { id: product_id } = req.params;
    const user_id = req.user?.id;
    const { rating, comment } = req.body;

    // 1. Validation
    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ message: 'Rating must be between 1 and 5' });
      return;
    }

    // 2. Verified Purchase Check
    const checkSql = `
      SELECT 1 
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = $1 
        AND oi.product_id = $2 
        AND o.status = 'delivered';
    `;
    const checkResult = await pool.query(checkSql, [user_id, product_id]);

    if (checkResult.rows.length === 0) {
      res.status(403).json({ message: 'Only customers with delivered orders can review this product' });
      return;
    }

    // 3. Insert or Update Review (Upsert)
    const upsertSql = `
      INSERT INTO reviews (user_id, product_id, rating, comment) 
      VALUES ($1, $2, $3, $4) 
      ON CONFLICT (user_id, product_id) 
      DO UPDATE SET 
        rating = EXCLUDED.rating, 
        comment = EXCLUDED.comment,
        created_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    const reviewResult = await pool.query(upsertSql, [user_id, product_id, rating, comment]);

    res.status(200).json({
      message: 'Review saved successfully',
      review: reviewResult.rows[0]
    });

  } catch (error: any) {
    console.error('Error saving review:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Controller: Get reviews and summary stats for a product
const getProductReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: product_id } = req.params;

    // 1. Fetch all reviews for the product, joined with user details
   // 1. Fetch all reviews for the product, joined with user details
    const reviewsQuery = `
      SELECT r.id, r.rating, r.comment, r.created_at, u.full_name AS user_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = $1
      ORDER BY r.created_at DESC;
    `;
    const reviewsResult = await pool.query(reviewsQuery, [product_id]);

    // 2. Calculate average rating and total review count
    const statsQuery = `
      SELECT 
        COALESCE(AVG(rating), 0) AS average_rating, 
        COUNT(*) AS total_reviews
      FROM reviews
      WHERE product_id = $1;
    `;
    const statsResult = await pool.query(statsQuery, [product_id]);
    const stats = statsResult.rows[0];

    // 3. Send response
    res.status(200).json({
      average_rating: parseFloat(stats.average_rating).toFixed(1),
      total_reviews: parseInt(stats.total_reviews, 10),
      reviews: reviewsResult.rows
    });

  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
// Controller: Delete a review
const deleteReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: review_id } = req.params;
    const user_id = req.user?.id;
    const deleteSql = `
      DELETE FROM reviews 
      WHERE id = $1 AND user_id = $2 
      RETURNING *;
    `;
    const result = await pool.query(deleteSql, [review_id, user_id]);

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Review not found or you do not have permission to delete it' });
      return;
    }

    res.status(200).json({
      message: 'Review deleted successfully',
      deleted_review: result.rows[0]
    });

  } catch (error: any) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

router.delete('/reviews/:id', authenticateToken, deleteReview);
router.get('/:id/reviews', getProductReviews);
router.post('/:id/reviews', authenticateToken, createProductReview);
router.get('/', getAllProducts);
router.get('/name/:name', getProductByName);
router.get('/:id', getProductById);
export default router;