import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PostService } from '@/lib/services/post.service'
import { TagDetailPage } from '@/components/pages/tag-detail-page'
import { TagWithPosts } from '@/types'

interface TagPageProps {
  params: {
    tag: string
  }
  searchParams: {
    page?: string
  }
}

// 生成页面元数据
export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { tag } = params
  const formattedTagName = decodeURIComponent(tag).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

  try {
    const tagData = await PostService.getPostsByTag(tag, 1, 1)

    if (!tagData || tagData.posts.length === 0) {
      return {
        title: `${formattedTagName} - 标签未找到`,
        description: `未找到标签 "${formattedTagName}" 相关的文章`,
      }
    }

    const postCount = tagData.pagination.total
    const latestPost = tagData.posts[0]

    return {
      title: `${formattedTagName} - 博客标签`,
      description: `浏览标签 "${formattedTagName}" 下的 ${postCount} 篇文章。最新文章：${latestPost.title}`,
      keywords: [formattedTagName, '博客', '文章', '标签'],
      openGraph: {
        title: `${formattedTagName} - 博客标签`,
        description: `浏览标签 "${formattedTagName}" 下的 ${postCount} 篇文章`,
        type: 'website',
        url: `/tags/${encodeURIComponent(tag)}`,
      },
      twitter: {
        card: 'summary',
        title: `${formattedTagName} - 博客标签`,
        description: `浏览标签 "${formattedTagName}" 下的 ${postCount} 篇文章`,
      },
      alternates: {
        canonical: `/tags/${encodeURIComponent(tag)}`,
      },
    }
  } catch (error) {
    console.error('Error generating metadata for tag:', error)
    return {
      title: `${formattedTagName} - 博客标签`,
      description: `浏览标签 "${formattedTagName}" 下的文章`,
    }
  }
}

// 获取标签数据
async function getTagData(tag: string, page: number = 1): Promise<TagWithPosts | null> {
  try {
    const tagData = await PostService.getPostsByTag(tag, page, 12)

    if (!tagData || tagData.posts.length === 0) {
      return null
    }

    // 计算标签统计信息
    const allTags = await PostService.getAllTags()
    const tagInfo = allTags.find(t => t.name.toLowerCase() === tag.toLowerCase())

    return {
      name: tag,
      count: tagInfo?.count || tagData.pagination.total,
      posts: tagData.posts,
      pagination: tagData.pagination,
    }
  } catch (error) {
    console.error('Error fetching tag data:', error)
    return null
  }
}

// 页面组件
export default async function TagPage({ params, searchParams }: TagPageProps) {
  const { tag } = params
  const page = parseInt(searchParams.page || '1')

  // 获取标签数据
  const tagData = await getTagData(tag, page)

  // 如果标签不存在，返回404
  if (!tagData) {
    notFound()
  }

  return <TagDetailPage tag={tag} initialData={tagData} />
}

// 生成静态路径（可选，用于静态生成）
export async function generateStaticParams() {
  try {
    const tags = await PostService.getAllTags()

    // 只生成前20个热门标签的静态路径
    return tags.slice(0, 20).map((tag) => ({
      tag: encodeURIComponent(tag.name.toLowerCase().replace(/\s+/g, '-')),
    }))
  } catch (error) {
    console.error('Error generating static params for tags:', error)
    return []
  }
}

// 设置重新验证时间（5分钟）
export const revalidate = 300