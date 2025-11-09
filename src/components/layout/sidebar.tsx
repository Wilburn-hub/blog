'use client'

import Link from 'next/link'
import React from 'react'
import { Calendar, Tag, User, TrendingUp, Archive, BookOpen, Search } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { SearchInput } from '@/components/ui/search-input'
import { CoverImage } from '@/components/ui/cover-image'
import { PostWithRelations, CategoryWithPosts } from '@/types'

interface SidebarProps {
  recentPosts?: PostWithRelations[]
  categories?: CategoryWithPosts[]
  tags?: { name: string; count: number }[]
  popularPosts?: PostWithRelations[]
  showSearch?: boolean
  className?: string
}

export function Sidebar({
  recentPosts = [],
  categories = [],
  tags = [],
  popularPosts = [],
  showSearch = true,
  className,
}: SidebarProps) {
  return (
    <aside className={`space-y-6 ${className}`}>
      {/* Search */}
      {showSearch && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Search className="mr-2 h-5 w-5" />
              搜索
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SearchInput placeholder="搜索文章..." className="w-full" />
          </CardContent>
        </Card>
      )}

      {/* Author Card */}
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70">
              <User className="h-10 w-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-lg">Your Name</CardTitle>
          <p className="text-sm text-muted-foreground">全栈开发者 | 技术博主 | 开源爱好者</p>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-center text-sm text-muted-foreground">
            热爱编程，专注于Web开发、人工智能和用户体验设计。在这里分享我的技术心得和生活感悟。
          </p>
          <div className="flex justify-center space-x-2">
            <Badge variant="secondary">React</Badge>
            <Badge variant="secondary">Next.js</Badge>
            <Badge variant="secondary">TypeScript</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Recent Posts */}
      {recentPosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Calendar className="mr-2 h-5 w-5" />
              最新文章
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPosts.slice(0, 5).map((post, index) => (
                <div key={post.id}>
                  <Link href={`/posts/${post.slug}`} className="group block">
                    <h4 className="line-clamp-2 text-sm font-medium transition-colors group-hover:text-primary">
                      {post.title}
                    </h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(post.publishedAt || post.createdAt).toLocaleDateString('zh-CN')}
                    </p>
                  </Link>
                  {index < recentPosts.length - 1 && <Separator className="mt-3" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Popular Posts */}
      {popularPosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <TrendingUp className="mr-2 h-5 w-5" />
              热门文章
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {popularPosts.slice(0, 5).map((post, index) => (
                <div key={post.id} className="flex items-start space-x-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/posts/${post.slug}`} className="group block">
                      <h4 className="line-clamp-2 text-sm font-medium transition-colors group-hover:text-primary">
                        {post.title}
                      </h4>
                      <div className="mt-1 flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">
                          {post._count?.views || 0} 阅读
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {post._count?.likes || 0} 点赞
                        </span>
                      </div>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <BookOpen className="mr-2 h-5 w-5" />
              文章分类
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {categories.map(category => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-accent"
                >
                  <span className="text-sm font-medium">{category.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {category._count?.posts || 0}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Tag className="mr-2 h-5 w-5" />
              热门标签
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <Link key={tag.name} href={`/tags/${tag.name}`} className="group">
                  <Badge
                    variant="outline"
                    className="cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    {tag.name}
                    <span className="ml-1 text-xs opacity-60">({tag.count})</span>
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Archive */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Archive className="mr-2 h-5 w-5" />
            文章归档
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 6 }, (_, i) => {
              const date = new Date()
              date.setMonth(date.getMonth() - i)
              const monthYear = date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })
              return (
                <Link
                  key={i}
                  href={`/archive/${date.getFullYear()}/${date.getMonth() + 1}`}
                  className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-accent"
                >
                  <span className="text-sm font-medium">{monthYear}</span>
                  <Badge variant="secondary" className="text-xs">
                    {Math.floor(Math.random() * 10) + 1}
                  </Badge>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </aside>
  )
}
