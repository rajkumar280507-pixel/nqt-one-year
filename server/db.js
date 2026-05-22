import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const isProduction = process.env.NODE_ENV === 'production';

// In local development, if no DATABASE_URL is provided, we construct a default one or run in mock mode
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/nqt_db';

const pool = new Pool({
  connectionString,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

pool.on('connect', () => {
  console.log('Database connected successfully.');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export default {
  query: (text, params) => pool.query(text, params),
  pool
};
