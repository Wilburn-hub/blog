import { NextRequest, NextResponse } from 'next/server'
import { UploadService } from '@/lib/services/upload.service'
import { withAuth } from '@/lib/auth/middleware'
import { rateLimiter, RATE_LIMITS, getClientIP } from '@/lib/utils/rate-limiter'
import { addCORSHeaders, addSecurityHeaders } from '@/lib/auth/middleware'

async function uploadHandler(request: NextRequest, { user }: { user: any }) {
  const startTime = Date.now()

  try {
    // Rate limiting
    const clientIP = getClientIP(request)
    const rateLimitResult = await rateLimiter.checkLimit('upload', clientIP, RATE_LIMITS.upload)

    if (!rateLimitResult.allowed) {
      const response = NextResponse.json(
        {
          error: 'Too many upload attempts. Please try again later.',
          retryAfter: Math.ceil(rateLimitResult.resetTime!.getTime() / 1000),
        },
        { status: 429 }
      )
      return addSecurityHeaders(addCORSHeaders(response))
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const directory = (formData.get('directory') as string) || 'images'
    const maxSize = parseInt(formData.get('maxSize') as string) || undefined
    const generateThumbnail = formData.get('generateThumbnail') === 'true'

    // Validate file
    if (!file) {
      const response = NextResponse.json({ error: 'No file provided' }, { status: 400 })
      return addSecurityHeaders(addCORSHeaders(response))
    }

    // Validate directory
    const allowedDirectories = ['images', 'avatars', 'documents']
    if (!allowedDirectories.includes(directory)) {
      const response = NextResponse.json({ error: 'Invalid upload directory' }, { status: 400 })
      return addSecurityHeaders(addCORSHeaders(response))
    }

    // Upload file
    const uploadResult = await UploadService.uploadFile(file, {
      directory,
      maxSize,
      generateThumbnail,
    })

    const response = NextResponse.json(
      {
        message: 'File uploaded successfully',
        file: {
          ...uploadResult,
          sizeFormatted: UploadService.formatFileSize(uploadResult.size),
          isImage: UploadService.isImageFile(uploadResult.mimetype),
        },
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
    console.error('Upload error:', error)

    let status = 500
    let message = 'Internal server error'

    if (error.message.includes('File size')) {
      status = 400
      message = error.message
    } else if (error.message.includes('File type')) {
      status = 400
      message = error.message
    } else if (error.message.includes('File extension')) {
      status = 400
      message = error.message
    } else if (error.message.includes('File name')) {
      status = 400
      message = error.message
    }

    const response = NextResponse.json({ error: message }, { status })

    return addSecurityHeaders(addCORSHeaders(response))
  }
}

async function getUploadsHandler(request: NextRequest, { user }: { user: any }) {
  const startTime = Date.now()

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type') || undefined

    // Validate pagination parameters
    if (page < 1) {
      const response = NextResponse.json(
        { error: 'Page must be a positive integer' },
        { status: 400 }
      )
      return addSecurityHeaders(addCORSHeaders(response))
    }

    if (limit < 1 || limit > 100) {
      const response = NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      )
      return addSecurityHeaders(addCORSHeaders(response))
    }

    let result

    if (type) {
      result = await UploadService.getFilesByType(type, page, limit)
    } else {
      result = await UploadService.getUserFiles(user.id, page, limit)
    }

    // Format files with additional info
    const formattedFiles = result.files.map(file => ({
      ...file,
      sizeFormatted: UploadService.formatFileSize(file.size),
      isImage: UploadService.isImageFile(file.mimetype),
    }))

    const response = NextResponse.json({
      ...result,
      files: formattedFiles,
    })

    // Add security headers
    addSecurityHeaders(response)
    addCORSHeaders(response)

    // Add processing time header
    response.headers.set('X-Processing-Time', `${Date.now() - startTime}ms`)

    return response
  } catch (error) {
    console.error('Get uploads error:', error)

    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 })

    return addSecurityHeaders(addCORSHeaders(response))
  }
}

export const POST = withAuth(uploadHandler, { required: true })
export const GET = withAuth(getUploadsHandler, { required: true })

export function OPTIONS() {
  const response = new NextResponse(null, { status: 200 })
  return addSecurityHeaders(addCORSHeaders(response))
}
