
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './db.js';
import productRoutes from './routes/products.js';

dotenv.config();


const app = express();

const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());



app.get('/api/db-check', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS current_time');

    res.status(200).json({
      success: true,
      message: 'Database connection successful!',
      time: result.rows[0].current_time,
    });
  } catch (error) {
    console.error('Database connection failed:', error);

    res.status(500).json({
      success: false,
      message: 'Could not connect to the database.',
    });
  }
});
app.use('/api/products', productRoutes);


// Start the server
app.listen(PORT, () => {
  console.log(`SmartMarket API running on http://localhost:${PORT}`);
});
