'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Search, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  const handleGoBack = () => {
    window.history.back()
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        {/* 404 图标 */}
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center">
          <span className="text-4xl font-bold text-muted-foreground">404</span>
        </div>

        {/* 标题和描述 */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">页面未找到</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            抱歉，您访问的页面不存在。可能是链接错误或页面已被删除。
          </p>
        </div>

        {/* 可能的原因 */}
        <div className="bg-muted/50 rounded-lg p-4 max-w-md mx-auto">
          <h3 className="font-medium mb-2">可能的原因：</h3>
          <ul className="text-sm text-muted-foreground space-y-1 text-left">
            <li>• URL 地址输入错误</li>
            <li>• 页面链接已失效</li>
            <li>• 页面已被移动或删除</li>
            <li>• 您没有访问此页面的权限</li>
          </ul>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              返回首页
            </Link>
          </Button>

          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/posts" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              浏览文章
            </Link>
          </Button>
        </div>

        {/* 返回上一步 */}
        <Button
          variant="ghost"
          onClick={handleGoBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          返回上一步
        </Button>
      </div>
    </div>
  )
}