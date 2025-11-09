import { NextRequest, NextResponse } from 'next/server'
import { SearchService } from '@/lib/services/search.service'
import { rateLimiter, RATE_LIMITS, getClientIP } from '@/lib/utils/rate-limiter'
import { addCORSHeaders, addSecurityHeaders } from '@/lib/auth/middleware'

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Rate limiting for search suggestions
    const clientIP = getClientIP(request)
    const rateLimitResult = await rateLimiter.checkLimit('search', clientIP, RATE_LIMITS.search)

    if (!rateLimitResult.allowed) {
      const response = NextResponse.json(
        {
          error: 'Too many search requests. Please try again later.',
          retryAfter: Math.ceil(rateLimitResult.resetTime!.getTime() / 1000),
        },
        { status: 429 }
      )
      return addSecurityHeaders(addCORSHeaders(response))
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '10')

    // Validate limit
    if (limit < 1 || limit > 20) {
      const response = NextResponse.json(
        { error: 'Limit must be between 1 and 20' },
        { status: 400 }
      )
      return addSecurityHeaders(addCORSHeaders(response))
    }

    // Validate query length
    if (query.length < 2) {
      const response = NextResponse.json({
        suggestions: [],
        tags: [],
      })

      return addSecurityHeaders(addCORSHeaders(response))
    }

    const suggestions = await SearchService.getSearchSuggestions(query, limit)

    const response = NextResponse.json(suggestions)

    // Add security headers
    addSecurityHeaders(response)
    addCORSHeaders(response)

    // Add processing time header
    response.headers.set('X-Processing-Time', `${Date.now() - startTime}ms`)

    return response
  } catch (error) {
    console.error('Search suggestions error:', error)

    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 })

    return addSecurityHeaders(addCORSHeaders(response))
  }
}

export function OPTIONS() {
  const response = new NextResponse(null, { status: 200 })
  return addSecurityHeaders(addCORSHeaders(response))
}
