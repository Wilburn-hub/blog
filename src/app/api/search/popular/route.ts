import { NextRequest, NextResponse } from 'next/server'
import { SearchService } from '@/lib/services/search.service'
import { addCORSHeaders, addSecurityHeaders } from '@/lib/auth/middleware'

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Validate limit
    if (limit < 1 || limit > 20) {
      const response = NextResponse.json(
        { error: 'Limit must be between 1 and 20' },
        { status: 400 }
      )
      return addSecurityHeaders(addCORSHeaders(response))
    }

    const popularSearches = await SearchService.getPopularSearches(limit)

    const response = NextResponse.json({
      popularSearches,
      count: popularSearches.length,
    })

    // Add security headers
    addSecurityHeaders(response)
    addCORSHeaders(response)

    // Add processing time header
    response.headers.set('X-Processing-Time', `${Date.now() - startTime}ms`)

    return response
  } catch (error) {
    console.error('Get popular searches error:', error)

    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 })

    return addSecurityHeaders(addCORSHeaders(response))
  }
}

export function OPTIONS() {
  const response = new NextResponse(null, { status: 200 })
  return addSecurityHeaders(addCORSHeaders(response))
}
