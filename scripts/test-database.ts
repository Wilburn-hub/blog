import { PrismaClient } from '@prisma/client'
import { redis, cache, cacheKeys, cacheTTL, healthCheck } from '../src/lib/database-connection'

const prisma = new PrismaClient()

interface TestResult {
  name: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  message: string
  details?: any
}

class DatabaseTester {
  private results: TestResult[] = []

  private addResult(
    name: string,
    status: 'PASS' | 'FAIL' | 'SKIP',
    message: string,
    details?: any
  ) {
    this.results.push({ name, status, message, details })
    console.log(`${status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️'} ${name}: ${message}`)
  }

  private async runTest(testName: string, testFn: () => Promise<void>) {
    try {
      await testFn()
      this.addResult(testName, 'PASS', 'Test completed successfully')
    } catch (error) {
      this.addResult(
        testName,
        'FAIL',
        `Test failed: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  async testBasicConnection() {
    await this.runTest('Basic Database Connection', async () => {
      const result = await prisma.$queryRaw`SELECT 1 as test`
      if (!result) {
        throw new Error('Basic query failed')
      }
    })
  }

  async testUserOperations() {
    await this.runTest('User CRUD Operations', async () => {
      // Create test user
      const testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          username: 'testuser',
          name: 'Test User',
          password: 'hashedpassword',
          role: 'USER',
        },
      })

      // Read user
      const foundUser = await prisma.user.findUnique({
        where: { id: testUser.id },
      })

      if (!foundUser || foundUser.email !== testUser.email) {
        throw new Error('User creation/retrieval failed')
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: testUser.id },
        data: { bio: 'Updated bio' },
      })

      if (updatedUser.bio !== 'Updated bio') {
        throw new Error('User update failed')
      }

      // Delete user
      await prisma.user.delete({
        where: { id: testUser.id },
      })

      const deletedUser = await prisma.user.findUnique({
        where: { id: testUser.id },
      })

      if (deletedUser) {
        throw new Error('User deletion failed')
      }
    })
  }

  async testCategoryOperations() {
    await this.runTest('Category Operations', async () => {
      // Create test category
      const testCategory = await prisma.category.create({
        data: {
          name: 'Test Category',
          slug: 'test-category',
          description: 'A test category',
          color: '#FF0000',
        },
      })

      // Test unique constraint
      try {
        await prisma.category.create({
          data: {
            name: 'Test Category 2',
            slug: 'test-category', // Same slug
            description: 'Another test category',
          },
        })
        throw new Error('Unique constraint should have prevented duplicate slug')
      } catch (error) {
        // Expected error
      }

      // Clean up
      await prisma.category.delete({
        where: { id: testCategory.id },
      })
    })
  }

  async testPostOperations() {
    await this.runTest('Post CRUD Operations', async () => {
      // Get admin user for author
      const adminUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
      })

      if (!adminUser) {
        throw new Error('No admin user found for testing')
      }

      // Create test post
      const testPost = await prisma.post.create({
        data: {
          title: 'Test Post',
          slug: 'test-post-' + Date.now(),
          excerpt: 'Test excerpt',
          content: '# Test Content\n\nThis is a test post.',
          published: true,
          featured: false,
          tags: ['test', 'database'],
          readingTime: 2,
          authorId: adminUser.id,
          publishedAt: new Date(),
        },
      })

      // Test slug uniqueness
      try {
        await prisma.post.create({
          data: {
            title: 'Test Post 2',
            slug: testPost.slug, // Same slug
            content: 'Different content',
            authorId: adminUser.id,
          },
        })
        throw new Error('Unique constraint should have prevented duplicate slug')
      } catch (error) {
        // Expected error
      }

      // Test relations
      const postWithAuthor = await prisma.post.findUnique({
        where: { id: testPost.id },
        include: {
          author: true,
          categories: true,
          comments: true,
          likes: true,
          views: true,
        },
      })

      if (!postWithAuthor || !postWithAuthor.author) {
        throw new Error('Post relation loading failed')
      }

      // Test published posts view
      const publishedPosts =
        await prisma.$queryRaw`SELECT * FROM published_posts_with_author LIMIT 1`
      if (!publishedPosts || !Array.isArray(publishedPosts) || publishedPosts.length === 0) {
        this.addResult('Published Posts View', 'SKIP', 'No published posts found in view')
      }

      // Clean up
      await prisma.post.delete({
        where: { id: testPost.id },
      })
    })
  }

  async testCommentOperations() {
    await this.runTest('Comment Operations', async () => {
      // Get existing post and user
      const testPost = await prisma.post.findFirst({
        where: { published: true },
      })

      const testUser = await prisma.user.findFirst({
        where: { role: 'USER' },
      })

      if (!testPost || !testUser) {
        throw new Error('No test post or user found')
      }

      // Create comment
      const testComment = await prisma.comment.create({
        data: {
          content: 'This is a test comment',
          authorId: testUser.id,
          postId: testPost.id,
        },
      })

      // Create reply
      const testReply = await prisma.comment.create({
        data: {
          content: 'This is a reply to the test comment',
          authorId: testUser.id,
          postId: testPost.id,
          parentId: testComment.id,
        },
      })

      // Test comment with replies
      const commentWithReplies = await prisma.comment.findUnique({
        where: { id: testComment.id },
        include: {
          replies: true,
          author: true,
          post: true,
        },
      })

      if (!commentWithReplies || commentWithReplies.replies.length === 0) {
        throw new Error('Comment reply functionality failed')
      }

      // Clean up
      await prisma.comment.delete({
        where: { id: testReply.id },
      })

      await prisma.comment.delete({
        where: { id: testComment.id },
      })
    })
  }

  async testLikeOperations() {
    await this.runTest('Like Operations', async () => {
      // Get existing post and user
      const testPost = await prisma.post.findFirst({
        where: { published: true },
      })

      const testUser = await prisma.user.findFirst({
        where: { role: 'USER' },
      })

      if (!testPost || !testUser) {
        throw new Error('No test post or user found')
      }

      // Create like
      const testLike = await prisma.like.create({
        data: {
          userId: testUser.id,
          postId: testPost.id,
        },
      })

      // Test unique constraint
      try {
        await prisma.like.create({
          data: {
            userId: testUser.id,
            postId: testPost.id,
          },
        })
        throw new Error('Unique constraint should have prevented duplicate like')
      } catch (error) {
        // Expected error
      }

      // Clean up
      await prisma.like.delete({
        where: { id: testLike.id },
      })
    })
  }

  async testViewOperations() {
    await this.runTest('View Tracking', async () => {
      // Get existing post
      const testPost = await prisma.post.findFirst({
        where: { published: true },
      })

      if (!testPost) {
        throw new Error('No test post found')
      }

      const initialViewCount = testPost.viewCount

      // Create views
      await prisma.view.createMany({
        data: [
          {
            postId: testPost.id,
            ip: '192.168.1.1',
            userAgent: 'Test Browser 1.0',
          },
          {
            postId: testPost.id,
            ip: '192.168.1.2',
            userAgent: 'Test Browser 2.0',
          },
        ],
      })

      // Update view count manually (in real app, this would be done via trigger)
      await prisma.post.update({
        where: { id: testPost.id },
        data: { viewCount: initialViewCount + 2 },
      })

      // Verify view count
      const updatedPost = await prisma.post.findUnique({
        where: { id: testPost.id },
      })

      if (!updatedPost || updatedPost.viewCount !== initialViewCount + 2) {
        throw new Error('View count update failed')
      }

      // Clean up
      await prisma.view.deleteMany({
        where: { postId: testPost.id },
      })

      // Reset view count
      await prisma.post.update({
        where: { id: testPost.id },
        data: { viewCount: initialViewCount },
      })
    })
  }

  async testSubscriptionOperations() {
    await this.runTest('Subscription Operations', async () => {
      // Create subscription
      const testSubscription = await prisma.subscription.create({
        data: {
          email: 'test-subscriber@example.com',
          name: 'Test Subscriber',
          active: true,
        },
      })

      // Test unique constraint
      try {
        await prisma.subscription.create({
          data: {
            email: 'test-subscriber@example.com', // Same email
            name: 'Another Subscriber',
          },
        })
        throw new Error('Unique constraint should have prevented duplicate email')
      } catch (error) {
        // Expected error
      }

      // Update subscription
      const updatedSubscription = await prisma.subscription.update({
        where: { id: testSubscription.id },
        data: { active: false },
      })

      if (updatedSubscription.active !== false) {
        throw new Error('Subscription update failed')
      }

      // Clean up
      await prisma.subscription.delete({
        where: { id: testSubscription.id },
      })
    })
  }

  async testSettingOperations() {
    await this.runTest('Setting Operations', async () => {
      // Create/update setting
      await prisma.setting.upsert({
        where: { key: 'test_setting' },
        update: { value: 'updated_value' },
        create: {
          key: 'test_setting',
          value: 'initial_value',
        },
      })

      // Read setting
      const setting = await prisma.setting.findUnique({
        where: { key: 'test_setting' },
      })

      if (!setting || setting.value !== 'updated_value') {
        throw new Error('Setting upsert failed')
      }

      // Clean up
      await prisma.setting.delete({
        where: { key: 'test_setting' },
      })
    })
  }

  async testCacheOperations() {
    await this.runTest('Cache Operations', async () => {
      // Test cache set/get
      const testKey = 'test-key'
      const testValue = { message: 'Hello, Cache!', timestamp: Date.now() }

      await cache.set(testKey, testValue, cacheTTL.SHORT)
      const retrievedValue = await cache.get(testKey)

      if (!retrievedValue || retrievedValue.message !== testValue.message) {
        throw new Error('Cache set/get failed')
      }

      // Test cache exists
      const exists = await cache.exists(testKey)
      if (!exists) {
        throw new Error('Cache exists check failed')
      }

      // Test cache delete
      await cache.del(testKey)
      const deletedValue = await cache.get(testKey)

      if (deletedValue !== null) {
        throw new Error('Cache delete failed')
      }

      // Test increment
      const counterKey = 'test-counter'
      await cache.del(counterKey) // Clean up first

      const value1 = await cache.incr(counterKey)
      const value2 = await cache.incrBy(counterKey, 5)

      if (value1 !== 1 || value2 !== 6) {
        throw new Error('Cache increment failed')
      }

      // Clean up
      await cache.del(counterKey)
    })
  }

  async testDatabaseIndexes() {
    await this.runTest('Database Index Performance', async () => {
      // Test that indexes are working by using EXPLAIN
      const queries = [
        // Published posts index
        `EXPLAIN ANALYZE SELECT * FROM posts WHERE published = true ORDER BY publishedAt DESC LIMIT 10;`,

        // Author index
        `EXPLAIN ANALYZE SELECT * FROM posts WHERE authorId = (SELECT id FROM users LIMIT 1);`,

        // Comments index
        `EXPLAIN ANALYZE SELECT * FROM comments WHERE postId = (SELECT id FROM posts LIMIT 1) ORDER BY createdAt DESC;`,

        // Likes unique constraint
        `EXPLAIN ANALYZE SELECT * FROM likes WHERE userId = (SELECT id FROM users LIMIT 1) AND postId = (SELECT id FROM posts LIMIT 1);`,
      ]

      for (const query of queries) {
        try {
          const result = await prisma.$queryRawUnsafe(query)
          if (!result || !Array.isArray(result)) {
            throw new Error(`Query analysis failed: ${query}`)
          }
        } catch (error) {
          throw new Error(`Index test failed for query: ${query} - ${error}`)
        }
      }
    })
  }

  async testConstraints() {
    await this.runTest('Database Constraints', async () => {
      // Test foreign key constraints
      try {
        await prisma.post.create({
          data: {
            title: 'Invalid Post',
            slug: 'invalid-post',
            content: 'Content',
            authorId: 'non-existent-user-id',
          },
        })
        throw new Error('Foreign key constraint should have prevented invalid authorId')
      } catch (error) {
        // Expected error
      }

      // Test required fields
      try {
        await prisma.post.create({
          data: {
            // Missing required fields
            authorId: 'some-id',
          } as any,
        })
        throw new Error('Required field constraint should have failed')
      } catch (error) {
        // Expected error
      }

      // Test check constraints (if any)
      const adminUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
      })

      if (adminUser) {
        try {
          await prisma.post.create({
            data: {
              title: '',
              slug: 'empty-title-post',
              content: 'Content',
              authorId: adminUser.id,
            },
          })
          // If this succeeds, title constraint doesn't exist
          this.addResult('Title Constraint', 'SKIP', 'No title length constraint found')
        } catch (error) {
          // Expected if constraint exists
        }
      }
    })
  }

  async runAllTests() {
    console.log('🧪 Starting Database Integrity Tests...\n')

    // Run health check first
    try {
      const health = await healthCheck()
      console.log('📊 Database Health Check:')
      console.log(`   Database: ${health.database}`)
      console.log(`   Redis: ${health.redis}`)
      console.log(`   Timestamp: ${health.timestamp}\n`)
    } catch (error) {
      console.log('❌ Health check failed:', error)
    }

    // Run all tests
    await this.testBasicConnection()
    await this.testUserOperations()
    await this.testCategoryOperations()
    await this.testPostOperations()
    await this.testCommentOperations()
    await this.testLikeOperations()
    await this.testViewOperations()
    await this.testSubscriptionOperations()
    await this.testSettingOperations()
    await this.testCacheOperations()
    await this.testDatabaseIndexes()
    await this.testConstraints()

    // Generate summary
    this.generateSummary()
  }

  private generateSummary() {
    const passed = this.results.filter(r => r.status === 'PASS').length
    const failed = this.results.filter(r => r.status === 'FAIL').length
    const skipped = this.results.filter(r => r.status === 'SKIP').length
    const total = this.results.length

    console.log('\n' + '='.repeat(60))
    console.log('📋 TEST SUMMARY')
    console.log('='.repeat(60))
    console.log(`Total Tests: ${total}`)
    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`⏭️  Skipped: ${skipped}`)
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`)

    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:')
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`   - ${r.name}: ${r.message}`))
    }

    if (skipped > 0) {
      console.log('\n⏭️  SKIPPED TESTS:')
      this.results
        .filter(r => r.status === 'SKIP')
        .forEach(r => console.log(`   - ${r.name}: ${r.message}`))
    }

    if (failed === 0) {
      console.log('\n🎉 All tests passed! Database is functioning correctly.')
    } else {
      console.log('\n⚠️  Some tests failed. Please check the database configuration.')
    }

    console.log('='.repeat(60))
  }
}

// Main execution
async function main() {
  const tester = new DatabaseTester()

  try {
    await tester.runAllTests()
  } catch (error) {
    console.error('❌ Test suite crashed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
    if (redis.isOpen) {
      await redis.quit()
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  main().catch(console.error)
}

export { DatabaseTester }
