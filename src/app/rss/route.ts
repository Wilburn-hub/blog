import { NextRequest, NextResponse } from 'next/server'
import { RSSService } from '@/lib/services/rss.service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // 获取查询参数
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    const category = searchParams.get('category') || undefined
    const tag = searchParams.get('tag') || undefined
    const author = searchParams.get('author') || undefined
    const featured = searchParams.get('featured') === 'true'

    // 记录访问
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    const params = new URLSearchParams(searchParams).toString()
    await RSSService.recordAccess('rss', params, ip)

    // 生成RSS Feed
    const rssFeed = await RSSService.generateRSSFeed({
      type: 'rss',
      limit,
      category,
      tag,
      author,
      featured
    })

    // 返回响应
    return new NextResponse(rssFeed, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=1800', // 30分钟缓存
        'X-RSS-Feed': 'Personal Blog RSS Feed',
        'X-RSS-Version': '2.0',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })
  } catch (error) {
    console.error('RSS Feed生成错误:', error)

    // 返回错误响应
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>RSS Feed 生成错误</title>
    <description>RSS Feed暂时无法生成，请稍后再试</description>
    <link>${process.env.NEXT_PUBLIC_BASE_URL || 'https://localhost:3000'}</link>
    <language>zh-cn</language>
    <item>
      <title>RSS Feed 错误</title>
      <description>RSS Feed生成失败，请稍后再试。错误信息: ${error instanceof Error ? error.message : '未知错误'}</description>
      <pubDate>${new Date().toUTCString()}</pubDate>
    </item>
  </channel>
</rss>`,
      {
        status: 500,
        headers: {
          'Content-Type': 'application/rss+xml; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
      }
    )
  }
}

// 支持HEAD请求以检查Feed是否可用
export async function HEAD(request: NextRequest) {
  try {
    // 检查RSS配置是否启用
    const config = await RSSService.getConfig()

    if (!config.enabled) {
      return new NextResponse(null, { status: 404 })
    }

    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=1800',
        'X-RSS-Feed': 'Personal Blog RSS Feed',
        'X-RSS-Version': '2.0',
      }
    })
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}

// OPTIONS请求支持CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    }
  })
}