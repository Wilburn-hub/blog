import { NextResponse } from 'next/server'

/**
 * 动态生成robots.txt
 *
 * 支持以下查询参数：
 * - format: 输出格式（txt/json）
 * - bot: 针对特定爬虫的规则（googlebot, bingbot等）
 *
 * 示例：
 * GET /robots.txt
 * GET /robots.txt?format=json
 * GET /robots.txt?bot=googlebot
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') || 'txt'
  const bot = searchParams.get('bot')?.toLowerCase()

  // 获取基础URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
                 process.env.VERCEL_URL ?
                 `https://${process.env.VERCEL_URL}` :
                 'http://localhost:3000'

  // 检查是否为开发环境
  const isDevelopment = process.env.NODE_ENV === 'development'

  // 生成robots.txt内容
  let robotsContent = generateRobotsContent(baseUrl, isDevelopment, bot)

  // 根据格式返回响应
  if (format === 'json') {
    const robotsJson = parseRobotsToJSON(robotsContent)
    return NextResponse.json({
      success: true,
      data: {
        ...robotsJson,
        baseUrl,
        environment: process.env.NODE_ENV,
        generatedAt: new Date().toISOString()
      }
    })
  }

  // 返回文本格式
  const response = new NextResponse(robotsContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': isDevelopment
        ? 'no-cache, no-store, must-revalidate'
        : 'public, max-age=86400, s-maxage=86400', // 24小时缓存
    }
  })

  return response
}

/**
 * 生成robots.txt内容
 */
function generateRobotsContent(baseUrl: string, isDevelopment: boolean, targetBot?: string): string {
  const currentDate = new Date().toISOString().split('T')[0]

  let content = `# robots.txt for ${baseUrl}
# Generated on ${currentDate}
# Environment: ${process.env.NODE_ENV}
#
# For more information about the robots.txt standard, see:
# https://developers.google.com/search/docs/advanced/robots/intro-to-robots-txt

`

  // 开发环境配置
  if (isDevelopment) {
    content += `# Development Environment - Block all crawlers
User-agent: *
Disallow: /

# Allow search engine crawlers for testing (remove in production)
User-agent: Googlebot
Disallow: /api/
Disallow: /admin/
Disallow: /dashboard/
Disallow: /_next/
Disallow: /favicon.ico

User-agent: Bingbot
Disallow: /api/
Disallow: /admin/
Disallow: /dashboard/
Disallow: /_next/

`
  } else {
    // 生产环境配置
    if (targetBot && targetBot !== 'all') {
      // 针对特定爬虫的规则
      content += `# Rules for ${targetBot}
User-agent: ${targetBot}
Allow: /
Allow: /posts/
Allow: /categories/
Allow: /tags/
Allow: /search
Allow: /about
Allow: /subscribe
Allow: /rss.xml
Allow: /feed.json
Allow: /sitemap.xml

# Disallow private areas
Disallow: /api/
Disallow: /admin/
Disallow: /dashboard/
Disallow: /auth/
Disallow: /profile/
Disallow: /_next/
Disallow: /favicon.ico
Disallow: /*.json$
Disallow: /api/*

# Crawl delay (optional, use with caution)
Crawl-delay: 1

# Additional rules for this bot
`

      // 特定爬虫的额外规则
      switch (targetBot) {
        case 'googlebot':
          content += `# Google-specific rules
Allow: /profile/*/posts  # Allow public user posts
Disallow: /profile/*/edit  # Disallow edit pages
Disallow: /profile/*/settings  # Disallow settings pages
`
          break
        case 'bingbot':
          content += `# Bing-specific rules
Allow: /profile/*/posts
Disallow: /profile/*/edit
`
          break
        case 'googlebot-image':
          content += `# Google Images specific rules
Allow: /images/
Allow: /uploads/
Allow: /*.jpg$
Allow: /*.jpeg$
Allow: /*.png$
Allow: /*.gif$
Allow: /*.webp$
`
          break
        case 'googlebot-news':
          content += `# Google News specific rules
Allow: /posts/
Allow: /categories/
Disallow: /tags/  # News typically doesn't index tag pages
`
          break
      }
    } else {
      // 通用规则
      content += `# General rules for all crawlers
User-agent: *
Allow: /
Allow: /posts/
Allow: /categories/
Allow: /tags/
Allow: /search
Allow: /about
Allow: /subscribe
Allow: /rss.xml
Allow: /feed.json
Allow: /sitemap.xml

# Disallow private areas
Disallow: /api/
Disallow: /admin/
Disallow: /dashboard/
Disallow: /auth/
Disallow: /profile/
Disallow: /_next/
Disallow: /favicon.ico
Disallow: /*.json$
Disallow: /api/*

# Disallow pagination pages beyond certain limit to prevent crawl budget waste
Disallow: /posts/?page=*
Disallow: /categories/*?page=*
Disallow: /tags/*?page=*

# Disallow search results and filter pages
Disallow: /search?q=*
Disallow: /search?tag=*
Disallow: /search?category=*

# Disallow temporary and session-based URLs
Disallow: /*?session=*
Disallow: /*?ref=*
Disallow: /*?utm_*
Disallow: /*?fbclid=*
Disallow: /*?gclid=*

# Crawl delay (optional - adjust based on your server capacity)
# Crawl-delay: 1

`
    }
  }

  // Sitemap位置
  if (!isDevelopment) {
    content += `# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/sitemap_index.xml

# Additional sitemaps (if you have multiple sitemaps)
# Sitemap: ${baseUrl}/sitemap-images.xml
# Sitemap: ${baseUrl}/sitemap-news.xml

`
  }

  // 添加额外的元数据
  content += `# Host directive (for Yandex)
Host: ${baseUrl}

# End of robots.txt
# Last updated: ${currentDate}
`

  return content
}

