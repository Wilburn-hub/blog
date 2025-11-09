import { NextRequest, NextResponse } from 'next/server'
import { PostService } from '@/lib/services/post.service'
import { addCORSHeaders, addSecurityHeaders } from '@/lib/auth/middleware'

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '5')

    // Validate limit
    if (limit < 1 || limit > 20) {
      const response = NextResponse.json(
        { error: 'Limit must be between 1 and 20' },
        { status: 400 }
      )
      return addSecurityHeaders(addCORSHeaders(response))
    }

    const posts = await PostService.getFeaturedPosts(limit)

    const response = NextResponse.json({
      posts,
      count: posts.length,
    })

    // Add security headers
    addSecurityHeaders(response)
    addCORSHeaders(response)

    // Add processing time header
    response.headers.set('X-Processing-Time', `${Date.now() - startTime}ms`)

    return response
  } catch (error) {
    console.error('Get featured posts error:', error)

    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 })

    return addSecurityHeaders(addCORSHeaders(response))
  }
}

export function OPTIONS() {
  const response = new NextResponse(null, { status: 200 })
  return addSecurityHeaders(addCORSHeaders(response))
}
