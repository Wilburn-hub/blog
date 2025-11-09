import { prisma } from '../db/prisma'
import { JWTService, TokenPair } from '../auth/jwt'
import { CacheService } from '../cache/redis'
import { nanoid } from 'nanoid'

export interface CreateUserData {
  email: string
  username: string
  password: string
  name: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export class UserService {
  static async createUser(userData: CreateUserData) {
    const hashedPassword = await JWTService.hashPassword(userData.password)

    const user = await prisma.user.create({
      data: {
        email: userData.email,
        username: userData.username,
        password: hashedPassword,
        name: userData.name,
        role: 'USER',
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    return user
  }

  static async getUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        password: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    })
  }

  static async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        bio: true,
        website: true,
        location: true,
        role: true,
        isActive: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }

  static async getUserByUsername(username: string) {
    return prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        bio: true,
        website: true,
        location: true,
        role: true,
        createdAt: true,
      },
    })
  }

  static async validateLogin(
    credentials: LoginCredentials
  ): Promise<{ user: any; tokens: TokenPair } | null> {
    const user = await this.getUserByEmail(credentials.email)

    if (!user || !user.isActive) {
      return null
    }

    const isPasswordValid = await JWTService.verifyPassword(credentials.password, user.password)

    if (!isPasswordValid) {
      return null
    }

    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    const tokens = JWTService.generateTokenPair({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    })

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken)

    const userResponse = {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    }

    return { user: userResponse, tokens }
  }

  static async storeRefreshToken(userId: string, refreshToken: string) {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    })
  }

  static async validateRefreshToken(refreshToken: string) {
    const decoded = JWTService.verifyRefreshToken(refreshToken)

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
            isActive: true,
          },
        },
      },
    })

    if (!storedToken || storedToken.expiresAt < new Date()) {
      // Clean up expired token
      if (storedToken) {
        await prisma.refreshToken.delete({
          where: { id: storedToken.id },
        })
      }
      throw new Error('Invalid or expired refresh token')
    }

    if (!storedToken.user.isActive) {
      throw new Error('User account is inactive')
    }

    return { user: storedToken.user, storedToken }
  }

  static async rotateRefreshToken(oldRefreshToken: string): Promise<TokenPair> {
    const { user } = await this.validateRefreshToken(oldRefreshToken)

    // Delete old refresh token
    await prisma.refreshToken.delete({
      where: { token: oldRefreshToken },
    })

    // Generate new tokens
    const newTokens = JWTService.generateTokenPair({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    })

    // Store new refresh token
    await this.storeRefreshToken(user.id, newTokens.refreshToken)

    return newTokens
  }

  static async logout(refreshToken: string) {
    await prisma.refreshToken.delete({
      where: { token: refreshToken },
    })
  }

  static async logoutAll(userId: string) {
    await prisma.refreshToken.deleteMany({
      where: { userId },
    })

    // Clear cache
    const cache = await CacheService.getInstance()
    await cache.invalidateUserCache(userId)
  }

  static async updateUserProfile(
    userId: string,
    data: Partial<{
      name: string
      bio: string
      website: string
      location: string
      avatar: string
    }>
  ) {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        bio: true,
        website: true,
        location: true,
        role: true,
        updatedAt: true,
      },
    })

    // Clear cache
    const cache = await CacheService.getInstance()
    await cache.invalidateUserCache(userId)

    return updatedUser
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    })

    if (!user) {
      throw new Error('User not found')
    }

    const isCurrentPasswordValid = await JWTService.verifyPassword(currentPassword, user.password)

    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect')
    }

    const hashedNewPassword = await JWTService.hashPassword(newPassword)

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    })

    // Logout all sessions
    await this.logoutAll(userId)
  }

  static async deleteUser(userId: string) {
    await prisma.user.delete({
      where: { id: userId },
    })
  }

  static async getUsersList(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { username: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          avatar: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ])

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }

  static async updateUserRole(userId: string, role: 'USER' | 'ADMIN') {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        updatedAt: true,
      },
    })

    // Clear cache
    const cache = await CacheService.getInstance()
    await cache.invalidateUserCache(userId)

    return updatedUser
  }

  static async toggleUserActive(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isActive: true },
    })

    if (!user) {
      throw new Error('User not found')
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    })

    // If deactivating user, logout all sessions
    if (!updatedUser.isActive) {
      await this.logoutAll(userId)
    }

    // Clear cache
    const cache = await CacheService.getInstance()
    await cache.invalidateUserCache(userId)

    return updatedUser
  }

  static async getUserStats(userId: string) {
    const [postsCount, commentsCount, likesCount] = await Promise.all([
      prisma.post.count({
        where: { authorId: userId },
      }),
      prisma.comment.count({
        where: { authorId: userId },
      }),
      prisma.like.count({
        where: { userId },
      }),
    ])

    return {
      postsCount,
      commentsCount,
      likesCount,
    }
  }
}
