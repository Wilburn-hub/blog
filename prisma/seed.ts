import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create a default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      username: 'admin',
      name: 'Admin User',
      bio: 'Blog administrator',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log('✅ Created admin user:', adminUser)

  // Create sample categories if they don't exist
  const categories = [
    {
      name: 'Technology',
      slug: 'technology',
      description: 'Posts about technology and programming',
      color: '#3b82f6',
    },
    {
      name: 'Lifestyle',
      slug: 'lifestyle',
      description: 'Posts about lifestyle and personal thoughts',
      color: '#10b981',
    },
    {
      name: 'Travel',
      slug: 'travel',
      description: 'Travel experiences and stories',
      color: '#f59e0b',
    },
    {
      name: 'Tutorial',
      slug: 'tutorial',
      description: 'Step-by-step guides and tutorials',
      color: '#8b5cf6',
    },
    {
      name: 'Opinion',
      slug: 'opinion',
      description: 'Personal opinions and thoughts',
      color: '#ef4444',
    },
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    })
  }

  console.log('✅ Created default categories')

  // Create sample posts
  const samplePosts = [
    {
      title: 'Welcome to My Blog',
      slug: 'welcome-to-my-blog',
      excerpt: 'This is the first post on my personal blog. Welcome!',
      content: `# Welcome to My Blog

This is the first post on my personal blog built with Next.js, TypeScript, and Tailwind CSS.

## Features

- Modern UI with Tailwind CSS
- TypeScript for type safety
- Prisma for database management
- Authentication with NextAuth
- Responsive design

## Getting Started

This blog is designed to be fast, secure, and easy to maintain. It uses the latest web technologies to provide the best user experience.

Thank you for visiting!`,
      published: true,
      featured: true,
      tags: ['welcome', 'intro', 'blog'],
      readingTime: 2,
    },
    {
      title: 'Building a Modern Blog with Next.js',
      slug: 'building-modern-blog-nextjs',
      excerpt: 'Learn how to build a modern, fast, and SEO-friendly blog using Next.js 14.',
      content: `# Building a Modern Blog with Next.js

In this post, I'll share my experience building this blog using Next.js 14 and other modern technologies.

## Technology Stack

### Frontend
- Next.js 14 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Shadcn/ui components

### Backend
- Next.js API routes
- Prisma ORM
- PostgreSQL database
- Redis for caching

## Why Next.js?

Next.js provides several advantages for a blog:

1. **SSG/SSR**: Great for SEO and performance
2. **Image Optimization**: Automatic image optimization
3. **API Routes**: Backend functionality included
4. **TypeScript**: Built-in support

## Conclusion

Building a blog with Next.js has been a great experience. The framework provides all the tools needed to create a fast, modern, and maintainable blog.`,
      published: true,
      featured: true,
      tags: ['nextjs', 'tutorial', 'webdev'],
      readingTime: 5,
    },
    {
      title: 'My Development Workflow',
      slug: 'my-development-workflow',
      excerpt: 'A look at my current development workflow and the tools I use daily.',
      content: `# My Development Workflow

Today I want to share my current development workflow and the tools that help me stay productive.

## Essential Tools

### Code Editor
- VS Code with extensions
- Custom keybindings
- Integrated terminal

### Version Control
- Git with GitHub
- Conventional commits
- Pull request workflow

### Development Environment
- Docker for containerization
- Node.js for JavaScript/TypeScript
- Database tools

## Workflow Process

1. **Planning**: Define requirements and architecture
2. **Development**: Write code with TDD approach
3. **Testing**: Unit tests and integration tests
4. **Review**: Code review and refactoring
5. **Deployment**: CI/CD pipeline

This workflow helps me maintain code quality and deliver features efficiently.`,
      published: false,
      featured: false,
      tags: ['workflow', 'tools', 'productivity'],
      readingTime: 4,
    },
  ]

  for (const post of samplePosts) {
    await prisma.post.upsert({
      where: { slug: post.slug },
      update: {},
      create: {
        ...post,
        authorId: adminUser.id,
        publishedAt: post.published ? new Date() : null,
        categories: {
          connect: [{ slug: 'tutorial' }, { slug: 'technology' }],
        },
      },
    })
  }

  console.log('✅ Created sample posts')

  // Create default settings
  const defaultSettings = [
    { key: 'site_name', value: 'Personal Blog' },
    { key: 'site_description', value: 'A modern personal blog built with Next.js' },
    { key: 'site_author', value: 'Admin User' },
    { key: 'site_url', value: 'http://localhost:3000' },
    { key: 'contact_email', value: 'admin@example.com' },
    { key: 'posts_per_page', value: '10' },
    { key: 'enable_comments', value: 'true' },
    { key: 'enable_subscriptions', value: 'true' },
  ]

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    })
  }

  console.log('✅ Created default settings')
  console.log('🎉 Database seeding completed successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async e => {
    console.error('❌ Error during seeding:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
