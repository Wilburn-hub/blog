import { prisma } from '../db/prisma'
import { nanoid } from 'nanoid'

// 简单内存缓存实现
class SimpleCache {
  private cache = new Map<string, { data: any; expires: number }>()

  set(key: string, value: any, ttlSeconds = 3600) {
    this.cache.set(key, {
      data: value,
      expires: Date.now() + ttlSeconds * 1000
    })
  }

  get(key: string) {
    const item = this.cache.get(key)
    if (!item || Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }
    return item.data
  }

  delete(key: string) {
    this.cache.delete(key)
  }

  clear() {
    this.cache.clear()
  }
}

const cache = new SimpleCache()

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
    const cacheInstance = cache
    const cacheKey = includeUnpublished ? `post:${slug}:all` : `post:${slug}:published`
    const cachedPost = cacheInstance.get(cacheKey)

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
      cacheInstance.set(cacheKey, post, 3600) // 1 hour
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
    const cacheInstance = cache
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
    const cacheInstance = cache
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

    const cacheInstance = cache
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

    const cacheInstance = cache
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
    const cacheInstance = cache
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

  // 新增：获取标签详细信息
  static async getTagDetails(tag: string, page = 1, limit = 12) {
    const skip = (page - 1) * limit

    const cacheInstance = cache
    const cacheKey = `tag:details:${tag}:${page}:${limit}`
    const cachedResult = await cache.get(cacheKey)

    if (cachedResult) {
      return cachedResult
    }

    // 获取标签的文章
    const postsResult = await this.getPostsByTag(tag, page, limit)

    // 获取标签统计信息
    const allTags = await this.getAllTags()
    const tagInfo = allTags.find(t => t.name.toLowerCase() === tag.toLowerCase())

    // 获取相关标签（与当前标签共同出现频率最高的标签）
    const relatedTags = await this.getRelatedTags(tag)

    const result = {
      ...postsResult,
      tag: {
        name: tag,
        count: tagInfo?.count || postsResult.pagination.total,
        slug: encodeURIComponent(tag.toLowerCase().replace(/\s+/g, '-')),
      },
      relatedTags,
      stats: {
        totalPosts: postsResult.pagination.total,
        totalPages: postsResult.pagination.pages,
        currentPage: page,
      }
    }

    await cache.set(cacheKey, result, 1800) // 30 minutes
    return result
  }

  // 新增：获取相关标签
  static async getRelatedTags(tag: string, limit = 10) {
    const cacheInstance = cache
    const cacheKey = `tags:related:${tag}`
    const cachedTags = await cache.get(cacheKey)

    if (cachedTags) {
      return cachedTags
    }

    // 获取包含当前标签的所有文章
    const postsWithTag = await prisma.post.findMany({
      where: {
        published: true,
        tags: {
          has: tag,
        },
      },
      select: { tags: true },
      take: 100, // 限制查询数量以提高性能
    })

    // 统计共同出现的标签
    const tagCounts = new Map<string, number>()

    postsWithTag.forEach(post => {
      post.tags.forEach(postTag => {
        if (postTag !== tag) {
          tagCounts.set(postTag, (tagCounts.get(postTag) || 0) + 1)
        }
      })
    })

    // 按出现频率排序并返回前N个
    const relatedTags = Array.from(tagCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)

    await cache.set(cacheKey, relatedTags, 3600) // 1 hour
    return relatedTags
  }

  // 新增：搜索标签
  static async searchTags(query: string, limit = 20) {
    if (!query || query.trim().length < 2) {
      return []
    }

    const cacheInstance = cache
    const cacheKey = `tags:search:${encodeURIComponent(query.trim())}:${limit}`
    const cachedTags = await cache.get(cacheKey)

    if (cachedTags) {
      return cachedTags
    }

    const allTags = await this.getAllTags()

    const searchResults = allTags
      .filter(tag =>
        tag.name.toLowerCase().includes(query.toLowerCase().trim())
      )
      .slice(0, limit)

    await cache.set(cacheKey, searchResults, 1800) // 30 minutes
    return searchResults
  }

  // 新增：获取热门标签（按时间范围）
  static async getPopularTags(days = 30, limit = 15) {
    const cacheInstance = cache
    const cacheKey = `tags:popular:${days}:${limit}`
    const cachedTags = await cache.get(cacheKey)

    if (cachedTags) {
      return cachedTags
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // 获取指定时间范围内的文章标签
    const recentPosts = await prisma.post.findMany({
      where: {
        published: true,
        publishedAt: {
          gte: startDate,
        },
      },
      select: { tags: true },
    })

    // 统计标签出现频率
    const tagCounts = new Map<string, number>()
    recentPosts.forEach(post => {
      post.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      })
    })

    const popularTags = Array.from(tagCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)

    await cache.set(cacheKey, popularTags, 1800) // 30 minutes
    return popularTags
  }

  // 新增：获取标签统计信息
  static async getTagStatistics() {
    const cacheInstance = cache
    const cacheKey = 'tags:statistics'
    const cachedStats = await cache.get(cacheKey)

    if (cachedStats) {
      return cachedStats
    }

    const allTags = await this.getAllTags()
    const totalPosts = await prisma.post.count({
      where: { published: true }
    })

    const stats = {
      totalTags: allTags.length,
      totalPosts,
      averagePostsPerTag: totalPosts > 0 ? Math.round((totalPosts / allTags.length) * 100) / 100 : 0,
      mostPopularTag: allTags[0] || { name: '', count: 0 },
      leastPopularTag: allTags[allTags.length - 1] || { name: '', count: 0 },
      tagsWithSinglePost: allTags.filter(tag => tag.count === 1).length,
      tagsWithMultiplePosts: allTags.filter(tag => tag.count > 1).length,
    }

    await cache.set(cacheKey, stats, 3600) // 1 hour
    return stats
  }

  // 新增：清理标签（删除没有关联文章的标签）
  static async cleanupUnusedTags() {
    const allTags = await this.getAllTags()

    // 找出所有实际使用的标签
    const posts = await prisma.post.findMany({
      where: { published: true },
      select: { tags: true },
    })

    const usedTags = new Set<string>()
    posts.forEach(post => {
      post.tags.forEach(tag => usedTags.add(tag))
    })

    // 找出未使用的标签
    const unusedTags = allTags.filter(tag => !usedTags.has(tag.name))

    return {
      totalTags: allTags.length,
      usedTags: usedTags.size,
      unusedTags: unusedTags.length,
      unusedTagList: unusedTags,
    }
  }

  private static async invalidatePostCache(slug?: string) {
    const cacheInstance = cache
    if (slug) {
      await cache.invalidatePostCache(slug)
    } else {
      await cache.invalidatePostCache()
    }
  }
}
