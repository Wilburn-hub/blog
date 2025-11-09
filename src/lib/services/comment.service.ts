import { prisma } from '../db/prisma'
import { CacheService } from '../cache/redis'

export interface CreateCommentData {
  content: string
  postId: string
  authorId: string
  parentId?: string
}

export interface UpdateCommentData {
  content: string
}

export interface CommentQueryOptions {
  page?: number
  limit?: number
  postId?: string
  authorId?: string
  parentId?: string
  sortBy?: 'latest' | 'oldest' | 'popular'
}

export class CommentService {
  static async createComment(commentData: CreateCommentData) {
    const { content, postId, authorId, parentId } = commentData

    // Verify post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, published: true },
    })

    if (!post) {
      throw new Error('Post not found')
    }

    if (!post.published) {
      throw new Error('Cannot comment on unpublished post')
    }

    // If parentId is provided, verify parent comment exists and belongs to same post
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { id: true, postId: true },
      })

      if (!parentComment || parentComment.postId !== postId) {
        throw new Error('Parent comment not found or invalid')
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        authorId,
        parentId,
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
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
            authorId: true,
          },
        },
        parent: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
    })

    // Invalidate cache
    await this.invalidateCommentsCache(postId)

    return comment
  }

  static async getComments(options: CommentQueryOptions = {}) {
    const { page = 1, limit = 10, postId, authorId, parentId, sortBy = 'latest' } = options

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (postId) {
      where.postId = postId
    }

    if (authorId) {
      where.authorId = authorId
    }

    if (parentId !== undefined) {
      where.parentId = parentId
    } else {
      where.parentId = null // Only get top-level comments by default
    }

    // Build order clause
    let orderBy: any = {}
    switch (sortBy) {
      case 'oldest':
        orderBy = { createdAt: 'asc' }
        break
      case 'popular':
        orderBy = [{ replies: { _count: 'desc' } }, { createdAt: 'desc' }]
        break
      case 'latest':
      default:
        orderBy = { createdAt: 'desc' }
        break
    }

    // Try to get from cache first
    const cache = await CacheService.getInstance()
    const cacheKey = `comments:${JSON.stringify(options)}`
    const cachedResult = await cache.get(cacheKey)

    if (cachedResult) {
      return cachedResult
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
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
          post: postId
            ? undefined
            : {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                },
              },
          parent: parentId
            ? {
                include: {
                  author: {
                    select: {
                      id: true,
                      username: true,
                      name: true,
                    },
                  },
                },
              }
            : undefined,
          _count: {
            select: {
              replies: true,
            },
          },
        },
      }),
      prisma.comment.count({ where }),
    ])

    const result = {
      comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }

    // Cache the result
    await cache.set(cacheKey, result, 1800) // 30 minutes

    return result
  }

  static async getCommentById(id: string) {
    return prisma.comment.findUnique({
      where: { id },
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
            authorId: true,
          },
        },
        parent: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                name: true,
              },
            },
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar: true,
              },
            },
            _count: {
              select: {
                replies: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
    })
  }

  static async updateComment(id: string, updateData: UpdateCommentData, authorId: string) {
    const existingComment = await prisma.comment.findUnique({
      where: { id },
      select: { authorId: true, postId: true },
    })

    if (!existingComment) {
      throw new Error('Comment not found')
    }

    if (existingComment.authorId !== authorId) {
      throw new Error('Not authorized to update this comment')
    }

    const comment = await prisma.comment.update({
      where: { id },
      data: updateData,
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
        parent: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
    })

    // Invalidate cache
    await this.invalidateCommentsCache(existingComment.postId)

    return comment
  }

  static async deleteComment(id: string, authorId: string) {
    const existingComment = await prisma.comment.findUnique({
      where: { id },
      select: { authorId: true, postId: true },
    })

    if (!existingComment) {
      throw new Error('Comment not found')
    }

    if (existingComment.authorId !== authorId) {
      throw new Error('Not authorized to delete this comment')
    }

    await prisma.comment.delete({
      where: { id },
    })

    // Invalidate cache
    await this.invalidateCommentsCache(existingComment.postId)
  }

  static async getCommentsByPostId(postId: string, page = 1, limit = 10) {
    return this.getComments({
      postId,
      page,
      limit,
      sortBy: 'latest',
    })
  }

  static async getRepliesByCommentId(commentId: string, page = 1, limit = 10) {
    return this.getComments({
      parentId: commentId,
      page,
      limit,
      sortBy: 'oldest', // Show replies in chronological order
    })
  }

  static async getCommentsByAuthorId(authorId: string, page = 1, limit = 10) {
    return this.getComments({
      authorId,
      page,
      limit,
      sortBy: 'latest',
    })
  }

  static async getCommentStats(postId: string) {
    const [totalComments, topLevelComments, replies] = await Promise.all([
      prisma.comment.count({
        where: { postId },
      }),
      prisma.comment.count({
        where: { postId, parentId: null },
      }),
      prisma.comment.count({
        where: { postId, parentId: { not: null } },
      }),
    ])

    return {
      totalComments,
      topLevelComments,
      replies,
    }
  }

  static async searchComments(query: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit

    const where = {
      content: {
        contains: query,
        mode: 'insensitive' as const,
      },
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        skip,
        take: limit,
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
          parent: {
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                },
              },
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

    return {
      comments,
      query,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }

  static async canUserEditComment(
    commentId: string,
    userId: string,
    userRole: string
  ): Promise<boolean> {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true },
    })

    if (!comment) {
      return false
    }

    return comment.authorId === userId || userRole === 'ADMIN'
  }

  static async canUserDeleteComment(
    commentId: string,
    userId: string,
    userRole: string
  ): Promise<boolean> {
    // For now, same permissions as editing
    return this.canUserEditComment(commentId, userId, userRole)
  }

  private static async invalidateCommentsCache(postId?: string) {
    const cache = await CacheService.getInstance()

    if (postId) {
      // Invalidate specific post comments
      const patterns = [
        `comments:{"postId":"${postId}"`,
        `comments:{"postId":"${postId}","parentId":null`,
        `comments:{"postId":"${postId}","parentId":`,
      ]

      for (const pattern of patterns) {
        const keys = await cache.client.keys(`*${pattern}*`)
        if (keys.length > 0) {
          await cache.client.del(keys)
        }
      }
    } else {
      // Invalidate all comments cache
      const keys = await cache.client.keys('comments:*')
      if (keys.length > 0) {
        await cache.client.del(keys)
      }
    }
  }
}
