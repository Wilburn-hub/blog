import { NextRequest, NextResponse } from 'next/server'
import { JWTService, JWTPayload } from './jwt'
import { prisma } from '../db/prisma'
import { rateLimiter, RATE_LIMITS, getClientIP } from '../utils/rate-limiter'

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload & { id: string }
}

export interface MiddlewareOptions {
  required?: boolean
  roles?: string[]
  skipRateLimit?: boolean
  rateLimitKey?: string
  rateLimitConfig?: any
}

export async function authenticate(
  request: NextRequest,
  options: MiddlewareOptions = {}
): Promise<{ user?: JWTPayload & { id: string }; error?: string; status?: number }> {
  const {
    required = true,
    roles = [],
    skipRateLimit = false,
    rateLimitKey = 'general',
    rateLimitConfig = RATE_LIMITS.general,
  } = options

  // Rate limiting check
  if (!skipRateLimit) {
    const clientIP = getClientIP(request)
    const rateLimitResult = await rateLimiter.checkLimit(rateLimitKey, clientIP, rateLimitConfig)

    if (!rateLimitResult.allowed) {
      return {
        error: 'Too many requests. Please try again later.',
        status: 429,
      }
    }
  }

  const authHeader = request.headers.get('authorization')
  const token = JWTService.extractTokenFromHeader(authHeader)

  if (!token) {
    if (required) {
      return {
        error: 'Authentication required',
        status: 401,
      }
    }
    return {}
  }

  try {
    const payload = JWTService.verifyAccessToken(token)

    // Fetch user from database to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
      },
    })

    if (!user || !user.isActive) {
      return {
        error: 'User not found or inactive',
        status: 401,
      }
    }

    // Check if user has required role
    if (roles.length > 0 && !roles.includes(user.role)) {
      return {
        error: 'Insufficient permissions',
        status: 403,
      }
    }

    return {
      user: {
        ...payload,
        id: user.id,
        role: user.role,
      },
    }
  } catch (error) {
    return {
      error: 'Invalid or expired token',
      status: 401,
    }
  }
}

// Higher-order function for API route handlers
export function withAuth(
  handler: (
    req: NextRequest,
    context: { user: JWTPayload & { id: string } }
  ) => Promise<Response> | Response,
  options: MiddlewareOptions = {}
) {
  return async (request: NextRequest, context?: any) => {
    const authResult = await authenticate(request, options)

    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // If authentication is not required and no user is found, proceed without user
    if (!options.required && !authResult.user) {
      return handler(request, { user: null as any })
    }

    return handler(request, { user: authResult.user! })
  }
}

// Role-based access control
export function withRoles(roles: string[]) {
  return (
    handler: (
      req: NextRequest,
      context: { user: JWTPayload & { id: string } }
    ) => Promise<Response> | Response
  ) => withAuth(handler, { required: true, roles })
}

// Admin-only access
export const withAdmin = withRoles(['ADMIN'])

// Optional authentication
export function withOptionalAuth(
  handler: (
    req: NextRequest,
    context: { user?: JWTPayload & { id: string } }
  ) => Promise<Response> | Response
) {
  return withAuth(handler, { required: false })
}

// CORS middleware
export function addCORSHeaders(response: Response, origin?: string) {
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'https://localhost:3000',
  ]

  const requestOrigin = origin || '*'
  const isAllowedOrigin =
    allowedOrigins.includes(requestOrigin) || process.env.NODE_ENV === 'development'

  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', requestOrigin)
  }

  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With'
  )
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Max-Age', '86400')

  return response
}

// Security headers middleware
export function addSecurityHeaders(response: Response) {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Enable XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'"
  )

  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions policy
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  return response
}

// Error handling middleware
export function handleAPIError(error: unknown): Response {
  console.error('API Error:', error)

  if (error instanceof Error) {
    if (error.message.includes('Token expired')) {
      return NextResponse.json({ error: 'Token expired, please login again' }, { status: 401 })
    }

    if (error.message.includes('Invalid token')) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }

    if (error.message.includes('permission')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
  }

  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}

// Request logging middleware
export function logRequest(request: NextRequest, userId?: string) {
  const timestamp = new Date().toISOString()
  const method = request.method
  const url = request.url
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const ip = getClientIP(request)

  console.log(
    `[${timestamp}] ${method} ${url} - IP: ${ip} - User: ${userId || 'anonymous'} - UA: ${userAgent}`
  )
}
