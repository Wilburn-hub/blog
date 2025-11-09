import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible'
import { CacheService } from '../cache/redis'

export interface RateLimitConfig {
  windowMs: number
  maxAttempts: number
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

class RateLimiterService {
  private static instance: RateLimiterService
  private limiters: Map<string, RateLimiterMemory | RateLimiterRedis> = new Map()
  private redisAvailable = false

  private constructor() {
    this.initializeRedisLimiter()
  }

  static getInstance(): RateLimiterService {
    if (!RateLimiterService.instance) {
      RateLimiterService.instance = new RateLimiterService()
    }
    return RateLimiterService.instance
  }

  private async initializeRedisLimiter() {
    try {
      const redis = await CacheService.getInstance()
      if (redis) {
        this.redisAvailable = true
      }
    } catch (error) {
      console.warn('Redis not available for rate limiting, falling back to memory limiter')
    }
  }

  private getLimiter(key: string, config: RateLimitConfig) {
    if (this.limiters.has(key)) {
      return this.limiters.get(key)!
    }

    let limiter: RateLimiterMemory | RateLimiterRedis

    if (this.redisAvailable) {
      limiter = new RateLimiterRedis({
        storeClient: (CacheService as any).instance?.client,
        keyPrefix: `rl:${key}:`,
        points: config.maxAttempts,
        duration: Math.ceil(config.windowMs / 1000),
        blockDuration: Math.ceil(config.windowMs / 1000),
        execEvenly: true,
      })
    } else {
      limiter = new RateLimiterMemory({
        points: config.maxAttempts,
        duration: Math.ceil(config.windowMs / 1000),
        blockDuration: Math.ceil(config.windowMs / 1000),
        execEvenly: true,
      })
    }

    this.limiters.set(key, limiter)
    return limiter
  }

  async checkLimit(
    key: string,
    identifier: string,
    config: RateLimitConfig
  ): Promise<{
    allowed: boolean
    remaining: number
    resetTime: Date | null
    totalHits: number
  }> {
    const limiter = this.getLimiter(key, config)
    const fullKey = `${identifier}`

    try {
      const result = await limiter.consume(fullKey)
      return {
        allowed: true,
        remaining: result.remainingPoints || 0,
        resetTime: new Date(Date.now() + result.msBeforeNext),
        totalHits: config.maxAttempts - (result.remainingPoints || 0),
      }
    } catch (rejRes: any) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(Date.now() + rejRes.msBeforeNext),
        totalHits: config.maxAttempts,
      }
    }
  }

  async resetLimit(key: string, identifier: string): Promise<void> {
    const limiter = this.getLimiter(key, { windowMs: 60000, maxAttempts: 10 })
    await limiter.delete(identifier)
  }
}

// Predefined rate limit configurations
export const RATE_LIMITS = {
  // General API limits
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 100,
  },
  // Authentication limits
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 5,
  },
  // Registration limits
  register: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxAttempts: 3,
  },
  // Password reset limits
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxAttempts: 3,
  },
  // File upload limits
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxAttempts: 20,
  },
  // Search limits
  search: {
    windowMs: 60 * 1000, // 1 minute
    maxAttempts: 30,
  },
  // Comment limits
  comment: {
    windowMs: 60 * 1000, // 1 minute
    maxAttempts: 5,
  },
  // Like limits
  like: {
    windowMs: 60 * 1000, // 1 minute
    maxAttempts: 20,
  },
} as const

export const rateLimiter = RateLimiterService.getInstance()

// Helper function to get client IP
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  if (realIP) {
    return realIP
  }

  // For Next.js API routes, you might need to use a different approach
  // This is a fallback that might not work in all environments
  return request.headers.get('x-vercel-forwarded-for') || 'unknown'
}
