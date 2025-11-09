import { NextRequest, NextResponse } from 'next/server'
import { PostService } from '@/lib/services/post.service'
import { withOptionalAuth, withAuth } from '@/lib/auth/middleware'
import { addCORSHeaders, addSecurityHeaders } from '@/lib/auth/middleware'

async function getPostsHandler(request: NextRequest, { user }: { user?: any }) {
  const startTime = Date.now()

  try {
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const published = searchParams.get('published') !== 'false' // Default to true
    const featured = searchParams.get('featured') === 'true'
    const authorId = searchParams.get('authorId') || undefined
    const category = searchParams.get('category') || undefined
    const search = searchParams.get('search') || undefined
    const sort = (searchParams.get('sort') as any) || 'latest'

    // Parse tags
    const tagsParam = searchParams.get('tags')
    const tags = tagsParam ? tagsParam.split(',').filter(Boolean) : undefined

    // Build options object
    const options = {
      page,
      limit,
      published: user ? undefined : published, // Authenticated users can see all posts
      featured,
      authorId,
      tags,
      category,
      search,
      sort,
    }

    const result = await PostService.getPosts(options)

    const response = NextResponse.json(result)

    // Add security headers
    addSecurityHeaders(response)
    addCORSHeaders(response)

    // Add processing time header
    response.headers.set('X-Processing-Time', `${Date.now() - startTime}ms`)

    return response
  } catch (error) {
    console.error('Get posts error:', error)

    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 })

    return addSecurityHeaders(addCORSHeaders(response))
  }
}

async function createPostHandler(request: NextRequest, { user }: { user: any }) {
  const startTime = Date.now()

  try {
    if (!user) {
      const response = NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      return addSecurityHeaders(addCORSHeaders(response))
    }

    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.content) {
      const response = NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
      return addSecurityHeaders(addCORSHeaders(response))
    }

    const postData = {
      title: body.title,
      content: body.content,
      excerpt: body.excerpt,
      coverImage: body.coverImage,
      tags: body.tags || [],
      featured: body.featured || false,
      published: body.published || false,
      categoryIds: body.categoryIds,
      authorId: user.id,
    }

    const post = await PostService.createPost(postData)

    const response = NextResponse.json(
      {
        message: 'Post created successfully',
        post,
      },
      { status: 201 }
    )

    // Add security headers
    addSecurityHeaders(response)
    addCORSHeaders(response)

    // Add processing time header
    response.headers.set('X-Processing-Time', `${Date.now() - startTime}ms`)

    return response
  } catch (error) {
    console.error('Create post error:', error)

    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 })

    return addSecurityHeaders(addCORSHeaders(response))
  }
}

export const GET = withOptionalAuth(getPostsHandler)
export const POST = withAuth(createPostHandler, { required: true })

export function OPTIONS() {
  const response = new NextResponse(null, { status: 200 })
  return addSecurityHeaders(addCORSHeaders(response))
}
