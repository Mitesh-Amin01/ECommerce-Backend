// redisClient.js
import { createClient } from 'redis';

const redis = createClient({
  username: process.env.REDIS_USER || 'default',
  password: process.env.REDIS_PASSWORD || '',
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    tls: process.env.REDIS_TLS === 'true' ? true : false, // Only enable if needed (like Render)
    rejectUnauthorized: false // Optional: disable only if using self-signed certR
  }
});

redis.on('error', (err) => {
  console.error('❌ Redis Client Error:', err);
});

const connectRedis = async () => {
  try {
    await redis.connect();
    console.log('✅ Redis connected successfully');

    // Test connection
    await redis.set('foo', 'bar');
    const result = await redis.get('foo');
    console.log('Test Value:', result); // Should log 'bar'
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
  }
};

connectRedis();

export default redis;
