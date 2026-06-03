const express = require('express');
const Joi = require('joi');
const router = express.Router();
const { query } = require('../db');
const { cacheGet, cacheSet, cacheDel } = require('../utils/redisClient');
const { asyncHandler } = require('../middleware/errorHandler');

// ── Validation Schemas ─────────────────────────────────────────────────────
const taskSchema = Joi.object({
  title:       Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).allow('', null),
  status:      Joi.string().valid('todo', 'in_progress', 'done').default('todo'),
  priority:    Joi.string().valid('low', 'medium', 'high').default('medium'),
});

const updateSchema = Joi.object({
  title:       Joi.string().min(1).max(255),
  description: Joi.string().max(1000).allow('', null),
  status:      Joi.string().valid('todo', 'in_progress', 'done'),
  priority:    Joi.string().valid('low', 'medium', 'high'),
}).min(1); // At least one field required for update

// ── GET /api/tasks ──────────────────────────────────────────────────────────
// List all tasks with optional filtering
router.get('/', asyncHandler(async (req, res) => {
  const { status, priority } = req.query;
  const cacheKey = `tasks:list:${status || 'all'}:${priority || 'all'}`;

  // 1. Try cache first (Cache-Aside pattern)
  const cached = await cacheGet(cacheKey);
  if (cached) {
    console.log(`🎯 Cache HIT for ${cacheKey}`);
    return res.json({ success: true, data: cached, source: 'cache' });
  }

  // 2. Cache MISS - query database
  console.log(`💾 Cache MISS for ${cacheKey} - querying DB`);

  let queryText = `
    SELECT id, title, description, status, priority, created_at, updated_at
    FROM tasks
  `;
  const queryParams = [];

  // Dynamic filtering
  const conditions = [];
  if (status) {
    queryParams.push(status);
    conditions.push(`status = $${queryParams.length}`);
  }
  if (priority) {
    queryParams.push(priority);
    conditions.push(`priority = $${queryParams.length}`);
  }
  if (conditions.length > 0) {
    queryText += ` WHERE ${conditions.join(' AND ')}`;
  }
  queryText += ' ORDER BY created_at DESC';

  const result = await query(queryText, queryParams);

  // 3. Store in cache for 5 minutes
  await cacheSet(cacheKey, result.rows, 300);

  res.json({ success: true, data: result.rows, source: 'database' });
}));

// ── GET /api/tasks/:id ──────────────────────────────────────────────────────
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const cacheKey = `tasks:single:${id}`;

  const cached = await cacheGet(cacheKey);
  if (cached) {
    return res.json({ success: true, data: cached, source: 'cache' });
  }

  const result = await query(
    'SELECT * FROM tasks WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }

  await cacheSet(cacheKey, result.rows[0], 300);
  res.json({ success: true, data: result.rows[0], source: 'database' });
}));

// ── POST /api/tasks ─────────────────────────────────────────────────────────
router.post('/', asyncHandler(async (req, res) => {
  // Validate input
  const { error, value } = taskSchema.validate(req.body);
  if (error) {
    const err = new Error(error.details[0].message);
    err.statusCode = 400;
    throw err;
  }

  const { title, description, status, priority } = value;

  const result = await query(
    `INSERT INTO tasks (title, description, status, priority)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [title, description, status, priority]
  );

  // Invalidate the list cache since we added a new task
  await cacheDel('tasks:list:all:all');

  res.status(201).json({ success: true, data: result.rows[0] });
}));

// ── PUT /api/tasks/:id ──────────────────────────────────────────────────────
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { error, value } = updateSchema.validate(req.body);
  if (error) {
    const err = new Error(error.details[0].message);
    err.statusCode = 400;
    throw err;
  }

  // Check task exists
  const existing = await query('SELECT id FROM tasks WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    const err = new Error('Task not found');
    err.statusCode = 404;
    throw err;
  }

  // Build dynamic update query
  const fields = Object.keys(value);
  const setClause = fields
    .map((field, idx) => `${field} = $${idx + 1}`)
    .join(', ');
  const values = [...Object.values(value), id];

  const result = await query(
    `UPDATE tasks
     SET ${setClause}, updated_at = NOW()
     WHERE id = $${values.length}
     RETURNING *`,
    values
  );

  // Invalidate related caches
  await cacheDel(`tasks:single:${id}`);
  await cacheDel('tasks:list:all:all');

  res.json({ success: true, data: result.rows[0] });
}));

// ── DELETE /api/tasks/:id ───────────────────────────────────────────────────
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(
    'DELETE FROM tasks WHERE id = $1 RETURNING id',
    [id]
  );

  if (result.rows.length === 0) {
    const err = new Error('Task not found');
    err.statusCode = 404;
    throw err;
  }

  // Invalidate caches
  await cacheDel(`tasks:single:${id}`);
  await cacheDel('tasks:list:all:all');

  res.json({ success: true, message: 'Task deleted successfully' });
}));

module.exports = router;
