import { pool } from '../db.js';

export interface SearchFilters {
    keyword?: string;
    maxPrice?: number;
    minPrice?: number;
    categoryId?: number;
    inStockOnly?: boolean;
    limit?: number;
}

export const searchProducts = async (filters: SearchFilters) => {
    let query = `
        SELECT id, name, description, price, stock_quantity, category_id 
        FROM products 
        WHERE 1=1
    `;
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (filters.keyword && filters.keyword.trim() !== '') {
        query += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
        queryParams.push(`%${filters.keyword.trim()}%`);
        paramIndex++;
    }

    if (filters.maxPrice !== undefined && !isNaN(filters.maxPrice)) {
        query += ` AND price <= $${paramIndex}`;
        queryParams.push(filters.maxPrice);
        paramIndex++;
    }

  
    if (filters.minPrice !== undefined && !isNaN(filters.minPrice)) {
        query += ` AND price >= $${paramIndex}`;
        queryParams.push(filters.minPrice);
        paramIndex++;
    }

  
    if (filters.categoryId !== undefined && !isNaN(filters.categoryId)) {
        query += ` AND category_id = $${paramIndex}`;
        queryParams.push(filters.categoryId);
        paramIndex++;
    }

  
    if (filters.inStockOnly) {
        query += ` AND stock_quantity > 0`;
    }

  
    const limit = filters.limit && filters.limit > 0 ? Math.min(filters.limit, 10) : 5;
    query += ` ORDER BY price ASC LIMIT $${paramIndex}`;
    queryParams.push(limit);

    try {
        const result = await pool.query(query, queryParams);
        return result.rows;
    } catch (error: any) {
        console.error('Error executing product search service:', error.message);
        throw new Error('Database search failed');
    }
};