import { NextRequest, NextResponse } from 'next/server'
import { PostService } from '@/lib/services/post.service'
import { withOptionalAuth } from '@/lib/auth/middleware'
import { addCORSHeaders, addSecurityHeaders, getClientIP } from '@/lib/auth/middleware'

interface RouteParams {
  params: Promise<{ slug: string }>
}

async function getPostHandler(
  request: NextRequest,
  { user, params }: { user?: any; params: { slug: string } }
) {
  const startTime = Date.now()

  try {
    const { slug } = params

    if (!slug) {
      const response = NextResponse.json({ error: 'Post slug is required' }, { status: 400 })
      return addSecurityHeaders(addCORSHeaders(response))
    }

    // Get post (authenticated users can see unpublished posts if they are the author)
    const includeUnpublished = user ? true : false
    const post = await PostService.getPostBySlug(slug, includeUnpublished)

    if (!post) {
      const response = NextResponse.json({ error: 'Post not found' }, { status: 404 })
      return addSecurityHeaders(addCORSHeaders(response))
    }

    // Check if user is authorized to view unpublished post
    if (!post.published && (!user || (user.id !== post.authorId && user.role !== 'ADMIN'))) {
      const response = NextResponse.json({ error: 'Post not found' }, { status: 404 })
      return addSecurityHeaders(addCORSHeaders(response))
    }

    // Increment view count for published posts
    if (post.published) {
      const ip = getClientIP(request)
      const userAgent = request.headers.get('user-agent') || undefined
      await PostService.incrementViewCount(post.id, ip, userAgent)
    }

    const response = NextResponse.json({ post })

    // Add security headers
    addSecurityHeaders(response)
    addCORSHeaders(response)

    // Add processing time header
    response.headers.set('X-Processing-Time', `${Date.now() - startTime}ms`)

    return response
  } catch (error) {
    console.error('Get post error:', error)

    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 })

    return addSecurityHeaders(addCORSHeaders(response))
  }
}

async function updatePostHandler(
  request: NextRequest,
  { user, params }: { user: any; params: { slug: string } }
) {
  const startTime = Date.now()

  try {
    if (!user) {
      const response = NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      return addSecurityHeaders(addCORSHeaders(response))
    }

    const { slug } = params

    if (!slug) {
      const response = NextResponse.json({ error: 'Post slug is required' }, { status: 400 })
      return addSecurityHeaders(addCORSHeaders(response))
    }

    // Get existing post to verify ownership
    const existingPost = await PostService.getPostBySlug(slug, true)
    if (!existingPost) {
      const response = NextResponse.json({ error: 'Post not found' }, { status: 404 })
      return addSecurityHeaders(addCORSHeaders(response))
    }

    // Check authorization
    if (existingPost.authorId !== user.id && user.role !== 'ADMIN') {
      const response = NextResponse.json(
        { error: 'Not authorized to update this post' },
        { status: 403 }
      )
      return addSecurityHeaders(addCORSHeaders(response))
    }

    const body = await request.json()

    const updateData = {
      title: body.title,
      content: body.content,
      excerpt: body.excerpt,
      coverImage: body.coverImage,
      tags: body.tags,
      featured: body.featured,
      published: body.published,
      categoryIds: body.categoryIds,
    }

    const updatedPost = await PostService.updatePost(
      existingPost.id,
      updateData,
      existingPost.authorId
    )

    const response = NextResponse.json({
      message: 'Post updated successfully',
      post: updatedPost,
    })

    // Add security headers
    addSecurityHeaders(response)
    addCORSHeaders(response)

    // Add processing time header
    response.headers.set('X-Processing-Time', `${Date.now() - startTime}ms`)

    return response
  } catch (error: any) {
    console.error('Update post error:', error)

    let status = 500
    let message = 'Internal server error'

    if (error.message === 'Post not found') {
      status = 404
      message = 'Post not found'
    } else if (error.message === 'Not authorized to update this post') {
      status = 403
      message = 'Not authorized to update this post'
    }

    const response = NextResponse.json({ error: message }, { status })

    return addSecurityHeaders(addCORSHeaders(response))
  }
}

async function deletePostHandler(
  request: NextRequest,
  { user, params }: { user: any; params: { slug: string } }
) {
  const startTime = Date.now()

  try {
    if (!user) {
      const response = NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      return addSecurityHeaders(addCORSHeaders(response))
    }

    const { slug } = params

    if (!slug) {
      const response = NextResponse.json({ error: 'Post slug is required' }, { status: 400 })
      return addSecurityHeaders(addCORSHeaders(response))
    }

    // Get existing post to verify ownership
    const existingPost = await PostService.getPostBySlug(slug, true)
    if (!existingPost) {
      const response = NextResponse.json({ error: 'Post not found' }, { status: 404 })
      return addSecurityHeaders(addCORSHeaders(response))
    }

    // Check authorization
    if (existingPost.authorId !== user.id && user.role !== 'ADMIN') {
      const response = NextResponse.json(
        { error: 'Not authorized to delete this post' },
        { status: 403 }
      )
      return addSecurityHeaders(addCORSHeaders(response))
    }

    await PostService.deletePost(existingPost.id, existingPost.authorId)

    const response = NextResponse.json({
      message: 'Post deleted successfully',
    })

    // Add security headers
    addSecurityHeaders(response)
    addCORSHeaders(response)

    // Add processing time header
    response.headers.set('X-Processing-Time', `${Date.now() - startTime}ms`)

    return response
  } catch (error: any) {
    console.error('Delete post error:', error)

    let status = 500
    let message = 'Internal server error'

    if (error.message === 'Post not found') {
      status = 404
      message = 'Post not found'
    } else if (error.message === 'Not authorized to delete this post') {
      status = 403
      message = 'Not authorized to delete this post'
    }

    const response = NextResponse.json({ error: message }, { status })

    return addSecurityHeaders(addCORSHeaders(response))
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params
  return withOptionalAuth((req, context) =>
    getPostHandler(req, { ...context, params: resolvedParams })
  )(request, {})
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params
  return withOptionalAuth(
    (req, context) => updatePostHandler(req, { ...context, params: resolvedParams }),
    { required: true }
  )(request, {})
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params
  return withOptionalAuth(
    (req, context) => deletePostHandler(req, { ...context, params: resolvedParams }),
    { required: true }
  )(request, {})
}

export function OPTIONS() {
  const response = new NextResponse(null, { status: 200 })
  return addSecurityHeaders(addCORSHeaders(response))
}
