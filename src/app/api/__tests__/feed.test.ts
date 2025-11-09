import { NextRequest } from 'next/server'
import { GET, HEAD, OPTIONS } from '../feed.json/route'

// Mock RSSService
jest.mock('@/lib/services/rss.service', () => ({
  RSSService: {
    generateJSONFeed: jest.fn(),
    recordAccess: jest.fn(),
    getConfig: jest.fn(),
  },
}))

describe('JSON Feed Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('应该返回JSON Feed响应', async () => {
      const mockJSONFeed = {
        version: 'https://jsonfeed.org/version/1.1',
        title: '测试博客',
        description: '测试描述',
        home_page_url: 'https://example.com',
        feed_url: 'https://example.com/feed.json',
        items: [
          {
            id: '1',
            url: 'https://example.com/posts/test',
            title: '测试文章',
            content_html: '<p>测试内容</p>',
            date_published: '2024-01-01T00:00:00Z',
          },
        ],
      }

      const { RSSService } = require('@/lib/services/rss.service')
      RSSService.generateJSONFeed.mockResolvedValue(mockJSONFeed)

      const request = new NextRequest('http://localhost:3000/feed.json')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('application/feed+json; charset=utf-8')
      expect(response.headers.get('Cache-Control')).toBe('public, max-age=1800')
      expect(response.headers.get('X-JSON-Feed')).toBe('Personal Blog JSON Feed')
      expect(response.headers.get('X-JSON-Feed-Version')).toBe('1.1')

      const json = await response.json()
      expect(json).toEqual(mockJSONFeed)
    })

    it('应该处理查询参数', async () => {
      const { RSSService } = require('@/lib/services/rss.service')
      RSSService.generateJSONFeed.mockResolvedValue({ items: [] })

      const request = new NextRequest('http://localhost:3000/feed.json?limit=5&tag=javascript')
      await GET(request)

      expect(RSSService.generateJSONFeed).toHaveBeenCalledWith({
        type: 'json',
        limit: 5,
        tag: 'javascript',
      })

      expect(RSSService.recordAccess).toHaveBeenCalledWith(
        'json',
        'limit=5&tag=javascript',
        'unknown'
      )
    })

    it('应该处理错误情况', async () => {
      const { RSSService } = require('@/lib/services/rss.service')
      RSSService.generateJSONFeed.mockRejectedValue(new Error('生成失败'))

      const request = new NextRequest('http://localhost:3000/feed.json')
      const response = await GET(request)

      expect(response.status).toBe(500)
      expect(response.headers.get('Content-Type')).toBe('application/feed+json; charset=utf-8')
      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate')

      const json = await response.json()
      expect(json.title).toBe('JSON Feed 生成错误')
      expect(json.expired).toBe(true)
    })

    it('应该在RSS功能禁用时返回错误', async () => {
      const { RSSService } = require('@/lib/services/rss.service')
      RSSService.getConfig.mockResolvedValue({ enabled: false })

      const request = new NextRequest('http://localhost:3000/feed.json')
      const response = await GET(request)

      expect(response.status).toBe(500)
      const json = await response.json()
      expect(json.title).toBe('JSON Feed 生成错误')
    })
  })

  describe('HEAD', () => {
    it('应该在RSS启用时返回200', async () => {
      const { RSSService } = require('@/lib/services/rss.service')
      RSSService.getConfig.mockResolvedValue({ enabled: true })

      const request = new NextRequest('http://localhost:3000/feed.json')
      const response = await HEAD(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('application/feed+json; charset=utf-8')
      expect(response.headers.get('X-JSON-Feed')).toBe('Personal Blog JSON Feed')
      expect(response.headers.get('X-JSON-Feed-Version')).toBe('1.1')
    })

    it('应该在RSS禁用时返回404', async () => {
      const { RSSService } = require('@/lib/services/rss.service')
      RSSService.getConfig.mockResolvedValue({ enabled: false })

      const request = new NextRequest('http://localhost:3000/feed.json')
      const response = await HEAD(request)

      expect(response.status).toBe(404)
    })

    it('应该在配置获取失败时返回500', async () => {
      const { RSSService } = require('@/lib/services/rss.service')
      RSSService.getConfig.mockRejectedValue(new Error('配置错误'))

      const request = new NextRequest('http://localhost:3000/feed.json')
      const response = await HEAD(request)

      expect(response.status).toBe(500)
    })
  })

  describe('OPTIONS', () => {
    it('应该返回CORS头', async () => {
      const request = new NextRequest('http://localhost:3000/feed.json', { method: 'OPTIONS' })
      const response = await OPTIONS()

      expect(response.status).toBe(200)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, HEAD, OPTIONS')
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type')
      expect(response.headers.get('Access-Control-Max-Age')).toBe('86400')
    })
  })
})