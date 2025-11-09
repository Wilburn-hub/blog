import { prisma } from '../db/prisma'
import { CacheService } from '../cache/redis'
import { nanoid } from 'nanoid'

export interface CreatePostData {
  title: string
  content: string
  excerpt?: string
  coverImage?: string
  tags?: string[]
  featured?: boolean
  published?: boolean
  categoryIds?: string[]
  authorId: string
}

export interface UpdatePostData extends Partial<CreatePostData> {}

export interface PostQueryOptions {
  page?: number
  limit?: number
  published?: boolean
  featured?: boolean
  authorId?: string
  tags?: string[]
  category?: string
  search?: string
  sort?: 'latest' | 'oldest' | 'popular' | 'views'
}

export class PostService {
  static async createPost(postData: CreatePostData) {
    const { categoryIds, ...postDataWithoutCategories } = postData

    // Generate unique slug
    const baseSlug = this.generateSlug(postData.title)
    const slug = await this.generateUniqueSlug(baseSlug)

    // Calculate reading time (rough estimate: 200 words per minute)
    const wordCount = postData.content.split(/\s+/).length
    const readingTime = Math.ceil(wordCount / 200)

    const post = await prisma.post.create({
      data: {
        ...postDataWithoutCategories,
        slug,
        readingTime,
        publishedAt: postData.published ? new Date() : null,
        categories: categoryIds
          ? {
              connect: categoryIds.map(id => ({ id })),
            }
          : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    })

    // Invalidate cache
    await this.invalidatePostCache()

    return post
  }

  static async getPostBySlug(slug: string, includeUnpublished = false) {
    // Try to get from cache first
    const cache = await CacheService.getInstance()
    const cacheKey = includeUnpublished ? `post:${slug}:all` : `post:${slug}:published`
    const cachedPost = await cache.get(cacheKey)

    if (cachedPost) {
      return cachedPost
    }

    const where = { slug }
    if (!includeUnpublished) {
      Object.assign(where, { published: true })
    }

    const post = await prisma.post.findFirst({
      where,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            bio: true,
          },
        },
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    })

    if (post) {
      // Cache the post
      await cache.set(cacheKey, post, 3600) // 1 hour
    }

