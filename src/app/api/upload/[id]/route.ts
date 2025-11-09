import { NextRequest, NextResponse } from 'next/server'
import { UploadService } from '@/lib/services/upload.service'
import { withAuth } from '@/lib/auth/middleware'
import { addCORSHeaders, addSecurityHeaders } from '@/lib/auth/middleware'

interface RouteParams {
  params: Promise<{ id: string }>
}

async function getFileHandler(request: NextRequest, { params }: { params: { id: string } }) {
  const startTime = Date.now()

  try {
    const { id } = params

    if (!id) {
      const response = NextResponse.json({ error: 'File ID is required' }, { status: 400 })
      return addSecurityHeaders(addCORSHeaders(response))
    }

    const fileRecord = await UploadService.getFileRecord(id)

    if (!fileRecord) {
      const response = NextResponse.json({ error: 'File not found' }, { status: 404 })
      return addSecurityHeaders(addCORSHeaders(response))
    }

    const response = NextResponse.json({
      file: {
        ...fileRecord,
        sizeFormatted: UploadService.formatFileSize(fileRecord.size),
        isImage: UploadService.isImageFile(fileRecord.mimetype),
      },
    })

    // Add security headers
    addSecurityHeaders(response)
    addCORSHeaders(response)

    // Add processing time header
    response.headers.set('X-Processing-Time', `${Date.now() - startTime}ms`)

    return response
  } catch (error) {
    console.error('Get file error:', error)

    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 })

    return addSecurityHeaders(addCORSHeaders(response))
  }
}

async function deleteFileHandler(
  request: NextRequest,
  { user }: { user: any; params: { id: string } }
) {
  const startTime = Date.now()

  try {
    const { id } = params

    if (!id) {
      const response = NextResponse.json({ error: 'File ID is required' }, { status: 400 })
      return addSecurityHeaders(addCORSHeaders(response))
    }

    // For now, we'll allow any authenticated user to delete files
    // In a real application, you might want to check ownership
    await UploadService.deleteFile(id)

    const response = NextResponse.json({
      message: 'File deleted successfully',
    })

    // Add security headers
    addSecurityHeaders(response)
    addCORSHeaders(response)

    // Add processing time header
    response.headers.set('X-Processing-Time', `${Date.now() - startTime}ms`)

    return response
  } catch (error: any) {
    console.error('Delete file error:', error)

    let status = 500
    let message = 'Internal server error'

    if (error.message === 'File not found') {
      status = 404
      message = 'File not found'
    }

    const response = NextResponse.json({ error: message }, { status })

    return addSecurityHeaders(addCORSHeaders(response))
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params
  return getFileHandler(request, { params: resolvedParams })
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params
  return withAuth(
    (req, context) => deleteFileHandler(req, { ...context, params: resolvedParams }),
    { required: true }
  )(request, {})
}

export function OPTIONS() {
  const response = new NextResponse(null, { status: 200 })
  return addSecurityHeaders(addCORSHeaders(response))
}
