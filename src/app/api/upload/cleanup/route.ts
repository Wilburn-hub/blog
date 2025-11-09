import { NextRequest, NextResponse } from 'next/server'
import { UploadService } from '@/lib/services/upload.service'
import { withAdmin } from '@/lib/auth/middleware'
import { addCORSHeaders, addSecurityHeaders } from '@/lib/auth/middleware'

async function cleanupHandler(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { searchParams } = new URL(request.url)
    const olderThanDays = parseInt(searchParams.get('olderThanDays') || '30')

    // Validate olderThanDays
    if (olderThanDays < 1) {
      const response = NextResponse.json(
        { error: 'olderThanDays must be at least 1' },
        { status: 400 }
      )
      return addSecurityHeaders(addCORSHeaders(response))
    }

    const result = await UploadService.cleanupUnusedFiles(olderThanDays)

    const response = NextResponse.json({
      message: 'Cleanup completed successfully',
      ...result,
    })

    // Add security headers
    addSecurityHeaders(response)
    addCORSHeaders(response)

    // Add processing time header
    response.headers.set('X-Processing-Time', `${Date.now() - startTime}ms`)

    return response
  } catch (error) {
    console.error('Cleanup error:', error)

    const response = NextResponse.json(
      { error: 'Internal server error during cleanup' },
      { status: 500 }
    )

    return addSecurityHeaders(addCORSHeaders(response))
  }
}

export const POST = withAdmin(cleanupHandler)

export function OPTIONS() {
  const response = new NextResponse(null, { status: 200 })
  return addSecurityHeaders(addCORSHeaders(response))
}
