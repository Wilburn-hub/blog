import { Metadata } from 'next'
import Link from 'next/link'
import { Plus, Folder, Settings, BarChart3 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CategoryService } from '@/lib/services/category.service'

/**
 * 生成分类管理页面的metadata
 */
export const metadata: Metadata = {
  title: '分类管理 - 控制台',
  description: '管理博客分类，包括创建、编辑和删除分类',
}

/**
 * 分类管理页面
 * 显示分类列表和管理选项
 */
export default async function CategoriesManagementPage() {
  try {
    // 获取分类列表和统计信息
    const [categoriesResult, stats] = await Promise.all([
      CategoryService.getCategories({
        limit: 50,
        sort: 'createdAt',
        sortOrder: 'desc',
        includeEmpty: true, // 包含空分类
      }),
      CategoryService.getCategoryStats(),
    ])

    const categories = categoriesResult.categories

    return (
      <div className="container mx-auto px-4 py-8">
        {/* 页面头部 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">分类管理</h1>
            <p className="mt-2 text-muted-foreground">
              管理博客分类，创建新的分类或编辑现有分类
            </p>
          </div>
          <Link href="/dashboard/categories/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新建分类
            </Button>
          </Link>
        </div>

        {/* 统计卡片 */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总分类数</CardTitle>
              <Folder className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCategories}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.categoriesWithPosts} 个有文章
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总文章数</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPostsInCategories}</div>
              <p className="text-xs text-muted-foreground">
                平均 {stats.avgPostsPerCategory} 篇/分类
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">活跃分类</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.categoriesWithPosts}</div>
              <p className="text-xs text-muted-foreground">
                有发布文章的分类
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">空分类</CardTitle>
              <Folder className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalCategories - stats.categoriesWithPosts}
              </div>
              <p className="text-xs text-muted-foreground">
                无文章的分类
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 分类列表 */}
        <Card>
          <CardHeader>
            <CardTitle>所有分类</CardTitle>
            <CardDescription>
              管理您的所有分类，包括编辑和删除操作
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categories.length > 0 ? (
              <div className="space-y-4">
                {categories.map((category: any) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center space-x-4">
                      {/* 分类图标 */}
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          category.color ? 'bg-primary/10' : 'bg-muted'
                        }`}
                      >
                        {category.icon ? (
                          <span
                            className={`text-lg ${
                              category.color ? 'text-primary' : 'text-muted-foreground'
                            }`}
                          >
                            {category.icon}
                          </span>
                        ) : (
                          <Folder
                            className={`h-5 w-5 ${
                              category.color ? 'text-primary' : 'text-muted-foreground'
                            }`}
                          />
                        )}
                      </div>

                      {/* 分类信息 */}
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{category.name}</h3>
                          {category._count.posts === 0 && (
                            <Badge variant="secondary" className="text-xs">
                              空
                            </Badge>
                          )}
                        </div>
                        {category.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {category.description}
                          </p>
                        )}
                        <div className="mt-1 flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>Slug: {category.slug}</span>
                          <span>文章: {category._count.posts}</span>
                          <span>创建: {new Date(category.createdAt).toLocaleDateString('zh-CN')}</span>
                        </div>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center space-x-2">
                      <Link href={`/categories/${category.slug}`} target="_blank">
                        <Button variant="outline" size="sm">
                          查看
                        </Button>
                      </Link>
                      <Link href={`/dashboard/categories/${category.id}/edit`}>
                        <Button variant="outline" size="sm">
                          编辑
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        // TODO: 实现删除功能
                        disabled
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Folder className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">暂无分类</h3>
                <p className="text-muted-foreground mb-4">
                  您还没有创建任何分类
                </p>
                <Link href="/dashboard/categories/create">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    创建第一个分类
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  } catch (error) {
    console.error('Error loading categories management page:', error)

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-destructive">加载失败</h1>
          <p className="mb-8 text-muted-foreground">
            无法加载分类管理页面，请稍后重试
          </p>
          <Link href="/dashboard">
            <Button variant="outline">
              返回控制台
            </Button>
          </Link>
        </div>
      </div>
    )
  }
}

/**
 * 页面重新验证时间（秒）
 * 管理页面需要较新的数据，设置为5分钟
 */
export const revalidate = 300