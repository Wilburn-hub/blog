import { prisma } from '../db/prisma'
import { PostService } from './post.service'
import { CategoryService } from './category.service'
import { UserService } from './user.service'

export interface SitemapUrl {
  url: string
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

export interface SitemapOptions {
  baseUrl: string
  includePagination?: boolean
  maxPaginationPages?: number
  alternateLanguages?: Array<{
    lang: string
    baseUrl: string
  }>
}

/**
 * Sitemap服务类 - 生成符合标准的XML sitemap
 */
export class SitemapService {
  private static readonly DEFAULT_CHANGEFREQ = 'weekly'
  private static readonly DEFAULT_PRIORITY = 0.7
  private static readonly MAX_URLS_PER_SITEMAP = 50000
  private static readonly CACHE_TTL = 3600 // 1 hour

  // 简单内存缓存（仅在服务器端运行时有效）
  private static memoryCache = new Map<string, string>()

  /**
   * 生成完整的sitemap
   */
  static async generateSitemap(options: SitemapOptions): Promise<string> {
    const { baseUrl, includePagination = true, maxPaginationPages = 10, alternateLanguages = [] } = options

    // 简单内存缓存（仅在单个请求生命周期内有效）
    const cacheKey = `sitemap:full:${JSON.stringify(options)}`
    if (this.memoryCache.has(cacheKey)) {
      return this.memoryCache.get(cacheKey)!
    }

    const urls: SitemapUrl[] = []

    // 1. 静态页面
    urls.push(...await this.getStaticPages(baseUrl))

    // 2. 文章页面
    urls.push(...await this.getPostPages(baseUrl))

    // 3. 分类页面
    urls.push(...await this.getCategoryPages(baseUrl))

    // 4. 标签页面
    urls.push(...await this.getTagPages(baseUrl))

    // 5. 用户资料页面
    urls.push(...await this.getUserProfilePages(baseUrl))

    // 6. 分页页面（可选）
    if (includePagination) {
      urls.push(...await this.getPaginationPages(baseUrl, maxPaginationPages))
    }

    // 生成XML
    const xml = this.generateSitemapXML(urls, alternateLanguages)

    // 缓存到内存
    this.memoryCache.set(cacheKey, xml)

    return xml
  }

  /**
   * 生成静态页面的sitemap URL
   */
  private static async getStaticPages(baseUrl: string): Promise<SitemapUrl[]> {
    const now = new Date().toISOString()

    return [
      {
        url: baseUrl,
        lastmod: now,
        changefreq: 'daily',
        priority: 1.0
      },
      {
        url: `${baseUrl}/posts`,
        lastmod: now,
        changefreq: 'daily',
        priority: 0.9
      },
      {
        url: `${baseUrl}/categories`,
        lastmod: now,
        changefreq: 'weekly',
        priority: 0.8
      },
      {
        url: `${baseUrl}/tags`,
        lastmod: now,
        changefreq: 'weekly',
        priority: 0.8
      },
      {
        url: `${baseUrl}/search`,
        lastmod: now,
        changefreq: 'monthly',
        priority: 0.6
      },
      {
        url: `${baseUrl}/about`,
        lastmod: now,
        changefreq: 'monthly',
        priority: 0.7
      },
      {
        url: `${baseUrl}/subscribe`,
        lastmod: now,
        changefreq: 'monthly',
        priority: 0.6
      }
    ]
  }

  /**
   * 获取所有文章页面的sitemap URL
   */
  private static async getPostPages(baseUrl: string): Promise<SitemapUrl[]> {
    const posts = await prisma.post.findMany({
      where: {
        published: true
      },
      select: {
        slug: true,
        updatedAt: true,
        publishedAt: true
      }
    })

    return posts.map(post => ({
      url: `${baseUrl}/posts/${post.slug}`,
      lastmod: post.updatedAt?.toISOString() || post.publishedAt?.toISOString(),
      changefreq: 'monthly' as const,
      priority: 0.8
    }))
  }

  /**
   * 获取所有分类页面的sitemap URL
   */
  private static async getCategoryPages(baseUrl: string): Promise<SitemapUrl[]> {
    const categories = await CategoryService.getCategories({ limit: 1000, includeEmpty: false })

    return categories.categories.map(category => ({
      url: `${baseUrl}/categories/${category.slug}`,
      lastmod: new Date().toISOString(), // 分类页面通常显示最新的内容
      changefreq: 'weekly' as const,
      priority: 0.7
    }))
  }

  /**
   * 获取所有标签页面的sitemap URL
   */
  private static async getTagPages(baseUrl: string): Promise<SitemapUrl[]> {
    const tags = await PostService.getAllTags()

    return tags.map(tag => ({
      url: `${baseUrl}/tags/${encodeURIComponent(tag.name.toLowerCase().replace(/\s+/g, '-'))}`,
      lastmod: new Date().toISOString(), // 标签页面通常显示最新的内容
      changefreq: 'weekly' as const,
      priority: 0.6
    }))
  }

