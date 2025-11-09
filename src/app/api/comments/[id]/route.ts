import { NextRequest, NextResponse } from 'next/server'
import { CommentService } from '@/lib/services/comment.service'
import { withAuth } from '@/lib/auth/middleware'
import { updateCommentSchema, validateRequest } from '@/lib/utils/validation'
import { addCORSHeaders, addSecurityHeaders } from '@/lib/auth/middleware'

interface RouteParams {
  params: Promise<{ id: string }>
}

async function getCommentHandler(request: NextRequest, { params }: { params: { id: string } }) {
  const startTime = Date.now()

  try {
    const { id } = params

    if (!id) {
      const response = NextResponse.json({ error: 'Comment ID is required' }, { status: 400 })
      return addSecurityHeaders(addCORSHeaders(response))
    }

    const comment = await CommentService.getCommentById(id)

    if (!comment) {
      const response = NextResponse.json({ error: 'Comment not found' }, { status: 404 })
      return addSecurityHeaders(addCORSHeaders(response))
    }

    const response = NextResponse.json({ comment })

    // Add security headers
    addSecurityHeaders(response)
    addCORSHeaders(response)

    // Add processing time header
    response.headers.set('X-Processing-Time', `${Date.now() - startTime}ms`)

    return response
  } catch (error) {
    console.error('Get comment error:', error)

    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 })

    return addSecurityHeaders(addCORSHeaders(response))
  }
}

async function updateCommentHandler(
  request: NextRequest,
  { user, params }: { user: any; params: { id: string } }
) {
  const startTime = Date.now()

  try {
    const { id } = params

    if (!id) {
      const response = NextResponse.json({ error: 'Comment ID is required' }, { status: 400 })
      return addSecurityHeaders(addCORSHeaders(response))
    }

    // Validate request body
    const validation = await validateRequest(updateCommentSchema)
    if (!validation.success) {
      const response = NextResponse.json(
        { error: validation.error.message, details: validation.error.details },
        { status: 400 }
      )
      return addSecurityHeaders(addCORSHeaders(response))
    }

    const { content } = validation.data

    // Check if user can edit this comment
    const canEdit = await CommentService.canUserEditComment(id, user.id, user.role)
    if (!canEdit) {
      const response = NextResponse.json(
        { error: 'Not authorized to edit this comment' },
        { status: 403 }
      )
      return addSecurityHeaders(addCORSHeaders(response))
    }

    const updatedComment = await CommentService.updateComment(id, { content }, user.id)

    const response = NextResponse.json({
      message: 'Comment updated successfully',
      comment: updatedComment,
    })

    // Add security headers
    addSecurityHeaders(response)
    addCORSHeaders(response)

    // Add processing time header
    response.headers.set('X-Processing-Time', `${Date.now() - startTime}ms`)

    return response
  } catch (error: any) {
    console.error('Update comment error:', error)

    let status = 500
    let message = 'Internal server error'

    if (error.message === 'Comment not found') {
      status = 404
      message = 'Comment not found'
    } else if (error.message === 'Not authorized to update this comment') {
      status = 403
      message = 'Not authorized to update this comment'
    }

    const response = NextResponse.json({ error: message }, { status })

    return addSecurityHeaders(addCORSHeaders(response))
  }
}

async function deleteCommentHandler(
  request: NextRequest,
  { user, params }: { user: any; params: { id: string } }
) {
  const startTime = Date.now()

  try {
    const { id } = params

    if (!id) {
      const response = NextResponse.json({ error: 'Comment ID is required' }, { status: 400 })
      return addSecurityHeaders(addCORSHeaders(response))
    }

    // Check if user can delete this comment
    const canDelete = await CommentService.canUserDeleteComment(id, user.id, user.role)
    if (!canDelete) {
      const response = NextResponse.json(
        { error: 'Not authorized to delete this comment' },
        { status: 403 }
      )
      return addSecurityHeaders(addCORSHeaders(response))
    }

    await CommentService.deleteComment(id, user.id)

    const response = NextResponse.json({
      message: 'Comment deleted successfully',
    })

    // Add security headers
    addSecurityHeaders(response)
    addCORSHeaders(response)

    // Add processing time header
    response.headers.set('X-Processing-Time', `${Date.now() - startTime}ms`)

    return response
  } catch (error: any) {
    console.error('Delete comment error:', error)

    let status = 500
    let message = 'Internal server error'

    if (error.message === 'Comment not found') {
      status = 404
      message = 'Comment not found'
    } else if (error.message === 'Not authorized to delete this comment') {
      status = 403
      message = 'Not authorized to delete this comment'
    }

    const response = NextResponse.json({ error: message }, { status })

    return addSecurityHeaders(addCORSHeaders(response))
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params
  return getCommentHandler(request, { params: resolvedParams })
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params
  return withAuth(
    (req, context) => updateCommentHandler(req, { ...context, params: resolvedParams }),
    { required: true }
  )(request, {})
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params
  return withAuth(
    (req, context) => deleteCommentHandler(req, { ...context, params: resolvedParams }),
    { required: true }
  )(request, {})
}

export function OPTIONS() {
  const response = new NextResponse(null, { status: 200 })
  return addSecurityHeaders(addCORSHeaders(response))
}
