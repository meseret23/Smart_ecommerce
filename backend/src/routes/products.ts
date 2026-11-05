import { Router, type Request, type Response } from 'express';
import { pool } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

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
    if (search !== undefined && typeof search !== 'string') {
      res.status(400).json({
        success: false,
        message: 'search must be a string',
      });
      return;
    }

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

   
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM products
      ${whereClause}
    `;

    const countResult = await pool.query(countSql, values);
    const total: number = countResult.rows[0].total;

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
        category_id,
        image_url
      FROM products WHERE is_active = TRUE
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


const createProductReview = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const product_id = Number(req.params.id);
    const user_id = req.user?.id;
    const { rating, comment } = req.body;

    // 1. Validate product ID
    if (!Number.isInteger(product_id) || product_id <= 0) {
      res.status(400).json({ message: 'Invalid product ID' });
      return;
    }

    // 2. Validate user
    if (!user_id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // 3. Validate rating
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      res.status(400).json({
        message: 'Rating must be an integer between 1 and 5'
      });
      return;
    }

    // 4. Verify delivered purchase
    const checkSql = `
      SELECT 1
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = $1
        AND oi.product_id = $2
        AND o.status = 'delivered'
      LIMIT 1;
    `;

    const checkResult = await pool.query(checkSql, [
      user_id,
      product_id
    ]);

    if (checkResult.rows.length === 0) {
      res.status(403).json({
        message: 'Only customers with delivered orders can review this product'
      });
      return;
    }

    // 5. Insert or update review
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

    const reviewResult = await pool.query(upsertSql, [
      user_id,
      product_id,
      rating,
      comment?.trim() || null
    ]);

    res.status(200).json({
      message: 'Review saved successfully',
      review: reviewResult.rows[0]
    });

  } catch (error) {
    console.error('Error saving review:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};





const getProductReviews = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // 1. Validate product ID
    const product_id = Number(req.params.id);

    if (!Number.isInteger(product_id) || product_id <= 0) {
      res.status(400).json({
        message: 'Invalid product ID'
      });
      return;
    }

    // 2. Validate pagination
    const requestedPage = parseInt(req.query.page as string, 10) || 1;
    const requestedLimit = parseInt(req.query.limit as string, 10) || 5;

    const page = Math.max(1, requestedPage);
    const limit = Math.min(50, Math.max(1, requestedLimit));
    const offset = (page - 1) * limit;

    // 3. Fetch paginated reviews, customer names, and helpful votes
    const reviewsQuery = `
      SELECT
        r.id,
        r.user_id,
        r.product_id,
        r.rating,
        r.comment,
        r.created_at,
        u.full_name AS user_name,
        (
          SELECT COUNT(*)::int
          FROM review_votes rv
          WHERE rv.review_id = r.id
        ) AS helpful_count
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3;
    `;

    const reviewsResult = await pool.query(reviewsQuery, [
      product_id,
      limit,
      offset
    ]);

    // 4. Check whether the product exists
    if (reviewsResult.rows.length === 0) {
      const productCheck = await pool.query(
        'SELECT id FROM products WHERE id = $1 AND is_active = TRUE',
        [product_id]
      );

      if (productCheck.rows.length === 0) {
        res.status(404).json({
          message: 'Product not found'
        });
        return;
      }
    }

    // 5. Calculate average rating and total reviews
    const statsQuery = `
      SELECT
        COALESCE(AVG(rating), 0) AS average_rating,
        COUNT(*) AS total_reviews
      FROM reviews
      WHERE product_id = $1;
    `;

    const statsResult = await pool.query(statsQuery, [product_id]);

    const stats = statsResult.rows[0];

    const totalReviews = Number(stats.total_reviews);
    const averageRating = Number(stats.average_rating);
    const totalPages = Math.ceil(totalReviews / limit);

    // 6. Send response
    res.status(200).json({
      average_rating: averageRating.toFixed(1),
      total_reviews: totalReviews,
      page,
      limit,
      total_pages: totalPages,
      reviews: reviewsResult.rows
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);

    res.status(500).json({
      message: 'Internal server error'
    });
  }
};



const deleteReview = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // 1. Validate review ID
    const review_id = Number(req.params.id);

    if (!Number.isInteger(review_id) || review_id <= 0) {
      res.status(400).json({
        message: 'Invalid review ID'
      });
      return;
    }

    // 2. Get authenticated user
    const user_id = req.user?.id;

    if (!user_id) {
      res.status(401).json({
        message: 'Authentication required'
      });
      return;
    }

    // 3. Delete review belonging to the authenticated user
    const deleteSql = `
      DELETE FROM reviews
      WHERE id = $1 AND user_id = $2
      RETURNING *;
    `;

    const result = await pool.query(deleteSql, [
      review_id,
      user_id
    ]);

    // 4. Check if review was deleted
    if (result.rows.length === 0) {
      res.status(404).json({
        message: 'Review not found or you do not have permission to delete it'
      });
      return;
    }

    // 5. Return success response
    res.status(200).json({
      message: 'Review deleted successfully',
      deleted_review: result.rows[0]
    });

  } catch (error) {
    console.error('Error deleting review:', error);

    res.status(500).json({
      message: 'Internal server error'
    });
  }
};



const toggleReviewHelpful = async (
  req: Request,
  res: Response
): Promise<void> => {
  const client = await pool.connect();

  try {
    // 1. Validate review ID
    const review_id = Number(req.params.id);

    if (!Number.isInteger(review_id) || review_id <= 0) {
      res.status(400).json({
        message: 'Invalid review ID'
      });
      return;
    }

    // 2. Get authenticated user
    const user_id = req.user?.id;

    if (!user_id) {
      res.status(401).json({
        message: 'Authentication required'
      });
      return;
    }

    await client.query('BEGIN');

    // 3. Check whether the review exists and lock it
    const reviewResult = await client.query(
      'SELECT id FROM reviews WHERE id = $1 FOR UPDATE',
      [review_id]
    );

    if (reviewResult.rows.length === 0) {
      await client.query('ROLLBACK');

      res.status(404).json({
        message: 'Review not found'
      });
      return;
    }

    // 4. Check whether the user has already voted
    const existingVote = await client.query(
      `SELECT id FROM review_votes
       WHERE review_id = $1 AND user_id = $2`,
      [review_id, user_id]
    );

    let voted: boolean;
    let message: string;

    if (existingVote.rows.length > 0) {
      // 5. Remove existing vote
      await client.query(
        `DELETE FROM review_votes
         WHERE review_id = $1 AND user_id = $2`,
        [review_id, user_id]
      );

      voted = false;
      message = 'Helpful vote removed';

    } else {
      // 6. Add new vote
      await client.query(
        `INSERT INTO review_votes (review_id, user_id)
         VALUES ($1, $2)`,
        [review_id, user_id]
      );

      voted = true;
      message = 'Marked review as helpful';
    }

    await client.query('COMMIT');

    // 7. Return result
    res.status(200).json({
      message,
      voted
    });

  } catch (error) {
    await client.query('ROLLBACK');

    console.error('Error toggling review helpful vote:', error);

    res.status(500).json({
      message: 'Internal server error'
    });

  } finally {
    client.release();
  }
};


const createProduct = async (req: Request, res: Response): Promise<void> => {
    const seller_id = req.user?.id;
    const { name, description, price, stock_quantity, category_id } = req.body;

    try {
        // Get the uploaded image path
        const image_url = req.file
            ? `/uploads/${req.file.filename}`
            : null;

        const query = `
            INSERT INTO products (
                name,
                description,
                price,
                stock_quantity,
                category_id,
                seller_id,
                image_url
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `;

        const values = [
            name,
            description,
            price,
            stock_quantity || 0,
            category_id || null,
            seller_id,
            image_url
        ];

        const result = await pool.query(query, values);

        res.status(201).json({
            message: 'Product created successfully',
            product: result.rows[0]
        });

    } catch (error) {
        console.error('Create product error:', error);

        res.status(500).json({
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};


const updateProduct = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { id: userId, role } = req.user || {};

    // Multer processes FormData and makes its text fields available in req.body.
    const {
        name,
        description,
        price,
        stock_quantity,
        category_id
    } = req.body || {};

    try {
        // 1. Check whether the product exists and is active
        const checkQuery = `
            SELECT *
            FROM products
            WHERE id = $1 AND is_active = TRUE
        `;

        const checkResult = await pool.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
            res.status(404).json({ message: 'Product not found or inactive.' });
            return;
        }

        const product = checkResult.rows[0];

        // 2. Check ownership
        if (role !== 'admin' && product.seller_id !== Number(userId)) {
            res.status(403).json({
                message: 'Forbidden: You can only modify your own products.'
            });
            return;
        }

        // 3. Use the new image if uploaded; otherwise keep the old image
        const image_url = req.file
            ? `/uploads/${req.file.filename}`
            : product.image_url;

        // 4. Update product details
        const updateSql = `
            UPDATE products
            SET
                name = COALESCE($1, name),
                description = COALESCE($2, description),
                price = COALESCE($3, price),
                stock_quantity = COALESCE($4, stock_quantity),
                category_id = COALESCE($5, category_id),
                image_url = $6
            WHERE id = $7
            RETURNING *;
        `;

        const values = [
            name?.trim() || null,
            description ?? null,
            price !== undefined && price !== '' ? Number(price) : null,
            stock_quantity !== undefined && stock_quantity !== ''
                ? Number(stock_quantity)
                : null,
            category_id !== undefined && category_id !== ''
                ? Number(category_id)
                : null,
            image_url,
            id
        ];

        const result = await pool.query(updateSql, values);

        res.status(200).json({
            message: 'Product updated successfully.',
            product: result.rows[0]
        });

    } catch (error) {
        console.error('Update product error:', error);

        res.status(500).json({
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};



const deleteProduct = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { id: userId, role } = req.user || {};

    try {
       
        const checkQuery = `
            SELECT *
            FROM products
            WHERE id = $1
        `;

        const checkResult = await pool.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
            res.status(404).json({ message: 'Product not found' });
            return;
        }

        const product = checkResult.rows[0];

      
        if (
            role !== 'admin' &&
            Number(product.seller_id) !== Number(userId)
        ) {
            res.status(403).json({
                message: 'Forbidden: You can only delete your own products'
            });
            return;
        }


       const deleteQuery = `
    UPDATE products
    SET is_active = FALSE
    WHERE id = $1
    RETURNING *
`;
const result = await pool.query(deleteQuery, [id]);

       

        res.status(200).json({
            message: 'Product deleted successfully',
            product: result.rows[0]
        });

    } catch (error) {
        console.error('Delete product error:', error);

        res.status(500).json({
            message: 'Internal server error'
        });
    }
};






router.delete('/:id', authenticateToken, requireRole('seller', 'admin'), deleteProduct);
router.post(
    '/',
    authenticateToken,
    requireRole('seller', 'admin'),
    upload.single('image'),
    createProduct
);
router.patch(
    '/:id',
    authenticateToken,
    requireRole('seller', 'admin'),
    upload.single('image'),
    updateProduct
);
// Create or update a product review
router.post(
  '/:id/reviews',
  authenticateToken,
  createProductReview
);

// Get product reviews
router.get(
  '/:id/reviews',
  getProductReviews
);

// Delete a review
router.delete(
  '/reviews/:id',
  authenticateToken,
  deleteReview
);


router.post(
  '/reviews/:id/helpful',
  authenticateToken,
  toggleReviewHelpful
);


router.get('/', getAllProducts);
router.get('/name/:name', getProductByName);
router.get('/:id', getProductById);

export default router;