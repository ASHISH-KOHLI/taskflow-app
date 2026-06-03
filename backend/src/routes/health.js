const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { getStatus } = require('../utils/redisClient');

// ── GET /health/live ────────────────────────────────────────────────────────
// Liveness probe: "Is the process alive?"
// If this fails, Kubernetes RESTARTS the pod
// Keep it simple - just check if the Node process is running
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ── GET /health/ready ───────────────────────────────────────────────────────
// Readiness probe: "Is the app ready to handle traffic?"
// If this fails, Kubernetes STOPS sending traffic to this pod
// Check all dependencies here
router.get('/ready', async (req, res) => {
  const checks = {
    database: false,
    redis: false,
  };

  // Check PostgreSQL
  try {
    await pool.query('SELECT 1');
    checks.database = true;
  } catch (err) {
    console.error('❌ Readiness: DB check failed:', err.message);
  }

  // Check Redis (non-critical - app works without it)
  const redisStatus = getStatus();
  checks.redis = redisStatus.connected;

  // App is ready only if database is available
  // Redis failure is tolerated (graceful degradation)
  const isReady = checks.database;
  const statusCode = isReady ? 200 : 503;

  res.status(statusCode).json({
    status: isReady ? 'ready' : 'not ready',
    checks,
    timestamp: new Date().toISOString(),
  });
});

// ── GET /health ─────────────────────────────────────────────────────────────
// Full health info (for humans / monitoring dashboards)
router.get('/', async (req, res) => {
  const dbStatus = { connected: false, latencyMs: null };
  const redisInfo = getStatus();

  try {
    const start = Date.now();
    await pool.query('SELECT 1');
    dbStatus.connected = true;
    dbStatus.latencyMs = Date.now() - start;
  } catch (err) {
    dbStatus.error = err.message;
  }

  res.json({
    service:   'taskflow-backend',
    version:   process.env.APP_VERSION || '1.0.0',
    status:    dbStatus.connected ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime:    `${Math.floor(process.uptime())}s`,
    dependencies: {
      database: dbStatus,
      redis:    redisInfo,
    },
    environment: process.env.NODE_ENV || 'development',
  });
});

module.exports = router;
