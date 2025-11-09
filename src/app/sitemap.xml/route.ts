import { NextRequest, NextResponse } from 'next/server'
import { SitemapService } from '@/lib/services/sitemap.service'

/**
 * 动态生成sitemap.xml
 *
 * 支持以下查询参数：
 * - page: 分页页码（用于大型网站的sitemap分页）
 * - limit: 每页URL数量限制
 * - format: 输出格式（xml/json）
 *
 * 示例：
 * GET /sitemap.xml
 * GET /sitemap.xml?page=1&limit=1000
 * GET /sitemap.xml?format=json
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50000')
    const format = searchParams.get('format') || 'xml'

    // 获取基础URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
                   process.env.VERCEL_URL ?
                   `https://${process.env.VERCEL_URL}` :
                   'http://localhost:3000'

    // 多语言支持配置（可根据需要扩展）
    const alternateLanguages = [
      {
        lang: 'zh',
        baseUrl: baseUrl
      }
      // 可以添加更多语言
      // {
      //   lang: 'en',
      //   baseUrl: 'https://en.yourdomain.com'
      // }
    ]

    // 生成sitemap
    const sitemapOptions = {
      baseUrl,
      includePagination: true,
      maxPaginationPages: 10, // 限制分页数量以避免sitemap过大
      alternateLanguages
    }

    let sitemap: string

    // 检查是否需要分页
    const stats = await SitemapService.getSitemapStats()
    const totalUrls = stats.estimatedUrls

    if (totalUrls > 50000 && page === 1) {
      // 如果URL数量超过限制且是第一页，返回sitemap索引
      sitemap = await SitemapService.generateSitemapIndex(baseUrl)

      // 设置正确的Content-Type
      const response = new NextResponse(sitemap, {
        status: 200,
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1小时缓存
          'X-Total-URLs': totalUrls.toString(),
          'X-Sitemap-Type': 'index'
        }
      })

      return response
    } else if (totalUrls > 50000 && page > 1) {
      // 生成分页sitemap
      sitemap = await SitemapService.generatePaginatedSitemap(baseUrl, page, limit)
    } else {
      // 生成完整sitemap
      sitemap = await SitemapService.generateSitemap(sitemapOptions)
    }

    // 根据请求格式返回响应
    if (format === 'json') {
      const urls = parseSitemapToJSON(sitemap)
      return NextResponse.json({
        success: true,
        data: {
          urls,
          stats: {
            totalUrls: urls.length,
            generatedAt: new Date().toISOString(),
            page,
            totalPages: Math.ceil(totalUrls / limit)
          }
        }
      })
    }

    // 返回XML格式
    const response = new NextResponse(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1小时缓存
        'X-Total-URLs': totalUrls.toString(),
        'X-Sitemap-Type': 'full'
      }
    })

    return response

  } catch (error) {
    console.error('Error generating sitemap:', error)

    // 返回错误响应
    const errorXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`

    return new NextResponse(errorXml, {
      status: 500,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Error': 'Sitemap generation failed'
      }
    })
  }
}

/**
 * HEAD请求支持 - 允许爬虫检查sitemap是否存在和更新时间
 */
export async function HEAD(request: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
                   process.env.VERCEL_URL ?
                   `https://${process.env.VERCEL_URL}` :
                   'http://localhost:3000'

    const stats = await SitemapService.getSitemapStats()
    const totalUrls = stats.estimatedUrls

    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'X-Total-URLs': totalUrls.toString(),
        'X-Last-Modified': new Date().toISOString()
      }
    })

  } catch (error) {
    return new NextResponse(null, {
      status: 500,
      headers: {
        'X-Error': 'Sitemap check failed'
      }
    })
  }
}

/**
 * 解析sitemap XML为JSON格式（用于调试和API响应）
 */
function parseSitemapToJSON(sitemapXml: string): Array<{
  loc: string
  lastmod?: string
  changefreq?: string
  priority?: number
}> {
  const urlRegex = /<url>[\s\S]*?<\/url>/g
  const urls: Array<any> = []

  let match
  while ((match = urlRegex.exec(sitemapXml)) !== null) {
    const urlBlock = match[0]

    const loc = extractTagContent(urlBlock, 'loc')
    const lastmod = extractTagContent(urlBlock, 'lastmod')
    const changefreq = extractTagContent(urlBlock, 'changefreq')
    const priority = extractTagContent(urlBlock, 'priority')

    const urlData: any = { loc }

    if (lastmod) urlData.lastmod = lastmod
    if (changefreq) urlData.changefreq = changefreq
    if (priority) urlData.priority = parseFloat(priority)

    urls.push(urlData)
  }

  return urls
}

/**
 * 从XML标签中提取内容
 */
function extractTagContent(xml: string, tagName: string): string | undefined {
  const regex = new RegExp(`<${tagName}[^>]*>([^<]*)<\/${tagName}>`, 'i')
  const match = xml.match(regex)
  return match ? match[1].trim() : undefined
}

/**
 * 配置静态重新验证（如果使用ISR）
 */
export const revalidate = 3600 // 1小时重新验证一次

/**
 * 运行时配置
 */
export const runtime = 'nodejs' // 使用Node.js运行时以获得更好的性能