import { PrismaClient } from '@prisma/client'
import { createClient } from 'redis'

// Database connection with connection pooling
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
    errorFormat: 'pretty',
    // Connection pool configuration
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

// Prevent multiple instances in development
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Redis connection with connection pooling
const globalForRedis = globalThis as unknown as {
  redis: ReturnType<typeof createClient> | undefined
}

export const redis =
  globalForRedis.redis ??
  createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
      reconnectStrategy: retries => Math.min(retries * 50, 1000),
    },
    // Connection pool configuration
    connectTimeout: 10000,
    lazyConnect: true,
  })

// Redis connection management
if (!globalForRedis.redis) {
  redis.on('error', err => {
    console.error('Redis Client Error:', err)
  })

  redis.on('connect', () => {
    console.log('Redis Client Connected')
  })

  redis.on('ready', () => {
    console.log('Redis Client Ready')
  })

  redis.on('end', () => {
    console.log('Redis Client Disconnected')
  })
}

// Prevent multiple instances in development
if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis

// Initialize Redis connection
export async function initializeRedis() {
  if (!redis.isOpen) {
    try {
      await redis.connect()
    } catch (error) {
      console.error('Failed to connect to Redis:', error)
    }
  }
}

// Cache utility functions
export const cache = {
  // Get value from cache
  async get<T>(key: string): Promise<T | null> {
    try {
      await initializeRedis()
      const value = await redis.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  },

  // Set value in cache with optional TTL
  async set(key: string, value: any, ttlInSeconds?: number): Promise<void> {
    try {
      await initializeRedis()
      const serializedValue = JSON.stringify(value)
      if (ttlInSeconds) {
        await redis.setEx(key, ttlInSeconds, serializedValue)
      } else {
        await redis.set(key, serializedValue)
      }
    } catch (error) {
      console.error('Cache set error:', error)
    }
  },

  // Delete value from cache
  async del(key: string): Promise<void> {
    try {
      await initializeRedis()
      await redis.del(key)
    } catch (error) {
      console.error('Cache delete error:', error)
    }
  },

  // Clear all cache (use with caution)
  async clear(): Promise<void> {
    try {
      await initializeRedis()
      await redis.flushDb()
    } catch (error) {
      console.error('Cache clear error:', error)
    }
  },

  // Get multiple values
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      await initializeRedis()
      const values = await redis.mGet(keys)
      return values.map(value => (value ? JSON.parse(value) : null))
    } catch (error) {
      console.error('Cache mget error:', error)
      return new Array(keys.length).fill(null)
    }
  },

  // Set multiple values
  async mset(keyValuePairs: Record<string, any>): Promise<void> {
    try {
      await initializeRedis()
      const serializedPairs: string[] = []
      for (const [key, value] of Object.entries(keyValuePairs)) {
        serializedPairs.push(key, JSON.stringify(value))
      }
      await redis.mSet(serializedPairs)
    } catch (error) {
      console.error('Cache mset error:', error)
    }
  },

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    try {
      await initializeRedis()
      const result = await redis.exists(key)
      return result === 1
    } catch (error) {
      console.error('Cache exists error:', error)
      return false
    }
  },

  // Increment counter
  async incr(key: string): Promise<number> {
    try {
      await initializeRedis()
      return await redis.incr(key)
    } catch (error) {
      console.error('Cache incr error:', error)
      return 0
    }
  },

  // Increment counter by amount
  async incrBy(key: string, amount: number): Promise<number> {
    try {
      await initializeRedis()
      return await redis.incrBy(key, amount)
    } catch (error) {
      console.error('Cache incrBy error:', error)
      return 0
    }
  },

  // Add to set
  async sadd(key: string, members: string[]): Promise<number> {
    try {
      await initializeRedis()
      return await redis.sAdd(key, members)
    } catch (error) {
      console.error('Cache sadd error:', error)
      return 0
    }
  },

  // Get all members of set
  async smembers(key: string): Promise<string[]> {
    try {
      await initializeRedis()
      return await redis.sMembers(key)
    } catch (error) {
      console.error('Cache smembers error:', error)
      return []
    }
  },

  // Remove from set
  async srem(key: string, members: string[]): Promise<number> {
    try {
      await initializeRedis()
      return await redis.sRem(key, members)
    } catch (error) {
      console.error('Cache srem error:', error)
      return 0
    }
  },

  // Add to sorted set
  async zadd(key: string, score: number, member: string): Promise<number> {
    try {
      await initializeRedis()
      return await redis.zAdd(key, { score, value: member })
    } catch (error) {
      console.error('Cache zadd error:', error)
      return 0
    }
  },

  // Get range from sorted set
  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      await initializeRedis()
      return await redis.zRange(key, start, stop)
    } catch (error) {
      console.error('Cache zrange error:', error)
      return []
    }
  },
}

// Cache key generators
export const cacheKeys = {
  post: (slug: string) => `post:${slug}`,
  posts: (page: number, limit: number) => `posts:${page}:${limit}`,
  featuredPosts: () => 'posts:featured',
  popularPosts: () => 'posts:popular',
  postsByCategory: (categorySlug: string, page: number, limit: number) =>
    `posts:category:${categorySlug}:${page}:${limit}`,
  postsByTag: (tag: string, page: number, limit: number) => `posts:tag:${tag}:${page}:${limit}`,
  user: (username: string) => `user:${username}`,
  comments: (postId: string) => `comments:${postId}`,
  viewCount: (postId: string) => `views:${postId}`,
  likeCount: (postId: string) => `likes:${postId}`,
  settings: () => 'settings',
  session: (token: string) => `session:${token}`,
  userSessions: (userId: string) => `sessions:user:${userId}`,
}

// Cache TTL constants (in seconds)
export const cacheTTL = {
  SHORT: 300, // 5 minutes
  MEDIUM: 1800, // 30 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
  WEEK: 604800, // 7 days
}

// Graceful shutdown
export async function disconnectDatabase() {
  await prisma.$disconnect()
  if (redis.isOpen) {
    await redis.quit()
  }
}

// Health check
export async function healthCheck() {
  const dbStatus = await prisma.$queryRaw`SELECT 1 as status`
    .then(() => 'healthy')
    .catch(() => 'unhealthy')

  let redisStatus = 'unhealthy'
  try {
    await initializeRedis()
    await redis.ping()
    redisStatus = 'healthy'
  } catch (error) {
    redisStatus = 'unhealthy'
  }

  return {
    database: dbStatus,
    redis: redisStatus,
    timestamp: new Date().toISOString(),
  }
}
