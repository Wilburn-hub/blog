import { prisma } from '../db/prisma'
import { CacheService } from '../cache/redis'

export class LikeService {
  static async likePost(postId: string, userId: string) {
    // Verify post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, published: true },
    })

    if (!post) {
      throw new Error('Post not found')
    }

    // Check if user already liked the post
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    })

    if (existingLike) {
      throw new Error('You have already liked this post')
    }

    // Create like
    const like = await prisma.like.create({
      data: {
        userId,
        postId,
      },
      include: {
        user: {
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
      },
    })

    // Get updated like count
    const likeCount = await prisma.like.count({
      where: { postId },
    })

    // Invalidate cache
    await this.invalidatePostCache(postId)

    return {
      like,
      likeCount,
      liked: true,
    }
  }

  static async unlikePost(postId: string, userId: string) {
    // Find existing like
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    })

    if (!existingLike) {
      throw new Error('You have not liked this post')
    }

    // Delete like
    await prisma.like.delete({
      where: { id: existingLike.id },
    })

    // Get updated like count
    const likeCount = await prisma.like.count({
      where: { postId },
    })

    // Invalidate cache
    await this.invalidatePostCache(postId)

    return {
      liked: false,
      likeCount,
    }
  }

  static async getPostLikes(postId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit

    const [likes, total] = await Promise.all([
      prisma.like.findMany({
        where: { postId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.like.count({ where: { postId } }),
    ])

    return {
      likes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }

  static async getUserLikedPosts(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit

    const [likes, total] = await Promise.all([
      prisma.like.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          post: {
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
          },
        },
      }),
      prisma.like.count({ where: { userId } }),
    ])

    const posts = likes.map(like => ({
      ...like.post,
      likedAt: like.createdAt,
    }))

    return {
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }

  static async hasUserLikedPost(postId: string, userId: string): Promise<boolean> {
    const like = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    })

    return !!like
  }

  static async getPostLikeStatus(postId: string, userId?: string) {
    const [likeCount, userLiked] = await Promise.all([
      prisma.like.count({ where: { postId } }),
      userId ? this.hasUserLikedPost(postId, userId) : false,
    ])

    return {
      likeCount,
      userLiked,
    }
  }

  static async getPopularLikedPosts(limit = 10) {
    const cache = await CacheService.getInstance()
    const cacheKey = 'posts:popular-liked'
    const cachedPosts = await cache.get(cacheKey)

    if (cachedPosts) {
      return cachedPosts
    }

    const posts = await prisma.post.findMany({
      where: {
        published: true,
      },
      orderBy: {
        likes: {
          _count: 'desc',
        },
      },
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

  static async getUserLikeStats(userId: string) {
    const [totalLikes, recentLikes, mostLikedPost] = await Promise.all([
      prisma.like.count({ where: { userId } }),
      prisma.like.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          post: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      }),
      prisma.like.groupBy({
        by: ['postId'],
        where: { userId },
        _count: {
          postId: true,
        },
        orderBy: {
          _count: {
            postId: 'desc',
          },
        },
        take: 1,
      }),
    ])

    // Get most liked post details
    let mostLikedPostDetails = null
    if (mostLikedPost.length > 0) {
      const post = await prisma.post.findUnique({
        where: { id: mostLikedPost[0].postId },
        select: {
          id: true,
          title: true,
          slug: true,
          _count: {
            select: {
              likes: true,
            },
          },
        },
      })
      mostLikedPostDetails = post
    }

    return {
      totalLikes,
      recentLikes: recentLikes.map(like => ({
        ...like.post,
        likedAt: like.createdAt,
      })),
      mostLikedPost: mostLikedPostDetails,
    }
  }

  static async togglePostLike(postId: string, userId: string) {
    try {
      return await this.likePost(postId, userId)
    } catch (error: any) {
      if (error.message === 'You have already liked this post') {
        return await this.unlikePost(postId, userId)
      }
      throw error
    }
  }

  private static async invalidatePostCache(postId: string) {
    const cache = await CacheService.getInstance()
    await cache.invalidatePostCache(postId)

    // Also invalidate popular posts cache
    await cache.client.del('posts:popular-liked')
  }
}
