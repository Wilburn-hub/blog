import { RSSService } from '../rss.service'

// Mock dependencies
jest.mock('../../cache/redis', () => ({
  CacheService: {
    getInstance: jest.fn().mockResolvedValue({
      get: jest.fn(),
      set: jest.fn(),
      invalidateRSSCache: jest.fn(),
    }),
  },
}))

jest.mock('../post.service', () => ({
  PostService: {
    getPosts: jest.fn().mockResolvedValue({
      posts: [
        {
          id: '1',
          title: '测试文章',
          slug: 'test-post',
          content: '<p>这是测试内容</p>',
          excerpt: '这是摘要',
          publishedAt: new Date('2024-01-01'),
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          author: {
            name: '测试作者',
            email: 'test@example.com',
            username: 'testauthor',
          },
          tags: ['技术', '前端'],
          coverImage: 'https://example.com/image.jpg',
        },
      ],
    }),
  },
}))

describe('RSSService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // 设置环境变量
    process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com'
  })

  describe('generateRSSFeed', () => {
    it('应该生成有效的RSS 2.0 XML', async () => {
      const rssFeed = await RSSService.generateRSSFeed()

      expect(rssFeed).toContain('<?xml version="1.0" encoding="UTF-8"?>')
      expect(rssFeed).toContain('<rss version="2.0">')
      expect(rssFeed).toContain('<channel>')
      expect(rssFeed).toContain('<title>我的博客</title>')
      expect(rssFeed).toContain('<description>分享技术、生活和思考的博客</description>')
      expect(rssFeed).toContain('<language>zh-cn</language>')
      expect(rssFeed).toContain('<item>')
      expect(rssFeed).toContain('<title>测试文章</title>')
      expect(rssFeed).toContain('</rss>')
    })

    it('应该正确转义XML特殊字符', async () => {
      // 创建包含特殊字符的测试数据
      const mockPosts = {
        posts: [
          {
            id: '1',
            title: '测试 & 特殊字符 "引号" <标签>',
            slug: 'test-special',
            content: '<p>内容包含 & " " < > 字符</p>',
            excerpt: '摘要包含特殊字符',
            publishedAt: new Date('2024-01-01'),
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
            author: {
              name: '测试作者',
              email: 'test@example.com',
              username: 'testauthor',
            },
            tags: [],
          },
        ],
      }

      // Mock PostService to return special character test data
      const { PostService } = require('../post.service')
      PostService.getPosts.mockResolvedValue(mockPosts)

      const rssFeed = await RSSService.generateRSSFeed()

      expect(rssFeed).toContain('&amp;')
      expect(rssFeed).toContain('&quot;')
      expect(rssFeed).toContain('&lt;')
      expect(rssFeed).toContain('&gt;')
      expect(rssFeed).not.toContain('&')
      expect(rssFeed).not.toContain('"')
      expect(rssFeed).not.toContain('<')
      expect(rssFeed).not.toContain('>')
    })

    it('应该支持查询参数过滤', async () => {
      const options = {
        type: 'rss' as const,
        limit: 5,
        category: 'tech',
        tag: 'frontend',
        featured: true,
      }

      await RSSService.generateRSSFeed(options)

      const { PostService } = require('../post.service')
      expect(PostService.getPosts).toHaveBeenCalledWith({
        published: true,
        limit: 5,
        sort: 'latest',
        category: 'tech',
        tags: ['frontend'],
        featured: true,
      })
    })

    it('应该在RSS功能禁用时抛出错误', async () => {
      // Mock disabled config
      const { CacheService } = require('../../cache/redis')
      const mockCache = {
        get: jest.fn().mockResolvedValue({ enabled: false }),
        set: jest.fn(),
        invalidateRSSCache: jest.fn(),
      }
      CacheService.getInstance.mockResolvedValue(mockCache)

      await expect(RSSService.generateRSSFeed()).rejects.toThrow('RSS功能已禁用')
    })
  })

  describe('generateJSONFeed', () => {
    it('应该生成有效的JSON Feed', async () => {
      const jsonFeed = await RSSService.generateJSONFeed()

      expect(jsonFeed).toHaveProperty('version', 'https://jsonfeed.org/version/1.1')
      expect(jsonFeed).toHaveProperty('title', '我的博客')
      expect(jsonFeed).toHaveProperty('description', '分享技术、生活和思考的博客')
      expect(jsonFeed).toHaveProperty('items')
      expect(Array.isArray(jsonFeed.items)).toBe(true)
      expect(jsonFeed.items).toHaveLength(1)

      const item = jsonFeed.items[0]
      expect(item).toHaveProperty('id', '1')
      expect(item).toHaveProperty('title', '测试文章')
      expect(item).toHaveProperty('url', 'https://example.com/posts/test-post')
      expect(item).toHaveProperty('content_html')
      expect(item).toHaveProperty('date_published')
    })

    it('应该包含正确的作者信息', async () => {
      const jsonFeed = await RSSService.generateJSONFeed()

      const item = jsonFeed.items[0]
      expect(item.author).toHaveProperty('name', '测试作者')
      expect(item.author).toHaveProperty('url', 'https://example.com/profile/testauthor')
    })

    it('应该包含标签信息', async () => {
      const jsonFeed = await RSSService.generateJSONFeed()

      const item = jsonFeed.items[0]
      expect(item.tags).toEqual(['技术', '前端'])
    })
  })

  describe('配置管理', () => {
    it('应该返回默认配置', async () => {
      const config = await RSSService.getConfig()

      expect(config).toHaveProperty('enabled', true)
      expect(config).toHaveProperty('maxItems', 20)
      expect(config).toHaveProperty('includeContent', true)
      expect(config).toHaveProperty('includeAuthor', true)
      expect(config).toHaveProperty('includeCategories', true)
      expect(config).toHaveProperty('includeImages', true)
      expect(config).toHaveProperty('cacheTTL', 1800)
    })

    it('应该更新配置', async () => {
      const newConfig = {
        enabled: false,
        maxItems: 10,
        feedInfo: {
          title: '新标题',
          description: '新描述',
        },
      }

      const updatedConfig = await RSSService.updateConfig(newConfig)

      expect(updatedConfig.enabled).toBe(false)
      expect(updatedConfig.maxItems).toBe(10)
      expect(updatedConfig.feedInfo.title).toBe('新标题')
      expect(updatedConfig.feedInfo.description).toBe('新描述')
    })
  })

  describe('分析功能', () => {
    it('应该返回分析数据', async () => {
      const analytics = await RSSService.getAnalytics()

      expect(analytics).toHaveProperty('totalRequests')
      expect(analytics).toHaveProperty('uniqueIPs')
      expect(analytics).toHaveProperty('lastAccessed')
      expect(analytics).toHaveProperty('popularFeeds')
      expect(Array.isArray(analytics.popularFeeds)).toBe(true)
    })

    it('应该记录访问', async () => {
      await RSSService.recordAccess('rss', 'limit=10', '192.168.1.1')

      const analytics = await RSSService.getAnalytics()
      expect(analytics.totalRequests).toBe(1)
    })
  })

  describe('验证功能', () => {
    it('应该验证RSS Feed', async () => {
      const validation = await RSSService.validateFeed('rss')

      expect(validation).toHaveProperty('valid')
      expect(validation).toHaveProperty('errors')
      expect(Array.isArray(validation.errors)).toBe(true)
    })

    it('应该验证JSON Feed', async () => {
      const validation = await RSSService.validateFeed('json')

      expect(validation).toHaveProperty('valid')
      expect(validation).toHaveProperty('errors')
      expect(Array.isArray(validation.errors)).toBe(true)
    })
  })

  describe('工具函数', () => {
    it('应该正确转义XML字符', () => {
      const xml = (RSSService as any).escapeXML('<test & "quotes">')
      expect(xml).toBe('&lt;test &amp; &quot;quotes&quot;&gt;')
    })

    it('应该正确截断HTML内容', () => {
      const html = '<p>这是一段<strong>测试</strong>内容</p>'
      const truncated = (RSSService as any).truncateHTML(html, 10)
      expect(truncated).toBe('这是一段测试内容')
    })

    it('应该正确移除HTML标签', () => {
      const html = '<p>这是<strong>测试</strong>内容</p>'
      const text = (RSSService as any).stripHTML(html)
      expect(text).toBe('这是测试内容')
    })

    it('应该正确生成缓存键', () => {
      const options = {
        type: 'rss' as const,
        limit: 10,
        category: 'tech',
        tag: 'frontend',
      }
      const cacheKey = (RSSService as any).getCacheKey(options)
      expect(cacheKey).toBe('rss:feed')
    })
  })

  describe('错误处理', () => {
    it('应该在获取文章失败时抛出错误', async () => {
      const { PostService } = require('../post.service')
      PostService.getPosts.mockRejectedValue(new Error('数据库错误'))

      await expect(RSSService.generateRSSFeed()).rejects.toThrow()
    })

    it('应该在缓存失败时仍然生成Feed', async () => {
      const { CacheService } = require('../../cache/redis')
      const mockCache = {
        get: jest.fn().mockRejectedValue(new Error('Redis连接失败')),
        set: jest.fn(),
        invalidateRSSCache: jest.fn(),
      }
      CacheService.getInstance.mockResolvedValue(mockCache)

      // 应该不会抛出错误
      const rssFeed = await RSSService.generateRSSFeed()
      expect(rssFeed).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    })
  })
})