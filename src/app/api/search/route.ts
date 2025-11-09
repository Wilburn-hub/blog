import { NextRequest, NextResponse } from 'next/server'
import { SearchService } from '@/lib/services/search.service'
import { searchSchema, validateRequest } from '@/lib/utils/validation'
import { rateLimiter, RATE_LIMITS, getClientIP } from '@/lib/utils/rate-limiter'
import { addCORSHeaders, addSecurityHeaders } from '@/lib/auth/middleware'

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Rate limiting for search
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

    // Parse and validate search parameters
    const searchParamsObj = {
      q: searchParams.get('q') || '',
      type: (searchParams.get('type') as any) || 'all',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      tags: searchParams.get('tags')?.split(',').filter(Boolean),
      category: searchParams.get('category') || undefined,
      author: searchParams.get('author') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'relevance',
    }

    const validation = validateInput(searchSchema, searchParamsObj)

    if (!validation.q || validation.q.trim().length === 0) {
      const response = NextResponse.json({ error: 'Search query is required' }, { status: 400 })
      return addSecurityHeaders(addCORSHeaders(response))
    }

    // Perform search
    const results = await SearchService.search(validation)

    const response = NextResponse.json(results)

    // Add security headers
    addSecurityHeaders(response)
    addCORSHeaders(response)

    // Add processing time header
    response.headers.set('X-Processing-Time', `${Date.now() - startTime}ms`)

    return response
  } catch (error: any) {
    console.error('Search error:', error)

    let status = 500
    let message = 'Internal server error'

    if (error.message.includes('Page must be a positive integer')) {
      status = 400
      message = error.message
    } else if (error.message.includes('Limit must be between 1 and 50')) {
      status = 400
      message = error.message
    }

    const response = NextResponse.json({ error: message }, { status })

    return addSecurityHeaders(addCORSHeaders(response))
  }
}

export function OPTIONS() {
  const response = new NextResponse(null, { status: 200 })
  return addSecurityHeaders(addCORSHeaders(response))
}
