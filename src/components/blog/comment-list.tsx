'use client'

import React, { useState } from 'react'
import { MessageCircle, ThumbsUp, MoreHorizontal, Reply } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CommentForm } from './comment-form'
import { CommentWithAuthor } from '@/types'

interface CommentListProps {
  comments: CommentWithAuthor[]
  postId: string
  onCommentSubmit?: (content: string, parentId?: string) => Promise<void>
  onCommentDelete?: (commentId: string) => Promise<void>
  onCommentLike?: (commentId: string) => Promise<void>
  currentUser?: {
    id: string
    name?: string
    email: string
    avatar?: string
  } | null
}

export function CommentList({
  comments,
  postId,
  onCommentSubmit,
  onCommentDelete,
  onCommentLike,
  currentUser,
}: CommentListProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [isLiking, setIsLiking] = useState<Record<string, boolean>>({})

  const handleReply = (commentId: string) => {
    setReplyingTo(replyingTo === commentId ? null : commentId)
  }

  const handleLike = async (commentId: string) => {
    if (isLiking[commentId] || !currentUser) return

    setIsLiking(prev => ({ ...prev, [commentId]: true }))
    try {
      await onCommentLike?.(commentId)
    } catch (error) {
      console.error('Failed to like comment:', error)
    } finally {
      setIsLiking(prev => ({ ...prev, [commentId]: false }))
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 30) return `${days}天前`

    return new Date(date).toLocaleDateString('zh-CN')
  }

  const CommentItem = ({ comment, level = 0 }: { comment: CommentWithAuthor; level?: number }) => {
    const isAuthor = comment.author.id === currentUser?.id
    const maxLevel = 3 // 最大嵌套层级

    return (
      <div className={`${level > 0 ? 'ml-8 mt-4' : 'mt-6'}`}>
        <Card className="border-border/50">
          <CardContent className="p-4">
            {/* Comment Header */}
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={comment.author.avatar || ''}
                    alt={comment.author.name || comment.author.email}
                  />
                  <AvatarFallback>
                    {(comment.author.name || comment.author.email).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">
                      {comment.author.name || comment.author.email}
                    </span>
                    {isAuthor && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        作者
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatTime(comment.createdAt)}
                    {comment.updatedAt.getTime() !== comment.createdAt.getTime() && ' (已编辑)'}
                  </div>
                </div>
              </div>

              {/* Comment Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">更多操作</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {currentUser && (
                    <DropdownMenuItem onClick={() => handleReply(comment.id)}>
                      <Reply className="mr-2 h-4 w-4" />
                      回复
                    </DropdownMenuItem>
                  )}
                  {isAuthor && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => onCommentDelete?.(comment.id)}
                      >
                        删除
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Comment Content */}
            <div className="prose prose-sm mb-3 max-w-none">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{comment.content}</div>
            </div>

            {/* Comment Actions */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLike(comment.id)}
                disabled={!currentUser || isLiking[comment.id]}
                className="h-8 px-2 text-muted-foreground hover:text-foreground"
              >
                <ThumbsUp
                  className={`mr-1 h-4 w-4 ${isLiking[comment.id] ? 'animate-pulse' : ''}`}
                />
                <span className="text-xs">{comment.likes?.length || 0}</span>
              </Button>

              {currentUser && level < maxLevel && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReply(comment.id)}
                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                >
                  <Reply className="mr-1 h-4 w-4" />
                  <span className="text-xs">回复</span>
                </Button>
              )}
            </div>

            {/* Reply Form */}
            {replyingTo === comment.id && (
              <div className="mt-4">
                <CommentForm
                  postId={postId}
                  parentId={comment.id}
                  onSubmit={onCommentSubmit}
                  onCancel={() => setReplyingTo(null)}
                  placeholder={`回复 @${comment.author.name || comment.author.email}...`}
                  submitText="回复"
                  user={currentUser}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-4">
            {comment.replies.map(reply => (
              <CommentItem key={reply.id} comment={reply} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  if (comments.length === 0) {
    return (
      <div className="py-12 text-center">
        <MessageCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
        <p className="text-muted-foreground">暂无评论，来发表第一个评论吧！</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {comments.map(comment => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </div>
  )
}
