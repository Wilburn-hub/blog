import { notFound, redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function BlogRedirectPage({ params }: PageProps) {
  const { slug } = await params

  // 重定向到正确的文章路由
  redirect(`/posts/${slug}`)
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params

  return {
    title: `重定向到文章`,
    description: '正在重定向到文章页面...',
  }
}