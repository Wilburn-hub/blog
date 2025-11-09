import { NextRequest } from 'next/server'
import { POST as RegisterHandler } from '../../app/api/auth/register/route'
import { POST as LoginHandler } from '../../app/api/auth/login/route'
import { GET as MeHandler } from '../../app/api/auth/me/route'

// Mock dependencies
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  })),
}))

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true),
}))

jest.mock('@/lib/auth/jwt', () => ({
  generateTokens: jest.fn().mockReturnValue({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  }),
  verifyToken: jest.fn().mockReturnValue({ userId: '1', email: 'test@example.com' }),
}))

jest.mock('@/lib/utils/rate-limiter', () => ({
  rateLimit: jest.fn().mockResolvedValue({ success: true }),
}))

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('User Registration Flow', () => {
    it('should register a new user successfully', async () => {
      const { PrismaClient } = require('@prisma/client')
      const prisma = new PrismaClient()

      // Mock user doesn't exist
      prisma.user.findUnique.mockResolvedValue(null)

      // Mock user creation
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
        createdAt: new Date(),
      }
      prisma.user.create.mockResolvedValue(mockUser)

      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'TestPass123!',
        name: 'Test User',
      }

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await RegisterHandler(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.user.email).toBe('test@example.com')
      expect(data.data.accessToken).toBe('mock-access-token')
      expect(data.data.refreshToken).toBe('mock-refresh-token')

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      })

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'test@example.com',
          username: 'testuser',
          name: 'Test User',
        }),
      })
    })

    it('should reject registration for existing email', async () => {
      const { PrismaClient } = require('@prisma/client')
      const prisma = new PrismaClient()

      // Mock user already exists
      const existingUser = {
        id: '1',
        email: 'test@example.com',
      }
      prisma.user.findUnique.mockResolvedValue(existingUser)

      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'TestPass123!',
        name: 'Test User',
      }

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await RegisterHandler(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.success).toBe(false)
      expect(data.error).toContain('already exists')

      expect(prisma.user.create).not.toHaveBeenCalled()
    })
  })

  describe('User Login Flow', () => {
    it('should login with valid credentials', async () => {
      const { PrismaClient } = require('@prisma/client')
      const prisma = new PrismaClient()

      const mockUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
        password: 'hashedPassword',
        isActive: true,
      }
      prisma.user.findUnique.mockResolvedValue(mockUser)

      const loginData = {
        email: 'test@example.com',
        password: 'TestPass123!',
      }

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await LoginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.user.email).toBe('test@example.com')
      expect(data.data.accessToken).toBe('mock-access-token')

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      })
    })

    it('should reject login for invalid credentials', async () => {
      const { PrismaClient } = require('@prisma/client')
      const prisma = new PrismaClient()

      prisma.user.findUnique.mockResolvedValue(null)

      const loginData = {
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
      }

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await LoginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid credentials')
    })

    it('should reject login for inactive user', async () => {
      const { PrismaClient } = require('@prisma/client')
      const prisma = new PrismaClient()

      const inactiveUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
        isActive: false,
      }
      prisma.user.findUnique.mockResolvedValue(inactiveUser)

      const loginData = {
        email: 'test@example.com',
        password: 'TestPass123!',
      }

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await LoginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Account is deactivated')
    })
  })

  describe('User Authentication Verification', () => {
    it('should return user data for valid token', async () => {
      const { PrismaClient } = require('@prisma/client')
      const prisma = new PrismaClient()

      const mockUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
        isActive: true,
      }
      prisma.user.findUnique.mockResolvedValue(mockUser)

      const request = new NextRequest('http://localhost:3000/api/auth/me', {
        headers: {
          'Authorization': 'Bearer mock-access-token',
        },
      })

      const response = await MeHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.user.email).toBe('test@example.com')
    })

    it('should reject request without token', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/me')

      const response = await MeHandler(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toContain('No token provided')
    })

    it('should reject request with invalid token', async () => {
      const { verifyToken } = require('@/lib/auth/jwt')
      verifyToken.mockImplementation(() => {
        throw new Error('Invalid token')
      })

      const request = new NextRequest('http://localhost:3000/api/auth/me', {
        headers: {
          'Authorization': 'Bearer invalid-token',
        },
      })

      const response = await MeHandler(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid token')
    })
  })

  describe('Complete Authentication Flow', () => {
    it('should complete full registration -> login -> verification flow', async () => {
      const { PrismaClient } = require('@prisma/client')
      const prisma = new PrismaClient()

      // Step 1: Register
      prisma.user.findUnique.mockResolvedValue(null)
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
        createdAt: new Date(),
      }
      prisma.user.create.mockResolvedValue(mockUser)

      const registerData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'TestPass123!',
        name: 'Test User',
      }

      const registerRequest = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(registerData),
        headers: { 'Content-Type': 'application/json' },
      })

      const registerResponse = await RegisterHandler(registerRequest)
      expect(registerResponse.status).toBe(201)

      // Step 2: Login
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        password: 'hashedPassword',
        isActive: true,
      })

      const loginData = {
        email: 'test@example.com',
        password: 'TestPass123!',
      }

      const loginRequest = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginData),
        headers: { 'Content-Type': 'application/json' },
      })

      const loginResponse = await LoginHandler(loginRequest)
      expect(loginResponse.status).toBe(200)

      // Step 3: Verify authentication
      prisma.user.findUnique.mockResolvedValue(mockUser)

      const meRequest = new NextRequest('http://localhost:3000/api/auth/me', {
        headers: {
          'Authorization': 'Bearer mock-access-token',
        },
      })

      const meResponse = await MeHandler(meRequest)
      expect(meResponse.status).toBe(200)

      const meData = await meResponse.json()
      expect(meData.success).toBe(true)
      expect(meData.data.user.email).toBe('test@example.com')
    })
  })
})