/**
 * 解析robots.txt为JSON格式
 */
function parseRobotsToJSON(robotsContent: string): {
  userAgent: Array<{
    name: string
    rules: Array<{
      type: 'allow' | 'disallow' | 'crawl-delay'
      path: string
    }>
  }>
  sitemaps: string[]
  host?: string
  comments: string[]
} {
  const lines = robotsContent.split('\n')
  const result = {
    userAgent: [] as Array<{ name: string; rules: Array<{ type: 'allow' | 'disallow' | 'crawl-delay'; path: string }> }>,
    sitemaps: [] as string[],
    host: undefined as string | undefined,
    comments: [] as string[]
  }

  let currentUserAgent = ''
  let currentRules: Array<{ type: 'allow' | 'disallow' | 'crawl-delay'; path: string }> = []

  for (const line of lines) {
    const trimmedLine = line.trim()

    // 跳过空行
    if (!trimmedLine) continue

    // 处理注释
    if (trimmedLine.startsWith('#')) {
      result.comments.push(trimmedLine)
      continue
    }

    // 处理User-agent
    if (trimmedLine.toLowerCase().startsWith('user-agent:')) {
      // 保存之前的user-agent规则
      if (currentUserAgent) {
        result.userAgent.push({
          name: currentUserAgent,
          rules: [...currentRules]
        })
      }

      currentUserAgent = trimmedLine.split(':')[1].trim()
      currentRules = []
      continue
    }

    // 处理Allow
    if (trimmedLine.toLowerCase().startsWith('allow:')) {
      const path = trimmedLine.split(':')[1].trim()
      currentRules.push({ type: 'allow', path })
      continue
    }

    // 处理Disallow
    if (trimmedLine.toLowerCase().startsWith('disallow:')) {
      const path = trimmedLine.split(':')[1].trim()
      currentRules.push({ type: 'disallow', path })
      continue
    }

    // 处理Crawl-delay
    if (trimmedLine.toLowerCase().startsWith('crawl-delay:')) {
      const delay = trimmedLine.split(':')[1].trim()
      currentRules.push({ type: 'crawl-delay', path: delay })
      continue
    }

    // 处理Sitemap
    if (trimmedLine.toLowerCase().startsWith('sitemap:')) {
      const sitemap = trimmedLine.split(':')[1].trim()
      result.sitemaps.push(sitemap)
      continue
    }

    // 处理Host
    if (trimmedLine.toLowerCase().startsWith('host:')) {
      result.host = trimmedLine.split(':')[1].trim()
      continue
    }
  }

  // 保存最后一个user-agent规则
  if (currentUserAgent) {
    result.userAgent.push({
      name: currentUserAgent,
      rules: [...currentRules]
    })
  }

  return result
}

/**
 * HEAD请求支持 - 允许爬虫检查robots.txt是否存在和更新时间
 */
export async function HEAD() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
                 process.env.VERCEL_URL ?
                 `https://${process.env.VERCEL_URL}` :
                 'http://localhost:3000'

  const isDevelopment = process.env.NODE_ENV === 'development'

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': isDevelopment
        ? 'no-cache, no-store, must-revalidate'
        : 'public, max-age=86400, s-maxage=86400',
      'X-Last-Modified': new Date().toISOString(),
      'X-Robots-Tag': 'noindex, nofollow' // 不要索引robots.txt文件本身
    }
  })
}

/**
 * 配置静态重新验证（如果使用ISR）
 */
export const revalidate = 86400 // 24小时重新验证一次

/**
 * 运行时配置
 */
export const runtime = 'nodejs' // 使用Node.js运行时以获得更好的性能