// utils/redisClient.js
import { createClient } from 'redis';

const redis = createClient({
  url: process.env.REDIS_URL, // e.g. redis://localhost:6379
});

redis.connect().catch(console.error);

export default redis;
