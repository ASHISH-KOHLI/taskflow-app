const redis = require('redis');

let client = null;
let isConnected = false;

const createRedisClient = async () => {
  try {
    client = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        reconnectStrategy: (retries) => {
          // Exponential backoff: wait longer between each retry
          if (retries > 10) {
            console.error('❌ Redis: Too many retries, giving up');
            return new Error('Redis retry limit exceeded');
          }
          return Math.min(retries * 100, 3000); // Max 3 second wait
        },
      },
      password: process.env.REDIS_PASSWORD || undefined,
    });

    client.on('connect', () => {
      console.log('✅ Connected to Redis');
      isConnected = true;
    });

    client.on('error', (err) => {
      console.error('❌ Redis error:', err.message);
      isConnected = false;
    });

    client.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
    });

    await client.connect();
    return client;
  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error.message);
    // Don't crash the app if Redis is unavailable
    // The app will work without cache, just slower
    return null;
  }
};

// Cache GET with fallback
const cacheGet = async (key) => {
  if (!client || !isConnected) return null;
  try {
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('❌ Cache GET error:', error.message);
    return null;
  }
};

// Cache SET with TTL (time-to-live in seconds)
const cacheSet = async (key, value, ttlSeconds = 300) => {
  if (!client || !isConnected) return false;
  try {
    await client.setEx(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('❌ Cache SET error:', error.message);
    return false;
  }
};

// Cache DELETE (called when data changes)
const cacheDel = async (key) => {
  if (!client || !isConnected) return false;
  try {
    await client.del(key);
    return true;
  } catch (error) {
    console.error('❌ Cache DEL error:', error.message);
    return false;
  }
};

const getStatus = () => ({ connected: isConnected });

module.exports = { createRedisClient, cacheGet, cacheSet, cacheDel, getStatus };
