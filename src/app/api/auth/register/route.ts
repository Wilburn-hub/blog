import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/lib/services/user.service'
import { registerSchema, validateRequest } from '@/lib/utils/validation'
import { rateLimiter, RATE_LIMITS, getClientIP } from '@/lib/utils/rate-limiter'
import { addCORSHeaders, addSecurityHeaders, logRequest } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Rate limiting
    const clientIP = getClientIP(request)
    const rateLimitResult = await rateLimiter.checkLimit('register', clientIP, RATE_LIMITS.register)

    if (!rateLimitResult.allowed) {
      const response = NextResponse.json(
        {
          error: 'Too many registration attempts. Please try again later.',
          retryAfter: Math.ceil(rateLimitResult.resetTime!.getTime() / 1000),
        },
        { status: 429 }
      )
      return addSecurityHeaders(addCORSHeaders(response))
    }

    // Validate request body
    const validation = await validateRequest(registerSchema)
    if (!validation.success) {
      const response = NextResponse.json(
        { error: validation.error.message, details: validation.error.details },
        { status: 400 }
      )
      return addSecurityHeaders(addCORSHeaders(response))
    }

    const { email, username, password, name } = validation.data

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    })

    if (existingUser) {
      if (existingUser.email === email) {
        const response = NextResponse.json({ error: 'Email already registered' }, { status: 409 })
        return addSecurityHeaders(addCORSHeaders(response))
      }

      if (existingUser.username === username) {
        const response = NextResponse.json({ error: 'Username already taken' }, { status: 409 })
        return addSecurityHeaders(addCORSHeaders(response))
      }
    }

    // Create user
    const user = await UserService.createUser({
      email,
      username,
      password,
      name,
    })

    // Log the request
    logRequest(request, user.id)

    const response = NextResponse.json(
      {
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
      { status: 201 }
    )

    // Add security headers
    addSecurityHeaders(response)
    addCORSHeaders(response)

    // Add processing time header
    response.headers.set('X-Processing-Time', `${Date.now() - startTime}ms`)

    return response
  } catch (error) {
    console.error('Registration error:', error)

    const response = NextResponse.json(
      { error: 'Internal server error during registration' },
      { status: 500 }
    )

    return addSecurityHeaders(addCORSHeaders(response))
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 })
  return addSecurityHeaders(addCORSHeaders(response))
}