  /**
   * 获取用户资料页面的sitemap URL
   */
  private static async getUserProfilePages(baseUrl: string): Promise<SitemapUrl[]> {
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        posts: {
          some: {
            published: true
          }
        }
      },
      select: {
        username: true,
        updatedAt: true,
        createdAt: true
      }
    })

    return users.map(user => ({
      url: `${baseUrl}/profile/${user.username}`,
      lastmod: user.updatedAt?.toISOString() || user.createdAt.toISOString(),
      changefreq: 'monthly' as const,
      priority: 0.5
    }))
  }

  /**
   * 获取分页页面的sitemap URL
   */
  private static async getPaginationPages(baseUrl: string, maxPages: number): Promise<SitemapUrl[]> {
    const urls: SitemapUrl[] = []

    // 1. 文章列表分页
    const totalPosts = await prisma.post.count({
      where: { published: true }
    })
    const postsPages = Math.ceil(totalPosts / 12) // 假设每页12篇文章
    const limitedPostsPages = Math.min(postsPages, maxPages)

    for (let page = 2; page <= limitedPostsPages; page++) {
      urls.push({
        url: `${baseUrl}/posts?page=${page}`,
        lastmod: new Date().toISOString(),
        changefreq: 'daily' as const,
        priority: 0.6
      })
    }

    // 2. 分类页面分页
    const categories = await CategoryService.getCategories({ limit: 100, includeEmpty: false })
    for (const category of categories.categories.slice(0, 20)) { // 限制前20个分类
      const categoryPosts = await prisma.post.count({
        where: {
          published: true,
          categories: {
            some: {
              id: category.id
            }
          }
        }
      })

      const categoryPages = Math.ceil(categoryPosts / 12)
      const limitedCategoryPages = Math.min(categoryPages, Math.floor(maxPages / 2))

      for (let page = 2; page <= limitedCategoryPages; page++) {
        urls.push({
          url: `${baseUrl}/categories/${category.slug}?page=${page}`,
          lastmod: new Date().toISOString(),
          changefreq: 'weekly' as const,
          priority: 0.5
        })
      }
    }

    // 3. 热门标签分页（限制前10个热门标签）
    const popularTags = await PostService.getPopularTags(10)
    for (const tag of popularTags) {
      const tagPosts = await prisma.post.count({
        where: {
          published: true,
          tags: {
            has: tag.name
          }
        }
      })

      const tagPages = Math.ceil(tagPosts / 12)
      const limitedTagPages = Math.min(tagPages, Math.floor(maxPages / 4))

      for (let page = 2; page <= limitedTagPages; page++) {
        urls.push({
          url: `${baseUrl}/tags/${encodeURIComponent(tag.name.toLowerCase().replace(/\s+/g, '-'))}?page=${page}`,
          lastmod: new Date().toISOString(),
          changefreq: 'weekly' as const,
          priority: 0.4
        })
      }
    }

    return urls
  }

  /**
   * 生成sitemap XML
   */
  private static generateSitemapXML(urls: SitemapUrl[], alternateLanguages: Array<{ lang: string, baseUrl: string }> = []): string {
    const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">`

    const xmlFooter = '</urlset>'

    const urlEntries = urls.map(url => {
      let urlXML = `  <url>
    <loc>${this.escapeXml(url.url)}</loc>`

      if (url.lastmod) {
        urlXML += `
    <lastmod>${url.lastmod}</lastmod>`
      }

      if (url.changefreq) {
        urlXML += `
    <changefreq>${url.changefreq}</changefreq>`
      }

      if (url.priority !== undefined) {
        urlXML += `
    <priority>${url.priority.toFixed(1)}</priority>`
      }

      // 添加多语言支持
      if (alternateLanguages.length > 0) {
        for (const altLang of alternateLanguages) {
          const altUrl = url.url.replace(process.env.NEXT_PUBLIC_BASE_URL || '', altLang.baseUrl)
          urlXML += `
    <xhtml:link rel="alternate" hreflang="${altLang.lang}" href="${this.escapeXml(altUrl)}" />`
        }
      }

      urlXML += `
  </url>`

      return urlXML
    }).join('\n')

    return `${xmlHeader}
${urlEntries}
${xmlFooter}`
  }

  /**
   * 生成sitemap索引（用于多个sitemap文件）
   */
  static async generateSitemapIndex(baseUrl: string): Promise<string> {
    const cacheKey = 'sitemap:index'
    if (this.memoryCache.has(cacheKey)) {
      return this.memoryCache.get(cacheKey)!
    }

    const totalPosts = await prisma.post.count({
      where: { published: true }
    })

    // 如果URL数量超过限制，生成多个sitemap
    if (totalPosts > this.MAX_URLS_PER_SITEMAP) {
      const sitemaps = []
      const totalPages = Math.ceil(totalPosts / this.MAX_URLS_PER_SITEMAP)

      for (let i = 1; i <= totalPages; i++) {
        sitemaps.push({
          url: `${baseUrl}/sitemap-${i}.xml`,
          lastmod: new Date().toISOString()
        })
      }

      const xml = this.generateSitemapIndexXML(sitemaps)
      this.memoryCache.set(cacheKey, xml)
      return xml
    }

    // 单个sitemap足够
    const xml = this.generateSitemapIndexXML([{
      url: `${baseUrl}/sitemap.xml`,
      lastmod: new Date().toISOString()
    }])

    this.memoryCache.set(cacheKey, xml)
    return xml
  }

  /**
   * 生成sitemap索引XML
   */
  private static generateSitemapIndexXML(sitemaps: Array<{ url: string, lastmod: string }>): string {
    const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
               xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
               http://www.sitemaps.org/schemas/sitemap/0.9/siteindex.xsd">`

    const xmlFooter = '</sitemapindex>'

    const sitemapEntries = sitemaps.map(sitemap => `  <sitemap>
    <loc>${this.escapeXml(sitemap.url)}</loc>
    <lastmod>${sitemap.lastmod}</lastmod>
  </sitemap>`).join('\n')

    return `${xmlHeader}
${sitemapEntries}
${xmlFooter}`
  }

  /**
   * 生成特定分页的sitemap
   */
  static async generatePaginatedSitemap(baseUrl: string, page: number, limit: number): Promise<string> {
    const cacheKey = `sitemap:paginated:${page}:${limit}`
    if (this.memoryCache.has(cacheKey)) {
      return this.memoryCache.get(cacheKey)!
    }

    const skip = (page - 1) * limit

    const posts = await prisma.post.findMany({
      where: { published: true },
      skip,
      take: limit,
      select: {
        slug: true,
        updatedAt: true,
        publishedAt: true
      },
      orderBy: { publishedAt: 'desc' }
    })

    const urls: SitemapUrl[] = posts.map(post => ({
      url: `${baseUrl}/posts/${post.slug}`,
      lastmod: post.updatedAt?.toISOString() || post.publishedAt?.toISOString(),
      changefreq: 'monthly' as const,
      priority: 0.8
    }))

    const xml = this.generateSitemapXML(urls)
    this.memoryCache.set(cacheKey, xml)

    return xml
  }

  /**
   * 清除sitemap缓存
   */
  static clearSitemapCache(): void {
    this.memoryCache.clear()
  }

  /**
   * 获取sitemap统计信息
   */
  static async getSitemapStats(): Promise<{
    totalPosts: number
    totalCategories: number
    totalTags: number
    totalUsers: number
    estimatedUrls: number
  }> {
    const [totalPosts, categoriesResult, tags, users] = await Promise.all([
      prisma.post.count({ where: { published: true } }),
      CategoryService.getCategories({ limit: 1000 }),
      PostService.getAllTags(),
      prisma.user.count({
        where: {
          isActive: true,
          posts: {
            some: { published: true }
          }
        }
      })
    ])

    const estimatedUrls =
      7 + // 静态页面
      totalPosts + // 文章页面
      categoriesResult.categories.length + // 分类页面
      tags.length + // 标签页面
      users + // 用户页面
      Math.ceil(totalPosts / 12) + // 文章分页
      Math.min(20, categoriesResult.categories.length) * 2 // 分类分页（前20个分类，每分类2页）

    return {
      totalPosts,
      totalCategories: categoriesResult.categories.length,
      totalTags: tags.length,
      totalUsers: users,
      estimatedUrls
    }
  }

  /**
   * XML转义
   */
  private static escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  /**
   * 验证sitemap URL
   */
  static validateSitemapUrl(url: SitemapUrl): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // 验证URL格式
    try {
      new URL(url.url)
    } catch {
      errors.push('Invalid URL format')
    }

    // 验证changefreq
    const validChangefreqs = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never']
    if (url.changefreq && !validChangefreqs.includes(url.changefreq)) {
      errors.push(`Invalid changefreq: ${url.changefreq}`)
    }

    // 验证priority
    if (url.priority !== undefined && (url.priority < 0 || url.priority > 1)) {
      errors.push(`Priority must be between 0 and 1: ${url.priority}`)
    }

    // 验证lastmod格式
    if (url.lastmod) {
      const lastmodDate = new Date(url.lastmod)
      if (isNaN(lastmodDate.getTime())) {
        errors.push(`Invalid lastmod date format: ${url.lastmod}`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}