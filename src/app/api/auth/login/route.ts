import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/lib/services/user.service'
import { loginSchema, validateRequest } from '@/lib/utils/validation'
import { rateLimiter, RATE_LIMITS, getClientIP } from '@/lib/utils/rate-limiter'
import { addCORSHeaders, addSecurityHeaders, logRequest } from '@/lib/auth/middleware'

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Rate limiting
    const clientIP = getClientIP(request)
    const rateLimitResult = await rateLimiter.checkLimit('auth', clientIP, RATE_LIMITS.auth)

    if (!rateLimitResult.allowed) {
      const response = NextResponse.json(
        {
          error: 'Too many login attempts. Please try again later.',
          retryAfter: Math.ceil(rateLimitResult.resetTime!.getTime() / 1000),
        },
        { status: 429 }
      )
      return addSecurityHeaders(addCORSHeaders(response))
    }

    // Validate request body
    const validation = await validateRequest(loginSchema)
    if (!validation.success) {
      const response = NextResponse.json(
        { error: validation.error.message, details: validation.error.details },
        { status: 400 }
      )
      return addSecurityHeaders(addCORSHeaders(response))
    }

    const { email, password } = validation.data

    // Attempt login
    const result = await UserService.validateLogin({ email, password })

    if (!result) {
      const response = NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
      return addSecurityHeaders(addCORSHeaders(response))
    }

    const { user, tokens } = result

    // Log the request
    logRequest(request, user.id)

    // Create response with tokens in HTTP-only cookies for better security
    const response = NextResponse.json({
      message: 'Login successful',
      user,
      expiresAt: newTokenExpirationTime(),
    })

    // Set secure HTTP-only cookies for tokens
    const isSecure = process.env.NODE_ENV === 'production'

    response.cookies.set('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'strict',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    })

    response.cookies.set('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    // Add security headers
    addSecurityHeaders(response)
    addCORSHeaders(response)

    // Add processing time header
    response.headers.set('X-Processing-Time', `${Date.now() - startTime}ms`)

    return response
  } catch (error) {
    console.error('Login error:', error)

    const response = NextResponse.json(
      { error: 'Internal server error during login' },
      { status: 500 }
    )

    return addSecurityHeaders(addCORSHeaders(response))
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 })
  return addSecurityHeaders(addCORSHeaders(response))
}

// Helper function to calculate token expiration time
function newTokenExpirationTime(): string {
  const expiration = new Date()
  expiration.setMinutes(expiration.getMinutes() + 15) // 15 minutes from now
  return expiration.toISOString()
}
