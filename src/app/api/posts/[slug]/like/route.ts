import { NextRequest, NextResponse } from 'next/server'
import { LikeService } from '@/lib/services/like.service'
import { PostService } from '@/lib/services/post.service'
import { withAuth } from '@/lib/auth/middleware'
import { rateLimiter, RATE_LIMITS, getClientIP } from '@/lib/utils/rate-limiter'
import { addCORSHeaders, addSecurityHeaders } from '@/lib/auth/middleware'

interface RouteParams {
  params: Promise<{ slug: string }>
}

async function handleLike(
  request: NextRequest,
  { user, params }: { user: any; params: { slug: string } }
) {
  const startTime = Date.now()

  try {
    // Rate limiting
    const clientIP = getClientIP(request)
    const rateLimitResult = await rateLimiter.checkLimit('like', clientIP, RATE_LIMITS.like)

    if (!rateLimitResult.allowed) {
      const response = NextResponse.json(
        {
          error: 'Too many like actions. Please wait before trying again.',
          retryAfter: Math.ceil(rateLimitResult.resetTime!.getTime() / 1000),
        },
        { status: 429 }
      )
      return addSecurityHeaders(addCORSHeaders(response))
    }

    const { slug } = params

    if (!slug) {
      const response = NextResponse.json({ error: 'Post slug is required' }, { status: 400 })
      return addSecurityHeaders(addCORSHeaders(response))
    }

    // Get post to verify it exists and get its ID
    const post = await PostService.getPostBySlug(slug, true)
    if (!post) {
      const response = NextResponse.json({ error: 'Post not found' }, { status: 404 })
      return addSecurityHeaders(addCORSHeaders(response))
    }

    // Toggle like
    const result = await LikeService.togglePostLike(post.id, user.id)

    const response = NextResponse.json({
      message: result.liked ? 'Post liked successfully' : 'Post unliked successfully',
      ...result,
    })

    // Add security headers
    addSecurityHeaders(response)
    addCORSHeaders(response)

    // Add processing time header
    response.headers.set('X-Processing-Time', `${Date.now() - startTime}ms`)

    return response
  } catch (error: any) {
    console.error('Like post error:', error)

    let status = 500
    let message = 'Internal server error'

    if (error.message === 'Post not found') {
      status = 404
      message = 'Post not found'
    }

    const response = NextResponse.json({ error: message }, { status })

    return addSecurityHeaders(addCORSHeaders(response))
  }
}

async function getLikeStatus(request: NextRequest, { params }: { params: { slug: string } }) {
  const startTime = Date.now()

  try {
    const { slug } = params

    if (!slug) {
      const response = NextResponse.json({ error: 'Post slug is required' }, { status: 400 })
      return addSecurityHeaders(addCORSHeaders(response))
    }

    // Get post to verify it exists
    const post = await PostService.getPostBySlug(slug, true)
    if (!post) {
      const response = NextResponse.json({ error: 'Post not found' }, { status: 404 })
      return addSecurityHeaders(addCORSHeaders(response))
    }

    // Get like status
    const status = await LikeService.getPostLikeStatus(post.id)

    const response = NextResponse.json(status)

    // Add security headers
    addSecurityHeaders(response)
    addCORSHeaders(response)

    // Add processing time header
    response.headers.set('X-Processing-Time', `${Date.now() - startTime}ms`)

    return response
  } catch (error) {
    console.error('Get like status error:', error)

    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 })

    return addSecurityHeaders(addCORSHeaders(response))
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params
  return withAuth((req, context) => handleLike(req, { ...context, params: resolvedParams }), {
    required: true,
  })(request, {})
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params
  return getLikeStatus(request, { params: resolvedParams })
}

export function OPTIONS() {
  const response = new NextResponse(null, { status: 200 })
  return addSecurityHeaders(addCORSHeaders(response))
}
