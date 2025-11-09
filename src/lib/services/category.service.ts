import { prisma } from '../db/prisma'
import { Category, Post } from '@prisma/client'

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

export interface CreateCategoryData {
  name: string
  slug?: string
  description?: string
  color?: string
  icon?: string
}

export interface UpdateCategoryData extends Partial<CreateCategoryData> {}

export interface CategoryQueryOptions {
  page?: number
  limit?: number
  search?: string
  sort?: 'name' | 'createdAt' | 'postCount'
  sortOrder?: 'asc' | 'desc'
  includeEmpty?: boolean
}

export interface CategoryWithPostCount extends Category {
  _count: {
    posts: number
  }
}

/**
 * 分类服务类 - 处理分类相关的业务逻辑
 */
export class CategoryService {
  /**
   * 创建新分类
   */
  static async createCategory(categoryData: CreateCategoryData) {
    const { name, slug, ...otherData } = categoryData

    // 生成唯一的slug
    const categorySlug = slug || this.generateSlug(name)
    const uniqueSlug = await this.generateUniqueSlug(categorySlug)

    const category = await prisma.category.create({
      data: {
        name,
        slug: uniqueSlug,
        ...otherData,
      },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    })

    // 清除缓存
    await this.invalidateCategoryCache()

    return category
  }

