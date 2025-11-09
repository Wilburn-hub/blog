import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Adding additional seed data...')

  // Create regular users
  const hashedPassword = await bcrypt.hash('user123', 10)

  const user1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      username: 'johndoe',
      name: 'John Doe',
      bio: 'Tech enthusiast and blogger',
      password: hashedPassword,
      role: 'USER',
    },
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'jane@example.com' },
    update: {},
    create: {
      email: 'jane@example.com',
      username: 'janesmith',
      name: 'Jane Smith',
      bio: 'Web developer and designer',
      password: hashedPassword,
      role: 'USER',
    },
  })

  console.log('✅ Created regular users')

  // Get posts
  const posts = await prisma.post.findMany({
    where: { published: true },
  })

  // Add comments
  const comments = [
    {
      content: 'Great post! I really enjoyed reading about your development workflow.',
      authorId: user1.id,
      postId: posts[0].id,
    },
    {
      content: 'This is exactly what I was looking for! Thanks for sharing.',
      authorId: user2.id,
      postId: posts[0].id,
    },
    {
      content:
        'The Next.js tutorial was very helpful. Do you have any tips for optimizing performance?',
      authorId: user1.id,
      postId: posts[1].id,
    },
    {
      content: "I've been using Next.js for a while and this approach works great!",
      authorId: user2.id,
      postId: posts[1].id,
      parentId: null, // This will be a reply
    },
  ]

  for (const comment of comments) {
    await prisma.comment.create({
      data: comment,
    })
  }

  console.log('✅ Created comments')

  // Add likes
  const likes = [
    { userId: user1.id, postId: posts[0].id },
    { userId: user2.id, postId: posts[0].id },
    { userId: user1.id, postId: posts[1].id },
  ]

  for (const like of likes) {
    try {
      await prisma.like.create({
        data: like,
      })
    } catch (error) {
      // Ignore duplicate errors
      console.log('Like already exists')
    }
  }

  console.log('✅ Created likes')

  // Add views
  const views = [
    {
      postId: posts[0].id,
      ip: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    },
    {
      postId: posts[0].id,
      ip: '192.168.1.2',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
    {
      postId: posts[1].id,
      ip: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    },
    { postId: posts[1].id, ip: '192.168.1.3', userAgent: 'Mozilla/5.0 (X11; Linux x86_64)' },
  ]

  for (const view of views) {
    await prisma.view.create({
      data: view,
    })
  }

  console.log('✅ Created views')

  // Update post view counts
  await prisma.post.update({
    where: { id: posts[0].id },
    data: { viewCount: 2 },
  })

  await prisma.post.update({
    where: { id: posts[1].id },
    data: { viewCount: 2 },
  })

  console.log('✅ Updated view counts')

  // Create comment replies
  const firstComment = await prisma.comment.findFirst({
    where: { postId: posts[1].id, authorId: user2.id },
  })

  if (firstComment) {
    await prisma.comment.create({
      data: {
        content:
          'For performance, I recommend using Next.js Image optimization and implementing proper caching strategies.',
        authorId: user1.id,
        postId: posts[1].id,
        parentId: firstComment.id,
      },
    })
  }

  console.log('✅ Created comment replies')

  // Create subscriptions
  await prisma.subscription.createMany({
    data: [
      { email: 'subscriber1@example.com', name: 'Alice' },
      { email: 'subscriber2@example.com', name: 'Bob' },
      { email: 'subscriber3@example.com', name: 'Charlie' },
    ],
    skipDuplicates: true,
  })

  console.log('✅ Created subscriptions')

  console.log('🎉 Additional seed data completed successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async e => {
    console.error('❌ Error during additional seeding:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
