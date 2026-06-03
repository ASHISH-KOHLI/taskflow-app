const { Pool } = require('pg');

// Pool = a collection of reusable DB connections
// This is production best practice - never create a new connection per request
const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 5432,
  database: process.env.DB_NAME     || 'taskflow',
  user:     process.env.DB_USER     || 'taskflow_user',
  password: process.env.DB_PASSWORD || 'taskflow_pass',
  
  // Pool configuration
  max: 20,                // Maximum 20 connections in pool
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Fail fast if DB unreachable
});

// Test connection on startup
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err.message);
});

// Helper: run a query with automatic error handling
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`📊 Query executed in ${duration}ms | rows: ${result.rowCount}`);
    return result;
  } catch (error) {
    console.error('❌ Query error:', { text, error: error.message });
    throw error;
  }
};

// Initialize database schema
const initializeDatabase = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS tasks (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title       VARCHAR(255) NOT NULL,
      description TEXT,
      status      VARCHAR(50)  NOT NULL DEFAULT 'todo',
      priority    VARCHAR(50)  NOT NULL DEFAULT 'medium',
      created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS health_checks (
      id          SERIAL PRIMARY KEY,
      checked_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  try {
    await pool.query(createTableQuery);
    console.log('✅ Database schema initialized');
  } catch (error) {
    console.error('❌ Failed to initialize schema:', error.message);
    throw error;
  }
};

module.exports = { query, pool, initializeDatabase };
