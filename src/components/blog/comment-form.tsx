'use client'

import React, { useState } from 'react'
import { MessageCircle, Send } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

interface CommentFormProps {
  postId: string
  parentId?: string
  onSubmit?: (content: string, parentId?: string) => Promise<void>
  onCancel?: () => void
  placeholder?: string
  submitText?: string
  user?: {
    name?: string
    email: string
    avatar?: string
  } | null
}

export function CommentForm({
  postId,
  parentId,
  onSubmit,
  onCancel,
  placeholder = '写下你的评论...',
  submitText = '发表评论',
  user,
}: CommentFormProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      toast({
        title: '评论不能为空',
        description: '请输入评论内容',
        variant: 'destructive',
      })
      return
    }

    if (!user) {
      toast({
        title: '请先登录',
        description: '登录后才能发表评论',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit?.(content, parentId)
      setContent('')
      toast({
        title: '评论发表成功',
        description: '感谢你的评论',
      })
    } catch (error) {
      toast({
        title: '发表失败',
        description: '评论发表失败，请重试',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatar || ''} alt={user?.name || user?.email || ''} />
            <AvatarFallback>
              {(user?.name || user?.email || 'A').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-medium">{user?.name || user?.email || '游客'}</div>
            {!user && <div className="text-xs text-muted-foreground">请先登录后再发表评论</div>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={placeholder}
            className="min-h-[100px] resize-none"
            disabled={!user || isSubmitting}
          />
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">支持 Markdown 语法</div>
            <div className="flex space-x-2">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  取消
                </Button>
              )}
              <Button type="submit" size="sm" disabled={!user || !content.trim() || isSubmitting}>
                {isSubmitting ? (
                  <>发表中...</>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {submitText}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
