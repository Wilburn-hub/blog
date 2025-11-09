import { NextRequest } from 'next/server'
import { GET, POST } from '../posts/route'

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    post: {
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  })),
}))

// Mock rate limiter
jest.mock('@/lib/utils/rate-limiter', () => ({
  rateLimit: jest.fn().mockResolvedValue({ success: true }),
}))

describe('/api/posts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/posts', () => {
    it('should return posts list', async () => {
      const mockPosts = [
        {
          id: '1',
          title: 'Test Post 1',
          slug: 'test-post-1',
          excerpt: 'Test excerpt',
          content: 'Test content',
          published: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          author: {
            id: '1',
            name: 'Test Author',
            email: 'test@example.com',
            username: 'testauthor',
          },
          _count: {
            comments: 5,
            likes: 10,
          },
        },
      ]

      const { PrismaClient } = require('@prisma/client')
      const prisma = new PrismaClient()
      prisma.post.findMany.mockResolvedValue(mockPosts)
      prisma.post.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/posts?page=1&limit=10')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.posts).toHaveLength(1)
      expect(data.data.pagination.total).toBe(1)
    })

    it('should handle search query', async () => {
      const { PrismaClient } = require('@prisma/client')
      const prisma = new PrismaClient()
      prisma.post.findMany.mockResolvedValue([])
      prisma.post.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/posts?q=search-term')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                title: expect.objectContaining({
                  contains: 'search-term',
                  mode: 'insensitive',
                }),
              }),
              expect.objectContaining({
                content: expect.objectContaining({
                  contains: 'search-term',
                  mode: 'insensitive',
                }),
              }),
            ]),
          }),
        })
      )
    })

    it('should validate query parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/posts?limit=200')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Limit must be')
    })

    it('should handle database errors', async () => {
      const { PrismaClient } = require('@prisma/client')
      const prisma = new PrismaClient()
      prisma.post.findMany.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/posts')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Failed to fetch posts')
    })
  })

  describe('POST /api/posts', () => {
    it('should create a new post', async () => {
      const mockPost = {
        id: '1',
        title: 'New Test Post',
        slug: 'new-test-post',
        excerpt: 'New test excerpt',
        content: 'New test content',
        published: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: '1',
      }

      const { PrismaClient } = require('@prisma/client')
      const prisma = new PrismaClient()
      prisma.post.create.mockResolvedValue(mockPost)

      const postData = {
        title: 'New Test Post',
        content: 'New test content',
        excerpt: 'New test excerpt',
        published: false,
      }

      const request = new NextRequest('http://localhost:3000/api/posts', {
        method: 'POST',
        body: JSON.stringify(postData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Mock authenticated user
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      }

      // Mock the authentication middleware
      jest.doMock('@/lib/auth/middleware', () => ({
        authenticate: jest.fn().mockResolvedValue(mockUser),
      }))

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.title).toBe('New Test Post')
    })

    it('should validate required fields', async () => {
      const invalidPostData = {
        title: '', // Empty title
        content: '', // Empty content
      }

      const request = new NextRequest('http://localhost:3000/api/posts', {
        method: 'POST',
        body: JSON.stringify(invalidPostData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Validation failed')
    })

    it('should handle rate limiting', async () => {
      const { rateLimit } = require('@/lib/utils/rate-limiter')
      rateLimit.mockResolvedValue({ success: false })

      const postData = {
        title: 'Test Post',
        content: 'Test content',
      }

      const request = new NextRequest('http://localhost:3000/api/posts', {
        method: 'POST',
        body: JSON.stringify(postData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Too many requests')
    })
  })
})