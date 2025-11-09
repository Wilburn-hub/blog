import {
  registerSchema,
  loginSchema,
  createPostSchema,
  createCommentSchema,
  validateInput,
  safeValidateInput,
  formatZodError,
} from '../validation'

describe('Validation Schemas', () => {
  describe('registerSchema', () => {
    it('should validate a valid registration input', () => {
      const validInput = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'TestPass123!',
        name: 'Test User',
      }

      const result = validateInput(registerSchema, validInput)
      expect(result).toEqual(validInput)
    })

    it('should reject invalid email', () => {
      const invalidInput = {
        email: 'invalid-email',
        username: 'testuser',
        password: 'TestPass123!',
        name: 'Test User',
      }

      expect(() => validateInput(registerSchema, invalidInput)).toThrow()
    })

    it('should reject weak password', () => {
      const invalidInput = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'weak',
        name: 'Test User',
      }

      expect(() => validateInput(registerSchema, invalidInput)).toThrow()
    })

    it('should reject username that is too short', () => {
      const invalidInput = {
        email: 'test@example.com',
        username: 'ab',
        password: 'TestPass123!',
        name: 'Test User',
      }

      expect(() => validateInput(registerSchema, invalidInput)).toThrow()
    })
  })

  describe('loginSchema', () => {
    it('should validate a valid login input', () => {
      const validInput = {
        email: 'test@example.com',
        password: 'password123',
      }

      const result = validateInput(loginSchema, validInput)
      expect(result).toEqual(validInput)
    })

    it('should reject empty password', () => {
      const invalidInput = {
        email: 'test@example.com',
        password: '',
      }

      expect(() => validateInput(loginSchema, invalidInput)).toThrow()
    })
  })

  describe('createPostSchema', () => {
    it('should validate a valid post input', () => {
      const validInput = {
        title: 'Test Post Title',
        content: 'This is test content with enough length.',
        excerpt: 'Test excerpt',
        tags: ['test', 'post'],
        featured: false,
        published: true,
      }

      const result = validateInput(createPostSchema, validInput)
      expect(result).toEqual(validInput)
    })

    it('should reject empty title', () => {
      const invalidInput = {
        title: '',
        content: 'Content here',
      }

      expect(() => validateInput(createPostSchema, invalidInput)).toThrow()
    })
  })

  describe('createCommentSchema', () => {
    it('should validate a valid comment input', () => {
      const validInput = {
        content: 'This is a test comment.',
        postId: 'post-id-123',
      }

      const result = validateInput(createCommentSchema, validInput)
      expect(result).toEqual(validInput)
    })

    it('should reject empty comment content', () => {
      const invalidInput = {
        content: '',
        postId: 'post-id-123',
      }

      expect(() => validateInput(createCommentSchema, invalidInput)).toThrow()
    })
  })
})

describe('Validation Utility Functions', () => {
  describe('validateInput', () => {
    it('should throw error for invalid data', () => {
      const schema = registerSchema
      const invalidData = {
        email: 'invalid-email',
        username: 'testuser',
        password: 'TestPass123!',
        name: 'Test User',
      }

      expect(() => validateInput(schema, invalidData)).toThrow()
    })
  })

  describe('safeValidateInput', () => {
    it('should return success: true for valid data', () => {
      const schema = registerSchema
      const validData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'TestPass123!',
        name: 'Test User',
      }

      const result = safeValidateInput(schema, validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should return success: false for invalid data', () => {
      const schema = registerSchema
      const invalidData = {
        email: 'invalid-email',
        username: 'testuser',
        password: 'TestPass123!',
        name: 'Test User',
      }

      const result = safeValidateInput(schema, invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeDefined()
      }
    })
  })

  describe('formatZodError', () => {
    it('should format Zod error into readable format', () => {
      const schema = registerSchema
      const invalidData = {
        email: 'invalid-email',
        username: 'testuser',
        password: 'TestPass123!',
        name: 'Test User',
      }

      try {
        validateInput(schema, invalidData)
      } catch (error) {
        const formattedError = formatZodError(error as any)
        expect(Array.isArray(formattedError)).toBe(true)
        expect(formattedError[0]).toHaveProperty('field')
        expect(formattedError[0]).toHaveProperty('message')
      }
    })
  })
})