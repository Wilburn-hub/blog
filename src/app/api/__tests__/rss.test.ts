import { NextRequest } from 'next/server'
import { GET, HEAD, OPTIONS } from '../rss/route'

// Mock RSSService
jest.mock('@/lib/services/rss.service', () => ({
  RSSService: {
    generateRSSFeed: jest.fn(),
    recordAccess: jest.fn(),
    getConfig: jest.fn(),
  },
}))

describe('RSS Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('应该返回RSS XML响应', async () => {
      const mockRSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>测试博客</title>
    <description>测试描述</description>
    <link>https://example.com</link>
    <language>zh-cn</language>
    <item>
      <title>测试文章</title>
      <link>https://example.com/posts/test</link>
      <description>测试摘要</description>
      <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`

      const { RSSService } = require('@/lib/services/rss.service')
      RSSService.generateRSSFeed.mockResolvedValue(mockRSS)

      const request = new NextRequest('http://localhost:3000/rss')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('application/rss+xml; charset=utf-8')
      expect(response.headers.get('Cache-Control')).toBe('public, max-age=1800')
      expect(response.headers.get('X-RSS-Feed')).toBe('Personal Blog RSS Feed')
      expect(response.headers.get('X-RSS-Version')).toBe('2.0')

      const text = await response.text()
      expect(text).toBe(mockRSS)
    })

    it('应该处理查询参数', async () => {
      const { RSSService } = require('@/lib/services/rss.service')
      RSSService.generateRSSFeed.mockResolvedValue('<rss></rss>')

      const request = new NextRequest('http://localhost:3000/rss?limit=10&category=tech&tag=frontend&featured=true')
      await GET(request)

      expect(RSSService.generateRSSFeed).toHaveBeenCalledWith({
        type: 'rss',
        limit: 10,
        category: 'tech',
        tag: 'frontend',
        featured: true,
      })

      expect(RSSService.recordAccess).toHaveBeenCalledWith(
        'rss',
        'limit=10&category=tech&tag=frontend&featured=true',
        'unknown'
      )
    })

    it('应该处理错误情况', async () => {
      const { RSSService } = require('@/lib/services/rss.service')
      RSSService.generateRSSFeed.mockRejectedValue(new Error('生成失败'))

      const request = new NextRequest('http://localhost:3000/rss')
      const response = await GET(request)

      expect(response.status).toBe(500)
      expect(response.headers.get('Content-Type')).toBe('application/rss+xml; charset=utf-8')
      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate')

      const text = await response.text()
      expect(text).toContain('RSS Feed 生成错误')
    })

    it('应该在RSS功能禁用时返回404', async () => {
      const { RSSService } = require('@/lib/services/rss.service')
      RSSService.getConfig.mockResolvedValue({ enabled: false })

      const request = new NextRequest('http://localhost:3000/rss')
      const response = await GET(request)

      expect(response.status).toBe(500)
      const text = await response.text()
      expect(text).toContain('暂时无法生成')
    })
  })

  describe('HEAD', () => {
    it('应该在RSS启用时返回200', async () => {
      const { RSSService } = require('@/lib/services/rss.service')
      RSSService.getConfig.mockResolvedValue({ enabled: true })

      const request = new NextRequest('http://localhost:3000/rss')
      const response = await HEAD(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('application/rss+xml; charset=utf-8')
      expect(response.headers.get('X-RSS-Feed')).toBe('Personal Blog RSS Feed')
      expect(response.headers.get('X-RSS-Version')).toBe('2.0')
    })

    it('应该在RSS禁用时返回404', async () => {
      const { RSSService } = require('@/lib/services/rss.service')
      RSSService.getConfig.mockResolvedValue({ enabled: false })

      const request = new NextRequest('http://localhost:3000/rss')
      const response = await HEAD(request)

      expect(response.status).toBe(404)
    })

    it('应该在配置获取失败时返回500', async () => {
      const { RSSService } = require('@/lib/services/rss.service')
      RSSService.getConfig.mockRejectedValue(new Error('配置错误'))

      const request = new NextRequest('http://localhost:3000/rss')
      const response = await HEAD(request)

      expect(response.status).toBe(500)
    })
  })

  describe('OPTIONS', () => {
    it('应该返回CORS头', async () => {
      const request = new NextRequest('http://localhost:3000/rss', { method: 'OPTIONS' })
      const response = await OPTIONS()

      expect(response.status).toBe(200)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, HEAD, OPTIONS')
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type')
      expect(response.headers.get('Access-Control-Max-Age')).toBe('86400')
    })
  })
})