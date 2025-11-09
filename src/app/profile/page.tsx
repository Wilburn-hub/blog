'use client'

import React, { useState, useRef } from 'react'
import {
  User,
  Mail,
  Calendar,
  MapPin,
  Link as LinkIcon,
  Github,
  Twitter,
  Edit,
  Save,
  X,
  Camera,
  Shield,
  Bell,
  Palette,
  Globe,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'

// Mock user data
const mockUserData = {
  id: '1',
  name: '张三',
  email: 'zhangsan@example.com',
  username: 'zhangsan',
  avatar:
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  bio: '全栈开发工程师，专注于React、Next.js和TypeScript技术栈。热爱开源，喜欢分享技术心得。',
  location: '北京, 中国',
  website: 'https://zhangsan.dev',
  github: 'https://github.com/zhangsan',
  twitter: 'https://twitter.com/zhangsan',
  joinedAt: new Date('2023-01-15'),
  role: 'admin',
  preferences: {
    theme: 'system',
    language: 'zh-CN',
    emailNotifications: true,
    pushNotifications: false,
    newsletter: true,
    publicProfile: true,
    showEmail: false,
  },
}

// Mock stats data
const mockStats = {
  posts: 25,
  views: 15678,
  likes: 1289,
  comments: 342,
  followers: 892,
  following: 156,
}

export default function ProfilePage() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'preferences'>('profile')
  const [userData, setUserData] = useState(mockUserData)
  const [formData, setFormData] = useState({
    name: userData.name,
    username: userData.username,
    bio: userData.bio,
    location: userData.location,
    website: userData.website,
    github: userData.github,
    twitter: userData.twitter,
  })
  const [preferences, setPreferences] = useState(userData.preferences)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePreferenceChange = (key: string, value: boolean | string) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 模拟头像上传
      const reader = new FileReader()
      reader.onload = event => {
        setUserData(prev => ({ ...prev, avatar: event.target?.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
      // 模拟保存API调用
      await new Promise(resolve => setTimeout(resolve, 1500))

      setUserData(prev => ({
        ...prev,
        ...formData,
        preferences,
      }))

      setIsEditing(false)
      toast({
        title: '保存成功',
        description: '个人资料已更新',
      })
    } catch (error) {
      toast({
        title: '保存失败',
        description: '更新个人资料时出现错误，请重试',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: userData.name,
      username: userData.username,
      bio: userData.bio,
      location: userData.location,
      website: userData.website,
      github: userData.github,
      twitter: userData.twitter,
    })
    setPreferences(userData.preferences)
    setIsEditing(false)
  }

  return (
    <div className="container px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">个人资料</h1>
            <p className="text-muted-foreground">管理您的个人信息和账户设置</p>
          </div>
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                  <X className="mr-2 h-4 w-4" />
                  取消
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      保存
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                编辑资料
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex space-x-1 border-b">
          {[
            { id: 'profile', label: '基本信息', icon: User },
            { id: 'account', label: '账户设置', icon: Shield },
            { id: 'preferences', label: '偏好设置', icon: Palette },
          ].map(tab => {
            const Icon = tab.icon
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                onClick={() => setActiveTab(tab.id as any)}
                className="rounded-b-none"
              >
                <Icon className="mr-2 h-4 w-4" />
                {tab.label}
              </Button>
            )
          })}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left Column - Avatar and Stats */}
            <div className="space-y-6">
              {/* Avatar */}
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="relative inline-block">
                    <div className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full">
                      <img
                        src={userData.avatar}
                        alt="头像"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    {isEditing && (
                      <Button
                        size="icon"
                        className="absolute bottom-2 right-0 h-8 w-8 rounded-full"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold">{userData.name}</h3>
                  <p className="text-muted-foreground">@{userData.username}</p>
                  <div className="mt-2 flex justify-center">
                    <Badge variant="secondary">
                      {userData.role === 'admin' ? '管理员' : '用户'}
                    </Badge>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </CardContent>
              </Card>

              {/* Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">统计信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">文章数</span>
                    <span className="font-medium">{mockStats.posts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">总阅读量</span>
                    <span className="font-medium">{mockStats.views.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">获得点赞</span>
                    <span className="font-medium">{mockStats.likes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">评论数</span>
                    <span className="font-medium">{mockStats.comments}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">关注者</span>
                    <span className="font-medium">{mockStats.followers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">正在关注</span>
                    <span className="font-medium">{mockStats.following}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Joined Date */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>加入于 {userData.joinedAt.toLocaleDateString('zh-CN')}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Form */}
            <div className="space-y-6 lg:col-span-2">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle>基本信息</CardTitle>
                  <CardDescription>您的个人基本信息</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">姓名</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">用户名</Label>
                      <Input
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">个人简介</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      placeholder="介绍一下自己..."
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={4}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">所在地</Label>
                    <Input
                      id="location"
                      name="location"
                      placeholder="城市, 国家"
                      value={formData.location}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Social Links */}
              <Card>
                <CardHeader>
                  <CardTitle>社交链接</CardTitle>
                  <CardDescription>您的社交媒体和网站链接</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="website">个人网站</Label>
                    <Input
                      id="website"
                      name="website"
                      type="url"
                      placeholder="https://yourwebsite.com"
                      value={formData.website}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="github">GitHub</Label>
                    <Input
                      id="github"
                      name="github"
                      type="url"
                      placeholder="https://github.com/username"
                      value={formData.github}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter</Label>
                    <Input
                      id="twitter"
                      name="twitter"
                      type="url"
                      placeholder="https://twitter.com/username"
                      value={formData.twitter}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>账户信息</CardTitle>
                <CardDescription>您的账户基本信息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱地址</Label>
                  <div className="flex items-center space-x-2">
                    <Input id="email" type="email" value={userData.email} disabled />
                    <Badge variant="secondary">已验证</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>当前密码</Label>
                  <Input type="password" placeholder="••••••••" disabled />
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline">修改密码</Button>
                  <Button variant="outline">更换邮箱</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>账户安全</CardTitle>
                <CardDescription>保护您的账户安全</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">双因素认证</p>
                      <p className="text-sm text-muted-foreground">为您的账户添加额外的安全保护</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    启用
                  </Button>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center space-x-3">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">登录提醒</p>
                      <p className="text-sm text-muted-foreground">当有新设备登录时通知您</p>
                    </div>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">危险区域</CardTitle>
                <CardDescription>不可逆的操作</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 dark:bg-red-950">
                  <div>
                    <p className="font-medium text-red-600">删除账户</p>
                    <p className="text-sm text-muted-foreground">永久删除您的账户和所有相关数据</p>
                  </div>
                  <Button variant="destructive" size="sm">
                    删除账户
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>界面设置</CardTitle>
                <CardDescription>自定义您的使用体验</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>主题</Label>
                    <p className="text-sm text-muted-foreground">选择您喜欢的界面主题</p>
                  </div>
                  <Select
                    value={preferences.theme}
                    onValueChange={value => handlePreferenceChange('theme', value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">浅色</SelectItem>
                      <SelectItem value="dark">深色</SelectItem>
                      <SelectItem value="system">跟随系统</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>语言</Label>
                    <p className="text-sm text-muted-foreground">选择界面显示语言</p>
                  </div>
                  <Select
                    value={preferences.language}
                    onValueChange={value => handlePreferenceChange('language', value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zh-CN">简体中文</SelectItem>
                      <SelectItem value="en-US">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>通知设置</CardTitle>
                <CardDescription>管理您的通知偏好</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>邮件通知</Label>
                    <p className="text-sm text-muted-foreground">接收重要更新的邮件通知</p>
                  </div>
                  <Switch
                    checked={preferences.emailNotifications}
                    onCheckedChange={checked =>
                      handlePreferenceChange('emailNotifications', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>推送通知</Label>
                    <p className="text-sm text-muted-foreground">在浏览器中接收推送通知</p>
                  </div>
                  <Switch
                    checked={preferences.pushNotifications}
                    onCheckedChange={checked =>
                      handlePreferenceChange('pushNotifications', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>订阅邮件</Label>
                    <p className="text-sm text-muted-foreground">接收博客更新和精选内容</p>
                  </div>
                  <Switch
                    checked={preferences.newsletter}
                    onCheckedChange={checked => handlePreferenceChange('newsletter', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>隐私设置</CardTitle>
                <CardDescription>控制您的信息可见性</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>公开资料</Label>
                    <p className="text-sm text-muted-foreground">让其他用户可以查看您的个人资料</p>
                  </div>
                  <Switch
                    checked={preferences.publicProfile}
                    onCheckedChange={checked => handlePreferenceChange('publicProfile', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>显示邮箱</Label>
                    <p className="text-sm text-muted-foreground">在公开资料中显示您的邮箱地址</p>
                  </div>
                  <Switch
                    checked={preferences.showEmail}
                    onCheckedChange={checked => handlePreferenceChange('showEmail', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
