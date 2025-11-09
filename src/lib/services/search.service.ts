import { prisma } from '../db/prisma'
import { CacheService } from '../cache/redis'

export interface SearchOptions {
  query: string
  type?: 'all' | 'posts' | 'users' | 'comments'
  page?: number
  limit?: number
  tags?: string[]
  category?: string
  author?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: 'relevance' | 'latest' | 'oldest' | 'popular'
}

export interface SearchResult {
  posts?: any[]
  users?: any[]
  comments?: any[]
  total: {
    posts: number
    users: number
    comments: number
    all: number
  }
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  query: string
  type: string
}

export class SearchService {
  static async search(options: SearchOptions): Promise<SearchResult> {
    const {
      query,
      type = 'all',
      page = 1,
      limit = 10,
      tags,
      category,
      author,
      dateFrom,
      dateTo,
      sortBy = 'relevance',
    } = options

    // Validate pagination
    if (page < 1) {
      throw new Error('Page must be a positive integer')
    }

    if (limit < 1 || limit > 50) {
      throw new Error('Limit must be between 1 and 50')
    }

    const skip = (page - 1) * limit

    // Try to get from cache first
    const cache = await CacheService.getInstance()
    const cacheKey = `search:${JSON.stringify(options)}`
    const cachedResult = await cache.get(cacheKey)

    if (cachedResult) {
      return cachedResult
    }

    const results: SearchResult = {
      total: {
        posts: 0,
        users: 0,
        comments: 0,
        all: 0,
      },
      pagination: {
        page,
        limit,
        total: 0,
        pages: 0,
      },
      query,
      type,
    }

    // Search posts
    if (type === 'all' || type === 'posts') {
      const postsResult = await this.searchPosts(query, {
        skip,
        take: limit,
        tags,
        category,
        author,
        dateFrom,
        dateTo,
        sortBy,
      })

      results.posts = postsResult.posts
      results.total.posts = postsResult.total
    }

    // Search users
    if (type === 'all' || type === 'users') {
      const usersResult = await this.searchUsers(query, {
        skip,
        take: limit,
      })

      results.users = usersResult.users
      results.total.users = usersResult.total
    }

    // Search comments
    if (type === 'all' || type === 'comments') {
      const commentsResult = await this.searchComments(query, {
        skip,
        take: limit,
      })

      results.comments = commentsResult.comments
      results.total.comments = commentsResult.total
    }

    // Calculate totals
    results.total.all = results.total.posts + results.total.users + results.total.comments
    results.pagination.total = results.total[type] || results.total.all
    results.pagination.pages = Math.ceil(results.pagination.total / limit)

    // Cache the result
    await cache.set(cacheKey, results, 1800) // 30 minutes

    return results
  }

  private static async searchPosts(
    query: string,
    options: {
      skip: number
      take: number
      tags?: string[]
      category?: string
      author?: string
      dateFrom?: string
      dateTo?: string
      sortBy?: string
    }
  ) {
    const { skip, take, tags, category, author, dateFrom, dateTo, sortBy } = options

    // Build where clause
    const where: any = {
      published: true,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
        { excerpt: { contains: query, mode: 'insensitive' } },
      ],
    }

    // Add filters
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

    if (author) {
      where.author = {
        OR: [
          { username: { contains: author, mode: 'insensitive' } },
          { name: { contains: author, mode: 'insensitive' } },
        ],
      }
    }

    if (dateFrom || dateTo) {
      where.publishedAt = {}
      if (dateFrom) {
        where.publishedAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.publishedAt.lte = new Date(dateTo)
      }
    }

    // Build order clause
    let orderBy: any = {}
    switch (sortBy) {
      case 'oldest':
        orderBy = { publishedAt: 'asc' }
        break
      case 'popular':
        orderBy = [{ likes: { _count: 'desc' } }, { viewCount: 'desc' }, { publishedAt: 'desc' }]
        break
      case 'latest':
        orderBy = { publishedAt: 'desc' }
        break
      case 'relevance':
      default:
        // For relevance, we could use PostgreSQL full-text search
        // For now, we'll use a combination of factors
        orderBy = [{ publishedAt: 'desc' }, { viewCount: 'desc' }]
        break
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take,
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

    return { posts, total }
  }

