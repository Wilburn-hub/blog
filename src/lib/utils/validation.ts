import { z } from 'zod'

// Common validation schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
})

export const searchSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(100),
  type: z.enum(['all', 'posts', 'users']).default('all'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
})

// User validation schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens'
    ),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  name: z.string().min(1, 'Name is required').max(50),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  website: z.string().url().optional().or(z.literal('')),
  location: z.string().max(100).optional(),
  avatar: z.string().url().optional().or(z.literal('')),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
})

// Post validation schemas
export const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().max(500).optional(),
  coverImage: z.string().url().optional().or(z.literal('')),
  tags: z.array(z.string().min(1).max(50)).max(10).optional(),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
  categoryIds: z.array(z.string()).optional(),
})

export const updatePostSchema = createPostSchema.partial()

export const publishPostSchema = z.object({
  published: z.boolean(),
  publishedAt: z.string().datetime().optional(),
})

// Comment validation schemas
export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(1000),
  postId: z.string().min(1, 'Post ID is required'),
  parentId: z.string().optional(),
})

export const updateCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(1000),
})

// File upload validation
export const fileUploadSchema = z.object({
  filename: z.string().min(1),
  mimetype: z.string().regex(/^image\/(jpeg|jpg|png|gif|webp)$/),
  size: z.number().max(5 * 1024 * 1024), // 5MB
})

// Category validation schemas
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50),
  slug: z
    .string()
    .min(1, 'Category slug is required')
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().max(200).optional(),
  color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .optional(),
})

// Search validation
export const postSearchSchema = z.object({
  q: z.string().min(1).max(100),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  author: z.string().optional(),
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  sort: z.enum(['latest', 'oldest', 'popular', 'views']).default('latest'),
})

// Notification validation
export const notificationSchema = z.object({
  title: z.string().min(1, 'Notification title is required').max(200),
  content: z.string().min(1, 'Notification content is required').max(1000),
  type: z.enum(['COMMENT', 'REPLY', 'LIKE', 'FOLLOW', 'SYSTEM']),
  userId: z.string().min(1, 'User ID is required'),
})

// Admin validation schemas
export const updateUserRoleSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum(['USER', 'ADMIN']),
})

export const bulkActionSchema = z.object({
  action: z.enum(['publish', 'unpublish', 'delete', 'feature']),
  itemIds: z.array(z.string()).min(1, 'At least one item is required'),
})

export const settingsSchema = z.object({
  blogTitle: z.string().min(1).max(100),
  blogDescription: z.string().max(500),
  postsPerPage: z.coerce.number().int().min(5).max(50),
  allowComments: z.boolean(),
  allowRegistration: z.boolean(),
  requireEmailVerification: z.boolean(),
  maintenanceMode: z.boolean(),
})

// Utility functions for validation
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data)
}

export function safeValidateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error }
}

export function formatZodError(error: z.ZodError): { field: string; message: string }[] {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
  }))
}

// Request validation helper for API routes
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return async (
    request: Request
  ): Promise<
    { success: true; data: T } | { success: false; error: { message: string; details?: any } }
  > => {
    try {
      const body = await request.json()
      const data = validateInput(schema, body)
      return { success: true, data }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: {
            message: 'Validation failed',
            details: formatZodError(error),
          },
        }
      }
      return {
        success: false,
        error: {
          message: 'Invalid request body',
        },
      }
    }
  }
}
