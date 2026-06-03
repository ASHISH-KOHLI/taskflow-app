require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');

const { initializeDatabase }  = require('./db');
const { createRedisClient }   = require('./utils/redisClient');
const { errorHandler }        = require('./middleware/errorHandler');
const tasksRouter             = require('./routes/tasks');
const healthRouter            = require('./routes/health');

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Security Middleware ─────────────────────────────────────────────────────
// helmet: Sets security HTTP headers (XSS protection, HSTS, etc.)
app.use(helmet());

// cors: Allows frontend (different origin) to call this API
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Rate Limiting ───────────────────────────────────────────────────────────
// Prevents abuse: max 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, error: { message: 'Too many requests' } },
});
app.use('/api', limiter);

// ── General Middleware ──────────────────────────────────────────────────────
// morgan: HTTP request logging (format: "GET /api/tasks 200 45ms")
app.use(morgan('combined'));

// Parse JSON request bodies
app.use(express.json({ limit: '10kb' })); // Limit body size
app.use(express.urlencoded({ extended: true }));

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/health', healthRouter);
app.use('/api/tasks', tasksRouter);

// Root route
app.get('/', (req, res) => {
  res.json({
    service: 'TaskFlow API',
    version: process.env.APP_VERSION || '1.0.0',
    docs:    '/health',
  });
});

// 404 handler - must be AFTER all routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: { message: `Route ${req.method} ${req.originalUrl} not found` },
  });
});

// ── Error Handler ───────────────────────────────────────────────────────────
// Must be LAST middleware - receives errors from asyncHandler
app.use(errorHandler);

// ── Startup Sequence ────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    console.log('🚀 Starting TaskFlow Backend...');
    console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);

    // 1. Initialize database schema
    await initializeDatabase();

    // 2. Connect to Redis (non-blocking - app starts even if Redis is down)
    await createRedisClient();

    // 3. Start HTTP server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/health`);
      console.log(`📋 API:          http://localhost:${PORT}/api/tasks`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1); // Exit with error code so K8s knows to restart
  }
};

// Graceful shutdown - important for Kubernetes rolling updates
// When K8s sends SIGTERM, finish in-flight requests before exiting
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received - shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📴 SIGINT received - shutting down gracefully...');
  process.exit(0);
});

startServer();
