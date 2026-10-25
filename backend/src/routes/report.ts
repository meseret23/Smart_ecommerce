import { Router, type Request, type Response } from 'express';
import { pool } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { PoolClient } from 'pg';
const router = Router();
const createIssueReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const user_id = req.user?.id;
    const { order_id, product_id, category, description } = req.body; // fixed typo in category

    if (!order_id || !category || !description) {
      res.status(400).json({ message: 'Order ID, category, and description are required' });
      return;
    }

    const checkSql = `SELECT 1 FROM orders WHERE id = $1 AND user_id = $2`;
    const reportResult = await pool.query(checkSql, [order_id, user_id]);

    if (reportResult.rows.length === 0) {
      res.status(403).json({ message: 'You can only report issues for orders you have purchased' });
      return;
    }

    const insertQuery = `
      INSERT INTO reports (user_id, order_id, product_id, category, description) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *;
    `;
    const result = await pool.query(insertQuery, [
      user_id, 
      order_id, 
      product_id || null, 
      category, 
      description
    ]);

    res.status(201).json({ 
      message: 'Issue report submitted successfully', 
      report: result.rows[0] 
    });

  } catch (error: any) {
    console.error('Error creating issue report:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getIssueReports = async(req:Request , res:Response): Promise<void>=>{
    try{
        const user_id = req.user?.id;
        const query = `select * from reports where user_id =$1`;
        const result = await pool.query(query , [user_id]);
        res.status(200).json({message:result.rows})

    }
    catch(error){
        res.status(500).json({message:`internal error`})

    }
}

const updateReportStatus = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        if (status === 'pending' || status === 'in_review' || status === 'resolved' || status === 'rejected') {
            const sql = `UPDATE reports SET status = $1 WHERE id = $2 RETURNING *;`;
            const result = await pool.query(sql, [status, id]);
            if (result.rows.length === 0) {
                res.status(404).json({ message: 'Report not found' });
                return;
            }
            res.status(200).json({ message: 'Status updated successfully', report: result.rows[0] });
        } else {
            res.status(400).json({ message: 'Invalid status value' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
}
router.patch('/:id/status', authenticateToken, updateReportStatus);
router.post('/', authenticateToken, createIssueReport);
router.get('/', authenticateToken, getIssueReports);
export default router;