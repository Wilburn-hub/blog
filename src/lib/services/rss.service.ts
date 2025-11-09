import { PostService } from './post.service'
import { CacheService } from '../cache/redis'
import {
  RSSFeed,
  RSSItem,
  RSSFeedInfo,
  JSONFeed,
  JSONFeedItem,
  RSSConfig,
  RSSFeedOptions,
  RSSAnalytics,
  PostWithAuthor
} from '../../types'

export class RSSService {
  private static defaultConfig: RSSConfig = {
    enabled: true,
    maxItems: 20,
    includeContent: true,
    contentLength: 500,
    includeAuthor: true,
    includeCategories: true,
    includeImages: true,
    cacheTTL: 1800, // 30 minutes
    feedInfo: {
      title: '我的博客',
      description: '分享技术、生活和思考的博客',
      language: 'zh-cn',
      generator: 'Personal Blog RSS Generator',
      docs: 'https://www.rssboard.org/rss-specification',
      ttl: 60
    }
  }

  /**
   * 生成RSS 2.0格式的XML
   */
  static async generateRSSFeed(options: RSSFeedOptions = { type: 'rss' }): Promise<string> {
    const config = await this.getConfig()
    if (!config.enabled) {
      throw new Error('RSS功能已禁用')
    }

    const cache = await CacheService.getInstance()
    const cacheKey = this.getCacheKey(options)

    // 尝试从缓存获取
    const cachedFeed = await cache.get(cacheKey)
    if (cachedFeed) {
      return cachedFeed
    }

    try {
      const posts = await this.getPostsForFeed(options)
      const feedInfo = await this.getFeedInfo(config)

      const feed: RSSFeed = {
        rss: {
          '@version': '2.0',
          channel: {
            title: feedInfo.title,
            description: feedInfo.description,
            link: feedInfo.link,
            language: feedInfo.language,
            copyright: feedInfo.copyright,
            managingEditor: feedInfo.managingEditor,
            webMaster: feedInfo.webMaster,
            pubDate: feedInfo.pubDate?.toUTCString(),
            lastBuildDate: feedInfo.lastBuildDate?.toUTCString(),
            generator: feedInfo.generator,
            docs: feedInfo.docs,
            ttl: feedInfo.ttl?.toString(),
            image: feedInfo.image ? {
              url: feedInfo.image.url,
              title: feedInfo.image.title,
              link: feedInfo.image.link,
              width: feedInfo.image.width?.toString(),
              height: feedInfo.image.height?.toString(),
              description: feedInfo.image.description
            } : undefined,
            item: posts.map(post => this.createRSSItem(post, config))
          }
        }
      }

      const xml = this.convertToXML(feed)

      // 缓存结果
      await cache.set(cacheKey, xml, config.cacheTTL)

      return xml
    } catch (error) {
      console.error('生成RSS Feed失败:', error)
      throw new Error('RSS Feed生成失败')
    }
  }

  /**
   * 生成JSON Feed格式的JSON
   */
  static async generateJSONFeed(options: RSSFeedOptions = { type: 'json' }): Promise<JSONFeed> {
    const config = await this.getConfig()
    if (!config.enabled) {
      throw new Error('RSS功能已禁用')
    }

    const cache = await CacheService.getInstance()
    const cacheKey = this.getCacheKey(options)

    // 尝试从缓存获取
    const cachedFeed = await cache.get(cacheKey)
    if (cachedFeed) {
      return cachedFeed
    }

    try {
      const posts = await this.getPostsForFeed(options)
      const feedInfo = await this.getFeedInfo(config)

      const feed: JSONFeed = {
        version: 'https://jsonfeed.org/version/1.1',
        title: feedInfo.title,
        home_page_url: feedInfo.link,
        feed_url: `${feedInfo.link}/feed.json`,
        description: feedInfo.description,
        user_comment: '此Feed由个人博客系统生成',
        icon: feedInfo.image?.url,
        author: feedInfo.managingEditor ? {
          name: feedInfo.managingEditor,
          url: feedInfo.link
        } : undefined,
        expired: false,
        items: posts.map(post => this.createJSONFeedItem(post, config))
      }

      // 缓存结果
      await cache.set(cacheKey, feed, config.cacheTTL)

      return feed
    } catch (error) {
      console.error('生成JSON Feed失败:', error)
      throw new Error('JSON Feed生成失败')
    }
  }

