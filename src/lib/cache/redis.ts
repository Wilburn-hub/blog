import { createClient } from 'redis'

let redisClient: ReturnType<typeof createClient> | null = null

export async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: 5000,
        lazyConnect: true,
      },
    })

    redisClient.on('error', err => {
      console.error('Redis Client Error:', err)
    })

    redisClient.on('connect', () => {
      console.log('Redis Client Connected')
    })
  }

  if (!redisClient.isOpen) {
    await redisClient.connect()
  }

  return redisClient
}

export class CacheService {
  private static instance: CacheService
  private client: Awaited<ReturnType<typeof getRedisClient>>

  private constructor() {}

  static async getInstance() {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService()
      CacheService.instance.client = await getRedisClient()
    }
    return CacheService.instance
  }

  async set(key: string, value: any, ttl?: number) {
    const serializedValue = JSON.stringify(value)
    if (ttl) {
      await this.client.setEx(key, ttl, serializedValue)
    } else {
      await this.client.set(key, serializedValue)
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key)
    return value ? JSON.parse(value) : null
  }

  async del(key: string) {
    await this.client.del(key)
  }

  async exists(key: string) {
    return await this.client.exists(key)
  }

  async incr(key: string) {
    return await this.client.incr(key)
  }

  async expire(key: string, ttl: number) {
    await this.client.expire(key, ttl)
  }

  async getTTL(key: string) {
    return await this.client.ttl(key)
  }

  // Cache key generators
  static generateKey(prefix: string, ...parts: string[]) {
    return [prefix, ...parts].join(':')
  }

  // Blog specific cache methods
  async cachePost(slug: string, post: any, ttl = 3600) {
    const key = CacheService.generateKey('post', slug)
    await this.set(key, post, ttl)
  }

  async getCachedPost(slug: string) {
    const key = CacheService.generateKey('post', slug)
    return this.get(key)
  }

  async cachePostsList(query: string, posts: any[], ttl = 1800) {
    const key = CacheService.generateKey('posts', query)
    await this.set(key, posts, ttl)
  }

  async getCachedPostsList(query: string) {
    const key = CacheService.generateKey('posts', query)
    return this.get(key)
  }

  async cacheUserSessions(userId: string, sessions: any[], ttl = 7200) {
    const key = CacheService.generateKey('sessions', userId)
    await this.set(key, sessions, ttl)
  }

  async getCachedUserSessions(userId: string) {
    const key = CacheService.generateKey('sessions', userId)
    return this.get(key)
  }

  async invalidatePostCache(slug?: string) {
    if (slug) {
      await this.del(CacheService.generateKey('post', slug))
    }
    // Invalidate posts list cache
    const pattern = CacheService.generateKey('posts', '*')
    const keys = await this.client.keys(pattern)
    if (keys.length > 0) {
      await this.client.del(keys)
    }
  }

  async invalidateUserCache(userId: string) {
    await this.del(CacheService.generateKey('sessions', userId))
  }
}