    return post
  }

  static async getPostById(id: string, includeUnpublished = false) {
    const where = { id }
    if (!includeUnpublished) {
      Object.assign(where, { published: true })
    }

    return prisma.post.findFirst({
      where,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        categories: true,
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    })
  }

  static async getPosts(options: PostQueryOptions = {}) {
    const {
      page = 1,
      limit = 10,
      published = true,
      featured,
      authorId,
      tags,
      category,
      search,
      sort = 'latest',
    } = options

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (published !== undefined) {
      where.published = published
    }

    if (featured !== undefined) {
      where.featured = featured
    }

    if (authorId) {
      where.authorId = authorId
    }

    if (tags && tags.length > 0) {
      where.tags = {
        hasEvery: tags,
      }
    }

    if (category) {
      where.categories = {
        some: {
          slug: category,
        },
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Build order clause
    let orderBy: any = {}
    switch (sort) {
      case 'oldest':
        orderBy = { createdAt: 'asc' }
        break
      case 'popular':
        orderBy = [{ likes: { _count: 'desc' } }, { viewCount: 'desc' }, { createdAt: 'desc' }]
        break
      case 'views':
        orderBy = { viewCount: 'desc' }
        break
      case 'latest':
      default:
        if (published) {
          orderBy = { publishedAt: 'desc' }
        } else {
          orderBy = { createdAt: 'desc' }
        }
        break
    }

    // Skip cache for now to avoid Redis issues
    // const cacheService = await CacheService.getInstance()
    // const cacheKey = `posts:${JSON.stringify(options)}`
    // const cachedResult = await cacheService.get(cacheKey)

    // if (cachedResult) {
    //   return cachedResult
    // }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          },
          categories: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true,
            },
          },
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
      }),
      prisma.post.count({ where }),
    ])

    const result = {
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }

    // Skip caching for now
    // await cacheService.set(cacheKey, result, 1800) // 30 minutes

    return result
  }

  static async updatePost(id: string, postData: UpdatePostData, authorId: string) {
    const existingPost = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    })

    if (!existingPost) {
      throw new Error('Post not found')
    }

    if (existingPost.authorId !== authorId) {
      throw new Error('Not authorized to update this post')
    }

    const { categoryIds, ...postDataWithoutCategories } = postData

    // Update slug if title changed
    let slug: string | undefined
    if (postData.title) {
      const baseSlug = this.generateSlug(postData.title)
      slug = await this.generateUniqueSlug(baseSlug, id)
    }

    // Recalculate reading time if content changed
    let readingTime: number | undefined
    if (postData.content) {
      const wordCount = postData.content.split(/\s+/).length
      readingTime = Math.ceil(wordCount / 200)
    }

    const post = await prisma.post.update({
      where: { id },
      data: {
        ...postDataWithoutCategories,
        ...(slug && { slug }),
        ...(readingTime && { readingTime }),
        publishedAt:
          postData.published === true && !existingPost.published ? new Date() : undefined,
        categories: categoryIds
          ? {
              set: categoryIds.map(id => ({ id })),
            }
          : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    })

    // Invalidate cache
    await this.invalidatePostCache(post.slug)

    return post
  }

  static async deletePost(id: string, authorId: string) {
    const existingPost = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true, slug: true },
    })

    if (!existingPost) {
      throw new Error('Post not found')
    }

    if (existingPost.authorId !== authorId) {
      throw new Error('Not authorized to delete this post')
    }

    await prisma.post.delete({
      where: { id },
    })

    // Invalidate cache
    await this.invalidatePostCache(existingPost.slug)
  }

  static async incrementViewCount(postId: string, ip?: string, userAgent?: string) {
    // Track view if IP is provided (to avoid counting same IP multiple times)
    if (ip) {
      const existingView = await prisma.view.findFirst({
        where: {
          postId,
          ip,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      })

      if (existingView) {
        return // Already counted this IP today
      }

      await prisma.view.create({
        data: {
          postId,
          ip,
          userAgent,
        },
      })
    }

    const post = await prisma.post.update({
      where: { id: postId },
      data: {
        viewCount: {
          increment: 1,
        },
      },
      select: {
        viewCount: true,
        slug: true,
      },
    })

    // Invalidate cache
    await this.invalidatePostCache(post.slug)

    return post
  }

  static async getPopularPosts(limit = 5) {
    const cache = await CacheService.getInstance()
    const cacheKey = 'posts:popular'
    const cachedPosts = await cache.get(cacheKey)

    if (cachedPosts) {
      return cachedPosts
    }

    const posts = await prisma.post.findMany({
      where: {
        published: true,
      },
      orderBy: [{ viewCount: 'desc' }, { likes: { _count: 'desc' } }],
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    })

    await cache.set(cacheKey, posts, 3600) // 1 hour

    return posts
  }

  static async getFeaturedPosts(limit = 5) {
    const cache = await CacheService.getInstance()
    const cacheKey = 'posts:featured'
    const cachedPosts = await cache.get(cacheKey)

    if (cachedPosts) {
      return cachedPosts
    }

    const posts = await prisma.post.findMany({
      where: {
        published: true,
        featured: true,
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    })

    await cache.set(cacheKey, posts, 3600) // 1 hour

    return posts
  }

  static async getRelatedPosts(postId: string, limit = 3) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { tags: true, categoryId: true },
    })

    if (!post) {
      return []
    }

    const cache = await CacheService.getInstance()
    const cacheKey = `posts:related:${postId}`
    const cachedPosts = await cache.get(cacheKey)

    if (cachedPosts) {
      return cachedPosts
    }

    const where: any = {
      published: true,
      id: { not: postId },
    }

    // Find posts with similar tags or categories
    if (post.tags && post.tags.length > 0) {
      where.OR = [{ tags: { hasSome: post.tags } }]
    }

    const posts = await prisma.post.findMany({
      where,
      orderBy: [{ publishedAt: 'desc' }, { viewCount: 'desc' }],
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    })

    await cache.set(cacheKey, posts, 1800) // 30 minutes

    return posts
  }

  static async getPostsByTag(tag: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit

    const cache = await CacheService.getInstance()
    const cacheKey = `posts:tag:${tag}:${page}:${limit}`
    const cachedResult = await cache.get(cacheKey)

    if (cachedResult) {
      return cachedResult
    }

    const where = {
      published: true,
      tags: {
        has: tag,
      },
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { publishedAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          },
          categories: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true,
            },
          },
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
      }),
      prisma.post.count({ where }),
    ])

    const result = {
      posts,
      tag,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }

    await cache.set(cacheKey, result, 1800) // 30 minutes

    return result
  }

  static async getAllTags() {
    const cache = await CacheService.getInstance()
    const cacheKey = 'tags:all'
    const cachedTags = await cache.get(cacheKey)

    if (cachedTags) {
      return cachedTags
    }

    const posts = await prisma.post.findMany({
      where: { published: true },
      select: { tags: true },
    })

    const tagCounts = new Map<string, number>()
    posts.forEach(post => {
      post.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      })
    })

    const tags = Array.from(tagCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    await cache.set(cacheKey, tags, 3600) // 1 hour

    return tags
  }

  private static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  private static async generateUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
    let slug = baseSlug
    let counter = 1

    while (true) {
      const existingPost = await prisma.post.findFirst({
        where: {
          slug,
          ...(excludeId && { id: { not: excludeId } }),
        },
      })

      if (!existingPost) {
        return slug
      }

      slug = `${baseSlug}-${counter}`
      counter++
    }
  }

  private static async invalidatePostCache(slug?: string) {
    const cache = await CacheService.getInstance()
    if (slug) {
      await cache.invalidatePostCache(slug)
    } else {
      await cache.invalidatePostCache()
    }
  }
}
