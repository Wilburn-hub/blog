import Link from 'next/link'
import Image from 'next/image'
import React from 'react'
import { Calendar, Clock, Eye, Heart, MessageCircle, User, ArrowRight } from 'lucide-react'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { CoverImage } from '@/components/ui/cover-image'
import { PostWithRelations } from '@/types'
import { cn } from '@/lib/utils'

interface PostCardProps {
  post: PostWithRelations
  variant?: 'default' | 'featured' | 'compact'
  showAuthor?: boolean
  showExcerpt?: boolean
  className?: string
}

export function PostCard({
  post,
  variant = 'default',
  showAuthor = true,
  showExcerpt = true,
  className,
}: PostCardProps) {
  const isFeatured = variant === 'featured'
  const isCompact = variant === 'compact'

  const readingTime = Math.ceil((post.content?.length || 0) / 1000) // 假设每分钟1000字

  return (
    <Card
      className={cn(
        'group overflow-hidden border-0 shadow-sm transition-all duration-300 hover:shadow-lg',
        isFeatured && 'md:col-span-2 lg:col-span-3',
        isCompact && 'flex flex-row space-x-4 p-4',
        className
      )}
    >
      {/* Cover Image */}
      <div
        className={cn(
          isCompact ? 'h-24 w-24 flex-shrink-0' : 'relative',
          !isCompact && 'aspect-[16/9] w-full'
        )}
      >
        {post.coverImage ? (
          <Link href={`/posts/${post.slug}`}>
            <CoverImage
              src={post.coverImage}
              alt={post.title}
              width={isCompact ? 96 : 400}
              height={isCompact ? 96 : 225}
              className={cn(
                'object-cover transition-transform duration-300 group-hover:scale-105',
                isCompact && 'rounded-lg'
              )}
            />
          </Link>
        ) : (
          <div
            className={cn(
              'flex items-center justify-center bg-muted',
              isCompact ? 'h-24 w-24 rounded-lg' : 'aspect-[16/9] w-full'
            )}
          >
            <div className="text-4xl text-muted-foreground">📝</div>
          </div>
        )}

        {/* Featured badge */}
        {post.featured && (
          <div className="absolute left-4 top-4">
            <Badge variant="default" className="bg-primary text-primary-foreground">
              精选
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div
        className={cn('flex flex-col', !isCompact && 'p-6', isCompact && 'flex-1 justify-between')}
      >
        {/* Header */}
        <div className={cn(!isCompact && 'space-y-3')}>
          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {post.categories.map(category => (
              <Link key={category.id} href={`/categories/${category.slug}`}>
                <Badge
                  variant="secondary"
                  className="text-xs transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  {category.name}
                </Badge>
              </Link>
            ))}
          </div>

          {/* Title */}
          <Link href={`/posts/${post.slug}`}>
            <h3
              className={cn(
                'line-clamp-2 font-bold transition-colors group-hover:text-primary',
                isFeatured ? 'text-2xl md:text-3xl' : 'text-xl',
                isCompact && 'text-base'
              )}
            >
              {post.title}
            </h3>
          </Link>

          {/* Excerpt */}
          {showExcerpt && !isCompact && post.excerpt && (
            <p className="line-clamp-3 leading-relaxed text-muted-foreground">{post.excerpt}</p>
          )}
        </div>

        {/* Footer */}
        <div
          className={cn('flex items-center justify-between', !isCompact && 'mt-4 border-t pt-4')}
        >
          {/* Author and date */}
          <div className="flex items-center space-x-3">
            {showAuthor && post.author && (
              <div className="flex items-center space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={post.author.avatar || ''} alt={post.author.name || ''} />
                  <AvatarFallback className="text-xs">
                    {(post.author.name || post.author.email || 'A').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm text-muted-foreground sm:inline">
                  {post.author.name || post.author.email}
                </span>
              </div>
            )}
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                {new Date(post.publishedAt || post.createdAt).toLocaleDateString('zh-CN')}
              </span>
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{readingTime}分钟阅读</span>
            </div>
          </div>

          {/* Stats and actions */}
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Eye className="h-3 w-3" />
              <span>{post._count?.views || 0}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Heart className="h-3 w-3" />
              <span>{post._count?.likes || 0}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageCircle className="h-3 w-3" />
              <span>{post._count?.comments || 0}</span>
            </div>

            {!isCompact && (
              <Button variant="ghost" size="sm" className="ml-auto h-auto p-0 hover:bg-transparent">
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                <span className="sr-only">阅读更多</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
