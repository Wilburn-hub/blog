import { NextRequest, NextResponse } from 'next/server'
import { CommentService } from '@/lib/services/comment.service'
import { withAuth } from '@/lib/auth/middleware'
import { createCommentSchema, validateRequest } from '@/lib/utils/validation'
import { rateLimiter, RATE_LIMITS, getClientIP } from '@/lib/utils/rate-limiter'
import { addCORSHeaders, addSecurityHeaders } from '@/lib/auth/middleware'

async function getCommentsHandler(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const postId = searchParams.get('postId') || undefined
    const authorId = searchParams.get('authorId') || undefined
    const parentId = searchParams.get('parentId') || undefined
    const sortBy = (searchParams.get('sortBy') as any) || 'latest'
    const search = searchParams.get('search') || undefined

    // Validate pagination parameters
    if (page < 1) {
      const response = NextResponse.json(
        { error: 'Page must be a positive integer' },
        { status: 400 }
      )
      return addSecurityHeaders(addCORSHeaders(response))
    }

    if (limit < 1 || limit > 50) {
      const response = NextResponse.json(
        { error: 'Limit must be between 1 and 50' },
        { status: 400 }
      )
      return addSecurityHeaders(addCORSHeaders(response))
    }

    let result

    if (search) {
      result = await CommentService.searchComments(search, page, limit)
    } else {
      result = await CommentService.getComments({
        page,
        limit,
        postId,
        authorId,
        parentId: parentId === 'null' ? undefined : parentId,
        sortBy,
      })
    }

    const response = NextResponse.json(result)

    // Add security headers
    addSecurityHeaders(response)
    addCORSHeaders(response)

    // Add processing time header
    response.headers.set('X-Processing-Time', `${Date.now() - startTime}ms`)

    return response
  } catch (error) {
    console.error('Get comments error:', error)

    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 })

    return addSecurityHeaders(addCORSHeaders(response))
  }
}

async function createCommentHandler(request: NextRequest, { user }: { user: any }) {
  const startTime = Date.now()

  try {
    // Rate limiting
    const clientIP = getClientIP(request)
    const rateLimitResult = await rateLimiter.checkLimit('comment', clientIP, RATE_LIMITS.comment)

    if (!rateLimitResult.allowed) {
      const response = NextResponse.json(
        {
          error: 'Too many comments. Please wait before commenting again.',
          retryAfter: Math.ceil(rateLimitResult.resetTime!.getTime() / 1000),
        },
        { status: 429 }
      )
      return addSecurityHeaders(addCORSHeaders(response))
    }

    // Validate request body
    const validation = await validateRequest(createCommentSchema)(request)
    if (!validation.success) {
      const response = NextResponse.json(
        { error: validation.error.message, details: validation.error.details },
        { status: 400 }
      )
      return addSecurityHeaders(addCORSHeaders(response))
    }

    const { content, postId, parentId } = validation.data

    const commentData = {
      content,
      postId,
      authorId: user.id,
      parentId,
    }

    const comment = await CommentService.createComment(commentData)

    const response = NextResponse.json(
      {
        message: 'Comment created successfully',
        comment,
      },
      { status: 201 }
    )

    // Add security headers
    addSecurityHeaders(response)
    addCORSHeaders(response)

    // Add processing time header
    response.headers.set('X-Processing-Time', `${Date.now() - startTime}ms`)

    return response
  } catch (error: any) {
    console.error('Create comment error:', error)

    let status = 500
    let message = 'Internal server error'

    if (error.message === 'Post not found') {
      status = 404
      message = 'Post not found'
    } else if (error.message === 'Cannot comment on unpublished post') {
      status = 400
      message = 'Cannot comment on this post'
    } else if (error.message === 'Parent comment not found or invalid') {
      status = 400
      message = 'Invalid parent comment'
    }

    const response = NextResponse.json({ error: message }, { status })

    return addSecurityHeaders(addCORSHeaders(response))
  }
}

export const GET = getCommentsHandler
export const POST = withAuth(createCommentHandler, { required: true })

export function OPTIONS() {
  const response = new NextResponse(null, { status: 200 })
  return addSecurityHeaders(addCORSHeaders(response))
}
