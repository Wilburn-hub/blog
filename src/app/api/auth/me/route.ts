import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/lib/services/user.service'
import { withAuth } from '@/lib/auth/middleware'
import { addCORSHeaders, addSecurityHeaders } from '@/lib/auth/middleware'

async function getMeHandler(request: NextRequest, { user }: { user: any }) {
  const startTime = Date.now()

  try {
    // Get full user profile from database
    const userProfile = await UserService.getUserById(user.id)

    if (!userProfile) {
      const response = NextResponse.json({ error: 'User not found' }, { status: 404 })
      return addSecurityHeaders(addCORSHeaders(response))
    }

    // Get user statistics
    const userStats = await UserService.getUserStats(user.id)

    const response = NextResponse.json({
      user: {
        ...userProfile,
        stats: userStats,
      },
    })

    // Add security headers
    addSecurityHeaders(response)
    addCORSHeaders(response)

    // Add processing time header
    response.headers.set('X-Processing-Time', `${Date.now() - startTime}ms`)

    return response
  } catch (error) {
    console.error('Get me error:', error)

    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 })

    return addSecurityHeaders(addCORSHeaders(response))
  }
}

export const GET = withAuth(getMeHandler)
export const OPTIONS = () => {
  const response = new NextResponse(null, { status: 200 })
  return addSecurityHeaders(addCORSHeaders(response))
}
