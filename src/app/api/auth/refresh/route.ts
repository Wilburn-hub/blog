import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/lib/services/user.service'
import { JWTService } from '@/lib/auth/jwt'
import { rateLimiter, RATE_LIMITS, getClientIP } from '@/lib/utils/rate-limiter'
import { addCORSHeaders, addSecurityHeaders } from '@/lib/auth/middleware'

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Rate limiting for token refresh
    const clientIP = getClientIP(request)
    const rateLimitResult = await rateLimiter.checkLimit('auth', clientIP, RATE_LIMITS.auth)

    if (!rateLimitResult.allowed) {
      const response = NextResponse.json(
        {
          error: 'Too many refresh attempts. Please try again later.',
          retryAfter: Math.ceil(rateLimitResult.resetTime!.getTime() / 1000),
        },
        { status: 429 }
      )
      return addSecurityHeaders(addCORSHeaders(response))
    }

    const refreshToken = request.cookies.get('refresh_token')?.value

    if (!refreshToken) {
      const response = NextResponse.json({ error: 'Refresh token is required' }, { status: 401 })
      return addSecurityHeaders(addCORSHeaders(response))
    }

    try {
      // Rotate refresh token and get new tokens
      const newTokens = await UserService.rotateRefreshToken(refreshToken)

      const response = NextResponse.json({
        message: 'Token refreshed successfully',
        expiresAt: newTokenExpirationTime(),
      })

      // Set new secure HTTP-only cookies
      const isSecure = process.env.NODE_ENV === 'production'

      response.cookies.set('access_token', newTokens.accessToken, {
        httpOnly: true,
        secure: isSecure,
        sameSite: 'strict',
        maxAge: 15 * 60, // 15 minutes
        path: '/',
      })

      response.cookies.set('refresh_token', newTokens.refreshToken, {
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
    } catch (refreshError: any) {
      console.error('Refresh token error:', refreshError)

      // If refresh token is invalid/expired, clear cookies and require login
      const response = NextResponse.json(
        { error: 'Refresh token expired or invalid. Please login again.' },
        { status: 401 }
      )

      // Clear invalid cookies
      response.cookies.set('access_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
        path: '/',
      })

      response.cookies.set('refresh_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
        path: '/',
      })

      return addSecurityHeaders(addCORSHeaders(response))
    }
  } catch (error) {
    console.error('Token refresh error:', error)

    const response = NextResponse.json(
      { error: 'Internal server error during token refresh' },
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
