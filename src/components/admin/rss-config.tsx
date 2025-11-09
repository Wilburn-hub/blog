'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { RSSConfig, RSSAnalytics } from '@/types'

interface RSSConfigProps {
  className?: string
}

export function RSSConfigComponent({ className }: RSSConfigProps) {
  const [config, setConfig] = useState<RSSConfig | null>(null)
  const [analytics, setAnalytics] = useState<RSSAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [validating, setValidating] = useState(false)
  const [validation, setValidation] = useState<{ rss: any; json: any } | null>(null)

  useEffect(() => {
    loadConfig()
    loadAnalytics()
  }, [])

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/admin/rss')
      const result = await response.json()

      if (result.success) {
        setConfig(result.data)
      } else {
        toast({
          title: '错误',
          description: result.error || '获取配置失败',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: '错误',
        description: '获取配置失败',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/rss/analytics')
      const result = await response.json()

      if (result.success) {
        setAnalytics(result.data)
      }
    } catch (error) {
      console.error('获取分析数据失败:', error)
    }
  }

  const saveConfig = async () => {
    if (!config) return

    setSaving(true)
    try {
      const response = await fetch('/api/admin/rss', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: '成功',
          description: 'RSS配置已更新'
        })
      } else {
        toast({
          title: '错误',
          description: result.error || '更新配置失败',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: '错误',
        description: '更新配置失败',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const resetConfig = async () => {
    try {
      const response = await fetch('/api/admin/rss?action=reset', {
        method: 'POST',
      })

      const result = await response.json()

      if (result.success) {
        setConfig(result.data)
        toast({
          title: '成功',
          description: '配置已重置为默认值'
        })
      } else {
        toast({
          title: '错误',
          description: result.error || '重置配置失败',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: '错误',
        description: '重置配置失败',
        variant: 'destructive'
      })
    }
  }

  const clearCache = async () => {
    try {
      const response = await fetch('/api/admin/rss?action=clear-cache', {
        method: 'POST',
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: '成功',
          description: 'RSS缓存已清除'
        })
      } else {
        toast({
          title: '错误',
          description: result.error || '清除缓存失败',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: '错误',
        description: '清除缓存失败',
        variant: 'destructive'
      })
    }
  }

  const validateFeeds = async () => {
    setValidating(true)
    try {
      const [rssResponse, jsonResponse] = await Promise.all([
        fetch('/api/admin/rss/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type: 'rss' }),
        }),
        fetch('/api/admin/rss/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type: 'json' }),
        }),
      ])

      const rssResult = await rssResponse.json()
      const jsonResult = await jsonResponse.json()

      setValidation({
        rss: rssResult.data,
        json: jsonResult.data,
      })

      if (rssResult.success && jsonResult.success) {
        const rssValid = rssResult.data.valid
        const jsonValid = jsonResult.data.valid

        if (rssValid && jsonValid) {
          toast({
            title: '验证成功',
            description: '所有Feed格式验证通过'
          })
        } else {
          toast({
            title: '验证失败',
            description: '部分Feed格式验证失败，请检查配置',
            variant: 'destructive'
          })
        }
      }
    } catch (error) {
      toast({
        title: '错误',
        description: '验证失败',
        variant: 'destructive'
      })
    } finally {
      setValidating(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-8">加载中...</div>
  }

  if (!config) {
    return <div className="text-center py-8">无法加载RSS配置</div>
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* 分析数据 */}
        {analytics && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">RSS分析数据</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{analytics.totalRequests}</div>
                <div className="text-sm text-gray-600">总请求次数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{analytics.uniqueIPs}</div>
                <div className="text-sm text-gray-600">独立IP数</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-purple-600">
                  {new Date(analytics.lastAccessed).toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-600">最后访问时间</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-orange-600">
                  {analytics.popularFeeds.length}
                </div>
                <div className="text-sm text-gray-600">热门Feed类型</div>
              </div>
            </div>

            {analytics.popularFeeds.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">热门Feed类型</h4>
                <div className="flex flex-wrap gap-2">
                  {analytics.popularFeeds.map((feed, index) => (
                    <Badge key={index} variant="secondary">
                      {feed.type}: {feed.count}次
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* 基本设置 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">基本设置</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={config.enabled}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, enabled: checked })
                }
              />
              <Label htmlFor="enabled">启用RSS功能</Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxItems">最大文章数量</Label>
                <Input
                  id="maxItems"
                  type="number"
                  min="1"
                  max="100"
                  value={config.maxItems}
                  onChange={(e) =>
                    setConfig({ ...config, maxItems: parseInt(e.target.value) || 20 })
                  }
                />
              </div>

              <div>
                <Label htmlFor="cacheTTL">缓存时间（秒）</Label>
                <Input
                  id="cacheTTL"
                  type="number"
                  min="0"
                  value={config.cacheTTL}
                  onChange={(e) =>
                    setConfig({ ...config, cacheTTL: parseInt(e.target.value) || 1800 })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="contentLength">内容摘要长度</Label>
              <Input
                id="contentLength"
                type="number"
                min="0"
                value={config.contentLength}
                onChange={(e) =>
                  setConfig({ ...config, contentLength: parseInt(e.target.value) || 500 })
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="includeContent"
                  checked={config.includeContent}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, includeContent: checked })
                  }
                />
                <Label htmlFor="includeContent">包含完整内容</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="includeAuthor"
                  checked={config.includeAuthor}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, includeAuthor: checked })
                  }
                />
                <Label htmlFor="includeAuthor">包含作者信息</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="includeCategories"
                  checked={config.includeCategories}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, includeCategories: checked })
                  }
                />
                <Label htmlFor="includeCategories">包含分类标签</Label>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="includeImages"
                checked={config.includeImages}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, includeImages: checked })
                }
              />
              <Label htmlFor="includeImages">包含图片</Label>
            </div>
          </div>
        </Card>

        {/* Feed信息 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Feed信息</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Feed标题</Label>
                <Input
                  id="title"
                  value={config.feedInfo.title || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      feedInfo: { ...config.feedInfo, title: e.target.value }
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="language">语言</Label>
                <Input
                  id="language"
                  value={config.feedInfo.language || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      feedInfo: { ...config.feedInfo, language: e.target.value }
                    })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Feed描述</Label>
              <Textarea
                id="description"
                value={config.feedInfo.description || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    feedInfo: { ...config.feedInfo, description: e.target.value }
                  })
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="managingEditor">编辑者</Label>
                <Input
                  id="managingEditor"
                  value={config.feedInfo.managingEditor || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      feedInfo: { ...config.feedInfo, managingEditor: e.target.value }
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="webMaster">网站管理员</Label>
                <Input
                  id="webMaster"
                  value={config.feedInfo.webMaster || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      feedInfo: { ...config.feedInfo, webMaster: e.target.value }
                    })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="copyright">版权信息</Label>
              <Input
                id="copyright"
                value={config.feedInfo.copyright || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    feedInfo: { ...config.feedInfo, copyright: e.target.value }
                  })
                }
              />
            </div>
          </div>
        </Card>

        {/* 验证结果 */}
        {validation && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Feed验证结果</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">RSS 2.0 Feed</h4>
                <div className={`p-3 rounded-md ${
                  validation.rss.valid ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  {validation.rss.valid ? '✅ 验证通过' : '❌ 验证失败'}
                  {validation.rss.errors && validation.rss.errors.length > 0 && (
                    <ul className="mt-2 text-sm list-disc list-inside">
                      {validation.rss.errors.map((error: string, index: number) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">JSON Feed</h4>
                <div className={`p-3 rounded-md ${
                  validation.json.valid ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  {validation.json.valid ? '✅ 验证通过' : '❌ 验证失败'}
                  {validation.json.errors && validation.json.errors.length > 0 && (
                    <ul className="mt-2 text-sm list-disc list-inside">
                      {validation.json.errors.map((error: string, index: number) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* 操作按钮 */}
        <div className="flex flex-wrap gap-4">
          <Button onClick={saveConfig} disabled={saving}>
            {saving ? '保存中...' : '保存配置'}
          </Button>

          <Button variant="outline" onClick={validateFeeds} disabled={validating}>
            {validating ? '验证中...' : '验证Feed'}
          </Button>

          <Button variant="outline" onClick={clearCache}>
            清除缓存
          </Button>

          <Button variant="destructive" onClick={resetConfig}>
            重置配置
          </Button>
        </div>
      </div>
    </div>
  )
}