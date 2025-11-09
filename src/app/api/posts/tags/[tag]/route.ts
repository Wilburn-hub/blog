import { NextRequest, NextResponse } from 'next/server'
import { PostService } from '@/lib/services/post.service'
import { addCORSHeaders, addSecurityHeaders } from '@/lib/auth/middleware'

interface RouteParams {
  params: Promise<{ tag: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const startTime = Date.now()

  try {
    const resolvedParams = await params
    const { tag } = resolvedParams

    if (!tag) {
      const response = NextResponse.json({ error: 'Tag is required' }, { status: 400 })
      return addSecurityHeaders(addCORSHeaders(response))
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

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

    const result = await PostService.getPostsByTag(tag, page, limit)

    // If no posts found for this tag
    if (result.posts.length === 0 && result.pagination.page === 1) {
      const response = NextResponse.json({ error: 'No posts found for this tag' }, { status: 404 })
      return addSecurityHeaders(addCORSHeaders(response))
    }

    const response = NextResponse.json(result)

    // Add security headers
    addSecurityHeaders(response)
    addCORSHeaders(response)

    // Add processing time header
    response.headers.set('X-Processing-Time', `${Date.now() - startTime}ms`)

    return response
  } catch (error) {
    console.error('Get posts by tag error:', error)

    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 })

    return addSecurityHeaders(addCORSHeaders(response))
  }
}

export function OPTIONS() {
  const response = new NextResponse(null, { status: 200 })
  return addSecurityHeaders(addCORSHeaders(response))
}