  /**
   * 获取RSS配置
   */
  static async getConfig(): Promise<RSSConfig> {
    try {
      const cache = await CacheService.getInstance()
      const cachedConfig = await cache.get('rss:config')

      if (cachedConfig) {
        return cachedConfig
      }

      // 这里可以从数据库或配置文件获取配置
      // 暂时返回默认配置
      const config = { ...this.defaultConfig }

      await cache.set('rss:config', config, 3600) // 1小时缓存

      return config
    } catch (error) {
      console.error('获取RSS配置失败:', error)
      return this.defaultConfig
    }
  }

  /**
   * 更新RSS配置
   */
  static async updateConfig(newConfig: Partial<RSSConfig>): Promise<RSSConfig> {
    try {
      const config = { ...this.defaultConfig, ...newConfig }

      const cache = await CacheService.getInstance()
      await cache.set('rss:config', config, 3600)

      // 清除所有RSS缓存
      await this.clearRSSCache()

      return config
    } catch (error) {
      console.error('更新RSS配置失败:', error)
      throw new Error('RSS配置更新失败')
    }
  }

  /**
   * 获取Feed信息
   */
  private static async getFeedInfo(config: RSSConfig): Promise<RSSFeedInfo> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://localhost:3000'
    const now = new Date()

    return {
      title: config.feedInfo.title || '我的博客',
      description: config.feedInfo.description || '分享技术、生活和思考的博客',
      link: baseUrl,
      language: config.feedInfo.language || 'zh-cn',
      copyright: config.feedInfo.copyright || `© ${now.getFullYear()} 我的博客`,
      managingEditor: config.feedInfo.managingEditor,
      webMaster: config.feedInfo.webMaster,
      pubDate: config.feedInfo.pubDate || now,
      lastBuildDate: now,
      generator: config.feedInfo.generator || 'Personal Blog RSS Generator',
      docs: config.feedInfo.docs || 'https://www.rssboard.org/rss-specification',
      ttl: config.feedInfo.ttl || 60,
      image: config.feedInfo.image || {
        url: `${baseUrl}/images/logo.png`,
        title: '我的博客Logo',
        link: baseUrl,
        width: 144,
        height: 144,
        description: '我的博客的标志'
      }
    }
  }

  /**
   * 获取用于Feed的文章
   */
  private static async getPostsForFeed(options: RSSFeedOptions): Promise<PostWithAuthor[]> {
    const queryOptions = {
      published: true,
      limit: options.limit || 20,
      sort: 'latest' as const,
      category: options.category,
      tags: options.tag ? [options.tag] : undefined,
      featured: options.featured,
      authorId: options.author
    }

    const result = await PostService.getPosts(queryOptions)
    return result.posts
  }

  /**
   * 创建RSS项目
   */
  private static createRSSItem(post: PostWithAuthor, config: RSSConfig): RSSItem {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://localhost:3000'
    const postUrl = `${baseUrl}/posts/${post.slug}`

    return {
      title: this.escapeXML(post.title),
      link: postUrl,
      description: this.escapeXML(post.excerpt || this.truncateHTML(post.content, config.contentLength)),
      content: config.includeContent ? `<![CDATA[${this.prepareContent(post.content, config.includeImages)}]]>` : undefined,
      pubDate: post.publishedAt || post.createdAt,
      guid: {
        value: postUrl,
        isPermaLink: true
      },
      author: config.includeAuthor && post.author?.email ? `${post.author.name} <${post.author.email}>` : undefined,
      categories: config.includeCategories && post.tags ? post.tags.map(tag => this.escapeXML(tag)) : undefined,
      comments: `${postUrl}#comments`,
      enclosure: post.coverImage ? {
        url: post.coverImage,
        type: 'image/jpeg',
        length: undefined
      } : undefined
    }
  }

  /**
   * 创建JSON Feed项目
   */
  private static createJSONFeedItem(post: PostWithAuthor, config: RSSConfig): JSONFeedItem {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://localhost:3000'
    const postUrl = `${baseUrl}/posts/${post.slug}`

    return {
      id: post.id,
      url: postUrl,
      title: post.title,
      content_html: config.includeContent ? this.prepareContent(post.content, config.includeImages) : undefined,
      content_text: config.includeContent ? this.stripHTML(post.content) : undefined,
      summary: post.excerpt || this.truncateHTML(post.content, config.contentLength),
      image: post.coverImage,
      date_published: (post.publishedAt || post.createdAt).toISOString(),
      date_modified: post.updatedAt.toISOString(),
      author: config.includeAuthor && post.author ? {
        name: post.author.name || post.author.username,
        url: `${baseUrl}/profile/${post.author.username}`,
        avatar: post.author.avatar
      } : undefined,
      tags: config.includeCategories ? post.tags : undefined,
      language: 'zh-cn'
    }
  }

  /**
   * 转换为XML字符串
   */
  private static convertToXML(feed: RSSFeed): string {
    const items = feed.rss.channel.item.map(item => this.rssItemToXML(item)).join('')

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${this.escapeXML(feed.rss.channel.title)}</title>
    <description>${this.escapeXML(feed.rss.channel.description)}</description>
    <link>${this.escapeXML(feed.rss.channel.link)}</link>
    <language>${feed.rss.channel.language}</language>
    ${feed.rss.channel.copyright ? `<copyright>${this.escapeXML(feed.rss.channel.copyright)}</copyright>` : ''}
    ${feed.rss.channel.managingEditor ? `<managingEditor>${this.escapeXML(feed.rss.channel.managingEditor)}</managingEditor>` : ''}
    ${feed.rss.channel.webMaster ? `<webMaster>${this.escapeXML(feed.rss.channel.webMaster)}</webMaster>` : ''}
    ${feed.rss.channel.pubDate ? `<pubDate>${feed.rss.channel.pubDate}</pubDate>` : ''}
    ${feed.rss.channel.lastBuildDate ? `<lastBuildDate>${feed.rss.channel.lastBuildDate}</lastBuildDate>` : ''}
    <generator>${this.escapeXML(feed.rss.channel.generator || '')}</generator>
    <docs>${feed.rss.channel.docs || ''}</docs>
    ${feed.rss.channel.ttl ? `<ttl>${feed.rss.channel.ttl}</ttl>` : ''}
    ${feed.rss.channel.image ? this.imageToXML(feed.rss.channel.image) : ''}
    ${items}
  </channel>
</rss>`
  }

  /**
   * RSS项目转XML
   */
  private static rssItemToXML(item: RSSItem): string {
    return `
    <item>
      <title>${this.escapeXML(item.title)}</title>
      <link>${this.escapeXML(item.link)}</link>
      <description>${this.escapeXML(item.description)}</description>
      ${item.content ? `<content:encoded xmlns:content="http://purl.org/rss/1.0/modules/content/">${item.content}</content:encoded>` : ''}
      <pubDate>${item.pubDate.toUTCString()}</pubDate>
      <guid isPermaLink="${item.guid?.isPermaLink ? 'true' : 'false'}">${this.escapeXML(item.guid?.value || item.link)}</guid>
      ${item.author ? `<author>${this.escapeXML(item.author)}</author>` : ''}
      ${item.categories ? item.categories.map(cat => `<category>${cat}</category>`).join('') : ''}
      ${item.comments ? `<comments>${this.escapeXML(item.comments)}</comments>` : ''}
      ${item.enclosure ? `<enclosure url="${this.escapeXML(item.enclosure.url)}" type="${item.enclosure.type}" ${item.enclosure.length ? `length="${item.enclosure.length}"` : ''}/>` : ''}
    </item>`
  }

  /**
   * 图片信息转XML
   */
  private static imageToXML(image: any): string {
    return `
    <image>
      <url>${this.escapeXML(image.url)}</url>
      <title>${this.escapeXML(image.title)}</title>
      <link>${this.escapeXML(image.link)}</link>
      ${image.width ? `<width>${image.width}</width>` : ''}
      ${image.height ? `<height>${image.height}</height>` : ''}
      ${image.description ? `<description>${this.escapeXML(image.description)}</description>` : ''}
    </image>`
  }

  /**
   * 准备内容（处理图片等）
   */
  private static prepareContent(content: string, includeImages: boolean): string {
    if (!includeImages) {
      // 移除图片标签
      return content.replace(/<img[^>]*>/gi, '')
    }

    // 确保图片URL是绝对路径
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://localhost:3000'
    return content.replace(/src="\/([^"]*)"/g, `src="${baseUrl}/$1"`)
  }

  /**
   * 截断HTML内容
   */
  private static truncateHTML(html: string, length: number): string {
    const text = this.stripHTML(html)
    if (text.length <= length) {
      return text
    }
    return text.substring(0, length).trim() + '...'
  }

  /**
   * 移除HTML标签
   */
  private static stripHTML(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
  }

  /**
   * 转义XML特殊字符
   */
  private static escapeXML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  /**
   * 获取缓存键
   */
  private static getCacheKey(options: RSSFeedOptions): string {
    const params = [
      options.type,
      options.limit || 'default',
      options.category || '',
      options.tag || '',
      options.author || '',
      options.featured ? 'featured' : ''
    ].filter(Boolean).join(':')

    return `rss:feed:${params}`
  }

  /**
   * 清除RSS缓存
   */
  static async clearRSSCache(): Promise<void> {
    try {
      const cache = await CacheService.getInstance()
      await cache.invalidateRSSCache()
    } catch (error) {
      console.error('清除RSS缓存失败:', error)
    }
  }

  /**
   * 获取RSS分析数据
   */
  static async getAnalytics(): Promise<RSSAnalytics> {
    try {
      const cache = await CacheService.getInstance()
      const analytics = await cache.get('rss:analytics')

      if (!analytics) {
        return {
          totalRequests: 0,
          uniqueIPs: 0,
          lastAccessed: new Date(),
          popularFeeds: []
        }
      }

      return analytics
    } catch (error) {
      console.error('获取RSS分析数据失败:', error)
      return {
        totalRequests: 0,
        uniqueIPs: 0,
        lastAccessed: new Date(),
        popularFeeds: []
      }
    }
  }

  /**
   * 记录RSS访问
   */
  static async recordAccess(type: string, params: string, ip: string): Promise<void> {
    try {
      const cache = await CacheService.getInstance()
      const analytics = await this.getAnalytics()

      analytics.totalRequests++
      analytics.lastAccessed = new Date()

      // 更新热门Feed统计
      const feedKey = `${type}:${params}`
      const existingFeed = analytics.popularFeeds.find(feed => feed.type === feedKey)

      if (existingFeed) {
        existingFeed.count++
      } else {
        analytics.popularFeeds.push({
          type: feedKey,
          params,
          count: 1
        })
      }

      // 按访问量排序，保留前10个
      analytics.popularFeeds.sort((a, b) => b.count - a.count)
      analytics.popularFeeds = analytics.popularFeeds.slice(0, 10)

      await cache.set('rss:analytics', analytics, 86400) // 24小时缓存
    } catch (error) {
      console.error('记录RSS访问失败:', error)
    }
  }

  /**
   * 验证RSS Feed有效性
   */
  static async validateFeed(type: 'rss' | 'json'): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = []

    try {
      const options: RSSFeedOptions = { type, limit: 1 }

      if (type === 'rss') {
        const feed = await this.generateRSSFeed(options)

        // 基本XML验证
        if (!feed.includes('<?xml version="1.0"')) {
          errors.push('缺少XML声明')
        }
        if (!feed.includes('<rss version="2.0">')) {
          errors.push('缺少RSS根元素')
        }
        if (!feed.includes('<channel>')) {
          errors.push('缺少channel元素')
        }
        if (!feed.includes('<title>')) {
          errors.push('缺少标题')
        }
        if (!feed.includes('<description>')) {
          errors.push('缺少描述')
        }
        if (!feed.includes('<link>')) {
          errors.push('缺少链接')
        }
      } else {
        const feed = await this.generateJSONFeed(options)

        if (!feed.version) {
          errors.push('缺少版本信息')
        }
        if (!feed.title) {
          errors.push('缺少标题')
        }
        if (!feed.description) {
          errors.push('缺少描述')
        }
        if (!Array.isArray(feed.items)) {
          errors.push('items必须是数组')
        }
      }
    } catch (error) {
      errors.push(`Feed生成失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}