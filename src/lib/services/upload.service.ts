import { writeFile, mkdir } from 'fs/promises'
import { join, extname } from 'path'
import { existsSync } from 'fs'
import { nanoid } from 'nanoid'
import { prisma } from '../db/prisma'

export interface UploadOptions {
  directory?: string
  maxSize?: number // in bytes
  allowedTypes?: string[]
  generateThumbnail?: boolean
}

export interface UploadResult {
  id: string
  originalName: string
  filename: string
  mimetype: string
  size: number
  path: string
  url: string
  createdAt: Date
}

export class UploadService {
  private static readonly DEFAULT_MAX_SIZE = 5 * 1024 * 1024 // 5MB
  private static readonly DEFAULT_ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ]
  private static readonly UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')

  static async uploadFile(file: File, options: UploadOptions = {}): Promise<UploadResult> {
    const {
      directory = 'images',
      maxSize = this.DEFAULT_MAX_SIZE,
      allowedTypes = this.DEFAULT_ALLOWED_TYPES,
    } = options

    // Validate file
    this.validateFile(file, maxSize, allowedTypes)

    // Ensure upload directory exists
    const targetDir = join(this.UPLOAD_DIR, directory)
    await this.ensureDirectoryExists(targetDir)

    // Generate unique filename
    const fileExtension = extname(file.name)
    const filename = `${nanoid()}${fileExtension}`
    const filepath = join(targetDir, filename)

    // Convert file to buffer and save
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filepath, buffer)

    // Generate URL
    const url = `/uploads/${directory}/${filename}`

    // Save to database
    const fileRecord = await prisma.fileUpload.create({
      data: {
        originalName: file.name,
        filename,
        mimetype: file.type,
        size: file.size,
        path: filepath,
        url,
      },
    })

    return {
      id: fileRecord.id,
      originalName: fileRecord.originalName,
      filename: fileRecord.filename,
      mimetype: fileRecord.mimetype,
      size: fileRecord.size,
      path: fileRecord.path,
      url: fileRecord.url,
      createdAt: fileRecord.createdAt,
    }
  }

  static async uploadMultipleFiles(
    files: File[],
    options: UploadOptions = {}
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map(file => this.uploadFile(file, options))
    return Promise.all(uploadPromises)
  }

  static async getFileRecord(id: string) {
    return prisma.fileUpload.findUnique({
      where: { id },
    })
  }

  static async deleteFile(id: string): Promise<void> {
    const fileRecord = await this.getFileRecord(id)
    if (!fileRecord) {
      throw new Error('File not found')
    }

    // Delete from filesystem
    try {
      const fs = await import('fs/promises')
      await fs.unlink(fileRecord.path)
    } catch (error) {
      console.warn('Failed to delete file from filesystem:', error)
    }

    // Delete from database
    await prisma.fileUpload.delete({
      where: { id },
    })
  }

  static async getUserFiles(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit

    const [files, total] = await Promise.all([
      prisma.fileUpload.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.fileUpload.count(),
    ])

    return {
      files,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }

  static async getFilesByType(mimetype: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit

    const [files, total] = await Promise.all([
      prisma.fileUpload.findMany({
        where: { mimetype: { contains: mimetype } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.fileUpload.count({
        where: { mimetype: { contains: mimetype } },
      }),
    ])

    return {
      files,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }

  static async cleanupUnusedFiles(olderThanDays = 30) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    const unusedFiles = await prisma.fileUpload.findMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    })

    let deletedCount = 0

    for (const file of unusedFiles) {
      try {
        await this.deleteFile(file.id)
        deletedCount++
      } catch (error) {
        console.warn(`Failed to delete file ${file.id}:`, error)
      }
    }

    return {
      deletedCount,
      totalUnusedFiles: unusedFiles.length,
    }
  }

  static getFileInfo(file: File) {
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    }
  }

  static formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  static isImageFile(mimetype: string): boolean {
    return mimetype.startsWith('image/')
  }

  static getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
        })
        URL.revokeObjectURL(img.src)
      }
      img.onerror = () => {
        URL.revokeObjectURL(img.src)
        reject(new Error('Failed to load image'))
      }
      img.src = URL.createObjectURL(file)
    })
  }

  private static validateFile(file: File, maxSize: number, allowedTypes: string[]): void {
    // Check file size
    if (file.size > maxSize) {
      throw new Error(
        `File size ${this.formatFileSize(file.size)} exceeds maximum allowed size of ${this.formatFileSize(maxSize)}`
      )
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
      )
    }

    // Check file name
    if (!file.name || file.name.trim().length === 0) {
      throw new Error('File name is required')
    }

    // Check file extension
    const fileExtension = extname(file.name).toLowerCase()
    const allowedExtensions = allowedTypes
      .map(type => {
        switch (type) {
          case 'image/jpeg':
            return '.jpg'
          case 'image/png':
            return '.png'
          case 'image/gif':
            return '.gif'
          case 'image/webp':
            return '.webp'
          default:
            return ''
        }
      })
      .filter(Boolean)

    if (allowedExtensions.length > 0 && !allowedExtensions.includes(fileExtension)) {
      throw new Error(
        `File extension ${fileExtension} is not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`
      )
    }
  }

  private static async ensureDirectoryExists(dirPath: string): Promise<void> {
    if (!existsSync(dirPath)) {
      await mkdir(dirPath, { recursive: true })
    }
  }

  static generateFileUrl(filename: string, directory: string = 'images'): string {
    return `/uploads/${directory}/${filename}`
  }

  static async compressImage(file: File, quality: number = 0.8): Promise<Blob> {
    if (!this.isImageFile(file.type)) {
      throw new Error('File is not an image')
    }

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()

      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height

        ctx.drawImage(img, 0, 0)

        canvas.toBlob(
          blob => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to compress image'))
            }
            URL.revokeObjectURL(img.src)
          },
          file.type,
          quality
        )
      }

      img.onerror = () => {
        URL.revokeObjectURL(img.src)
        reject(new Error('Failed to load image for compression'))
      }

      img.src = URL.createObjectURL(file)
    })
  }
}
