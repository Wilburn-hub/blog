// Simple in-memory cache for browser compatibility
class MemoryCache {
  private cache = new Map<string, { value: any; expiry: number }>()

  set(key: string, value: any, ttl?: number) {
    const expiry = ttl ? Date.now() + ttl * 1000 : 0
    this.cache.set(key, { value, expiry })
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }

    return item.value
  }

  del(key: string) {
    this.cache.delete(key)
  }

  exists(key: string) {
    const item = this.cache.get(key)
    if (!item) return false

    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  incr(key: string) {
    const current = this.get<number>(key) || 0
    const newValue = current + 1
    this.set(key, newValue)
    return newValue
  }

  expire(key: string, ttl: number) {
    const item = this.cache.get(key)
    if (item) {
      item.expiry = Date.now() + ttl * 1000
    }
  }

  getTTL(key: string) {
    const item = this.cache.get(key)
    if (!item || !item.expiry) return -1
    return Math.max(0, Math.floor((item.expiry - Date.now()) / 1000))
  }

  clear() {
    this.cache.clear()
  }
}

// In-memory cache instance
const memoryCache = new MemoryCache()

export async function getRedisClient() {
  // Return a mock Redis client that uses memory cache
  return {
    set: async (key: string, value: string) => {
      memoryCache.set(key, value)
      return 'OK'
    },
    setEx: async (key: string, ttl: number, value: string) => {
      memoryCache.set(key, value, ttl)
      return 'OK'
    },
    get: async (key: string) => {
      return memoryCache.get(key) || null
    },
    del: async (key: string) => {
      memoryCache.del(key)
      return 1
    },
    exists: async (key: string) => {
      return memoryCache.exists(key) ? 1 : 0
    },
    incr: async (key: string) => {
      return memoryCache.incr(key)
    },
    expire: async (key: string, ttl: number) => {
      memoryCache.expire(key, ttl)
      return 1
    },
    ttl: async (key: string) => {
      return memoryCache.getTTL(key)
    },
    keys: async (pattern: string) => {
      // Simple pattern matching for memory cache
      const regex = new RegExp(pattern.replace(/\*/g, '.*'))
      return Array.from(memoryCache['cache'].keys()).filter(key => regex.test(key))
    },
    isOpen: true,
    connect: async () => {},
    on: (event: string, handler: Function) => {},
  }
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

  // RSS specific cache methods
  async cacheRSSFeed(key: string, feed: any, ttl = 1800) {
    const cacheKey = CacheService.generateKey('rss', 'feed', key)
    await this.set(cacheKey, feed, ttl)
  }

  async getCachedRSSFeed(key: string) {
    const cacheKey = CacheService.generateKey('rss', 'feed', key)
    return this.get(cacheKey)
  }

  async cacheRSSConfig(config: any, ttl = 3600) {
    const key = CacheService.generateKey('rss', 'config')
    await this.set(key, config, ttl)
  }

  async getCachedRSSConfig() {
    const key = CacheService.generateKey('rss', 'config')
    return this.get(key)
  }

  async cacheRSSAnalytics(analytics: any, ttl = 86400) {
    const key = CacheService.generateKey('rss', 'analytics')
    await this.set(key, analytics, ttl)
  }

  async getCachedRSSAnalytics() {
    const key = CacheService.generateKey('rss', 'analytics')
    return this.get(key)
  }

  async invalidateRSSCache() {
    // Invalidate all RSS related cache
    const pattern = CacheService.generateKey('rss', '*')
    const keys = await this.client.keys(pattern)
    if (keys.length > 0) {
      await this.client.del(keys)
    }
  }
}