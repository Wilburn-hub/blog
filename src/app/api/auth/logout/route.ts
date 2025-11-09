import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/lib/services/user.service'
import { JWTService } from '@/lib/auth/jwt'
import { withAuth } from '@/lib/auth/middleware'
import { addCORSHeaders, addSecurityHeaders } from '@/lib/auth/middleware'

async function logoutHandler(request: NextRequest, { user }: { user: any }) {
  const startTime = Date.now()

  try {
    const refreshToken = request.cookies.get('refresh_token')?.value

    if (refreshToken) {
      await UserService.logout(refreshToken)
    }

    const response = NextResponse.json({
      message: 'Logout successful',
    })

    // Clear all auth cookies
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

    // Add security headers
    addSecurityHeaders(response)
    addCORSHeaders(response)

    // Add processing time header
    response.headers.set('X-Processing-Time', `${Date.now() - startTime}ms`)

    return response
  } catch (error) {
    console.error('Logout error:', error)

    const response = NextResponse.json(
      { error: 'Internal server error during logout' },
      { status: 500 }
    )

    return addSecurityHeaders(addCORSHeaders(response))
  }
}

export const POST = withAuth(logoutHandler)
export const OPTIONS = () => {
  const response = new NextResponse(null, { status: 200 })
  return addSecurityHeaders(addCORSHeaders(response))
}