  private static async searchUsers(
    query: string,
    options: {
      skip: number
      take: number
    }
  ) {
    const { skip, take } = options

    const where = {
      isActive: true,
      OR: [
        { username: { contains: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } },
        { bio: { contains: query, mode: 'insensitive' } },
      ],
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
          bio: true,
          location: true,
          website: true,
          createdAt: true,
          _count: {
            select: {
              posts: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ])

    return { users, total }
  }

  private static async searchComments(
    query: string,
    options: {
      skip: number
      take: number
    }
  ) {
    const { skip, take } = options

    const where = {
      content: {
        contains: query,
        mode: 'insensitive' as const,
      },
      post: {
        published: true, // Only search comments on published posts
      },
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          },
          post: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
      }),
      prisma.comment.count({ where }),
    ])

    return { comments, total }
  }

  static async getSearchSuggestions(query: string, limit = 10) {
    if (!query || query.length < 2) {
      return {
        suggestions: [],
        tags: [],
      }
    }

    const cache = await CacheService.getInstance()
    const cacheKey = `suggestions:${query}:${limit}`
    const cachedResult = await cache.get(cacheKey)

    if (cachedResult) {
      return cachedResult
    }

    // Get title suggestions from posts
    const postSuggestions = await prisma.post.findMany({
      where: {
        published: true,
        title: {
          contains: query,
          mode: 'insensitive',
        },
      },
      select: {
        title: true,
        slug: true,
      },
      take: Math.ceil(limit / 2),
      orderBy: { viewCount: 'desc' },
    })

    // Get user suggestions
    const userSuggestions = await prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        username: true,
        name: true,
        avatar: true,
      },
      take: Math.ceil(limit / 2),
      orderBy: { createdAt: 'desc' },
    })

    // Get tag suggestions
    const allTags = await prisma.post.findMany({
      where: { published: true },
      select: { tags: true },
    })

    const tagCounts = new Map<string, number>()
    allTags.forEach(post => {
      post.tags.forEach(tag => {
        if (tag.toLowerCase().includes(query.toLowerCase())) {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
        }
      })
    })

    const tagSuggestions = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, count]) => ({ name, count }))

    const suggestions = [
      ...postSuggestions.map(post => ({
        type: 'post',
        title: post.title,
        slug: post.slug,
      })),
      ...userSuggestions.map(user => ({
        type: 'user',
        username: user.username,
        name: user.name,
        avatar: user.avatar,
      })),
    ].slice(0, limit)

    const result = {
      suggestions,
      tags: tagSuggestions,
    }

    await cache.set(cacheKey, result, 1800) // 30 minutes

    return result
  }

  static async getPopularSearches(limit = 10) {
    const cache = await CacheService.getInstance()
    const cacheKey = 'popular-searches'
    const cachedResult = await cache.get(cacheKey)

    if (cachedResult) {
      return cachedResult
    }

    // This is a simplified approach
    // In a real application, you might track search queries and their frequency
    const popularTags = await prisma.post.findMany({
      where: { published: true },
      select: { tags: true },
    })

    const tagCounts = new Map<string, number>()
    popularTags.forEach(post => {
      post.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      })
    })

    const popularSearches = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, count]) => ({ name, count }))

    await cache.set(cacheKey, popularSearches, 3600) // 1 hour

    return popularSearches
  }

  static async getRelatedSearches(query: string, limit = 5) {
    // Get posts that match the query and extract their tags
    const posts = await prisma.post.findMany({
      where: {
        published: true,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: { tags: true },
      take: 20,
    })

    const tagCounts = new Map<string, number>()
    posts.forEach(post => {
      post.tags.forEach(tag => {
        if (!tag.toLowerCase().includes(query.toLowerCase())) {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
        }
      })
    })

    const relatedTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, count]) => ({ name, count }))

    return relatedTags
  }
}