  /**
   * 根据slug获取分类
   */
  static async getCategoryBySlug(slug: string) {
    // 先尝试从缓存获取
    const cacheKey = `category:${slug}`
    const cachedCategory = cache.get(cacheKey)

    if (cachedCategory) {
      return cachedCategory
    }

    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            posts: {
              where: {
                published: true,
              },
            },
          },
        },
      },
    })

    if (category) {
      // 缓存分类信息
      cache.set(cacheKey, category, 3600) // 1小时
    }

    return category
  }

  /**
   * 根据ID获取分类
   */
  static async getCategoryById(id: string) {
    return prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            posts: {
              where: {
                published: true,
              },
            },
          },
        },
      },
    })
  }

  /**
   * 获取所有分类
   */
  static async getCategories(options: CategoryQueryOptions = {}) {
    const {
      page = 1,
      limit = 50,
      search,
      sort = 'name',
      sortOrder = 'asc',
      includeEmpty = false,
    } = options

    const skip = (page - 1) * limit

    // 构建where条件
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // 如果不包含空分类，只添加有发布文章的分类
    if (!includeEmpty) {
      where.posts = {
        some: {
          published: true,
        },
      }
    }

    // 构建排序条件
    let orderBy: any = {}
    switch (sort) {
      case 'createdAt':
        orderBy = { createdAt: sortOrder }
        break
      case 'postCount':
        orderBy = { posts: { _count: sortOrder } }
        break
      case 'name':
      default:
        orderBy = { name: sortOrder }
        break
    }

    // 先尝试从缓存获取
    const cacheKey = `categories:${JSON.stringify(options)}`
    const cachedResult = cache.get(cacheKey)

    if (cachedResult) {
      return cachedResult
    }

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          _count: {
            select: {
              posts: {
                where: {
                  published: true,
                },
              },
            },
          },
        },
      }),
      prisma.category.count({ where }),
    ])

    const result = {
      categories,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }

    // 缓存结果
    cache.set(cacheKey, result, 1800) // 30分钟

    return result
  }

  /**
   * 获取分类下的文章
   */
  static async getCategoryPosts(
    slug: string,
    options: {
      page?: number
      limit?: number
      sort?: 'latest' | 'oldest' | 'popular' | 'views'
    } = {}
  ) {
    const { page = 1, limit = 10, sort = 'latest' } = options
    const skip = (page - 1) * limit

    // 验证分类是否存在
    const category = await this.getCategoryBySlug(slug)
    if (!category) {
      throw new Error('Category not found')
    }

    // 先尝试从缓存获取
    const cache = await CacheService.getInstance()
    const cacheKey = `category:${slug}:posts:${JSON.stringify(options)}`
    const cachedResult = await cache.get(cacheKey)

    if (cachedResult) {
      return cachedResult
    }

    // 构建排序条件
    let orderBy: any = {}
    switch (sort) {
      case 'oldest':
        orderBy = { publishedAt: 'asc' }
        break
      case 'popular':
        orderBy = [{ likes: { _count: 'desc' } }, { viewCount: 'desc' }, { publishedAt: 'desc' }]
        break
      case 'views':
        orderBy = { viewCount: 'desc' }
        break
      case 'latest':
      default:
        orderBy = { publishedAt: 'desc' }
        break
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: {
          published: true,
          categories: {
            some: {
              slug,
            },
          },
        },
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
      prisma.post.count({
        where: {
          published: true,
          categories: {
            some: {
              slug,
            },
          },
        },
      }),
    ])

    const result = {
      posts,
      category,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }

    // 缓存结果
    cache.set(cacheKey, result, 1800) // 30分钟

    return result
  }

  /**
   * 获取热门分类
   */
  static async getPopularCategories(limit = 10) {
    const cacheKey = 'categories:popular'
    const cachedCategories = cache.get(cacheKey)

    if (cachedCategories) {
      return cachedCategories
    }

    const categories = await prisma.category.findMany({
      where: {
        posts: {
          some: {
            published: true,
          },
        },
      },
      orderBy: {
        posts: {
          _count: 'desc',
        },
      },
      take: limit,
      include: {
        _count: {
          select: {
            posts: {
              where: {
                published: true,
              },
            },
          },
        },
      },
    })

    cache.set(cacheKey, categories, 3600) // 1小时

    return categories
  }

  /**
   * 更新分类
   */
  static async updateCategory(id: string, categoryData: UpdateCategoryData) {
    const { name, slug, ...otherData } = categoryData

    // 如果更新名称，生成新的slug
    let categorySlug = slug
    if (name && !slug) {
      categorySlug = this.generateSlug(name)
      categorySlug = await this.generateUniqueSlug(categorySlug, id)
    } else if (slug) {
      categorySlug = await this.generateUniqueSlug(slug, id)
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(categorySlug && { slug: categorySlug }),
        ...otherData,
      },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    })

    // 清除缓存
    await this.invalidateCategoryCache(category.slug)

    return category
  }

  /**
   * 删除分类
   */
  static async deleteCategory(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      select: { slug: true },
    })

    if (!category) {
      throw new Error('Category not found')
    }

    await prisma.category.delete({
      where: { id },
    })

    // 清除缓存
    await this.invalidateCategoryCache(category.slug)

    return category
  }

  /**
   * 搜索分类
   */
  static async searchCategories(query: string, limit = 10) {
    const cacheKey = `categories:search:${query}:${limit}`
    const cachedResult = cache.get(cacheKey)

    if (cachedResult) {
      return cachedResult
    }

    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
        posts: {
          some: {
            published: true,
          },
        },
      },
      take: limit,
      include: {
        _count: {
          select: {
            posts: {
              where: {
                published: true,
              },
            },
          },
        },
      },
    })

    cache.set(cacheKey, categories, 1800) // 30分钟

    return categories
  }

  /**
   * 获取分类统计信息
   */
  static async getCategoryStats() {
    const cacheKey = 'categories:stats'
    const cachedStats = cache.get(cacheKey)

    if (cachedStats) {
      return cachedStats
    }

    const [
      totalCategories,
      categoriesWithPosts,
      totalPostsInCategories,
      avgPostsPerCategory,
    ] = await Promise.all([
      // 总分类数
      prisma.category.count(),

      // 有文章的分类数
      prisma.category.count({
        where: {
          posts: {
            some: {
              published: true,
            },
          },
        },
      }),

      // 分类下的文章总数
      prisma.post.count({
        where: {
          published: true,
          categories: {
            some: {},
          },
        },
      }),

      // 每个分类的平均文章数
      prisma.category.aggregate({
        where: {
          posts: {
            some: {
              published: true,
            },
          },
        },
        _count: {
          posts: true,
        },
      }),
    ])

    const stats = {
      totalCategories,
      categoriesWithPosts,
      totalPostsInCategories,
      avgPostsPerCategory: categoriesWithPosts > 0 ? Math.round(avgPostsPerCategory._count.posts / categoriesWithPosts * 100) / 100 : 0,
    }

    cache.set(cacheKey, stats, 3600) // 1小时

    return stats
  }

  /**
   * 生成slug
   */
  private static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  /**
   * 生成唯一的slug
   */
  private static async generateUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
    let slug = baseSlug
    let counter = 1

    while (true) {
      const existingCategory = await prisma.category.findFirst({
        where: {
          slug,
          ...(excludeId && { id: { not: excludeId } }),
        },
      })

      if (!existingCategory) {
        return slug
      }

      slug = `${baseSlug}-${counter}`
      counter++
    }
  }

  /**
   * 清除分类相关的缓存
   */
  private static invalidateCategoryCache(slug?: string) {
    if (slug) {
      cache.delete(`category:${slug}`)
      cache.delete(`category:${slug}:posts`)
    } else {
      // 清除所有分类相关缓存（简单实现：清空所有缓存）
      cache.clear()
    }
  }
}