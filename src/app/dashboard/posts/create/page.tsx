'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Save,
  Eye,
  Upload,
  Image as ImageIcon,
  Bold,
  Italic,
  Link,
  List,
  Quote,
  Code,
  ChevronLeft,
  Sparkles,
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
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'

// Mock categories data
const mockCategories = [
  { id: '1', name: 'Web开发', slug: 'web-development' },
  { id: '2', name: 'React', slug: 'react' },
  { id: '3', name: 'TypeScript', slug: 'typescript' },
  { id: '4', name: 'CSS', slug: 'css' },
  { id: '5', name: '工具', slug: 'tools' },
]

const mockTags = [
  'Next.js',
  'React',
  'TypeScript',
  'Tailwind CSS',
  '性能优化',
  '前端工程化',
  'Vite',
  'Webpack',
  'JavaScript',
  'HTML',
  'CSS',
  'Node.js',
  'Express',
  'MongoDB',
]

export default function CreatePostPage() {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImage: '',
    featured: false,
    published: false,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, checked } = e.target

    if (name === 'title') {
      // 自动生成slug
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
        .replace(/(^-|-$)/g, '')
      setFormData(prev => ({ ...prev, [name]: value, slug }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'featured' || name === 'published' ? checked : value,
      }))
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 模拟图片上传
      const reader = new FileReader()
      reader.onload = event => {
        setFormData(prev => ({ ...prev, coverImage: event.target?.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]
    )
  }

  const handleAddTag = (tag: string) => {
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags(prev => [...prev, tag])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag))
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      handleAddTag(tagInput.trim())
    }
  }

  const insertMarkdown = (syntax: string) => {
    const textarea = document.getElementById('content') as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = textarea.value
      const selectedText = text.substring(start, end)

      let newText = ''
      switch (syntax) {
        case 'bold':
          newText = `**${selectedText || '粗体文本'}**`
          break
        case 'italic':
          newText = `*${selectedText || '斜体文本'}*`
          break
        case 'link':
          newText = `[${selectedText || '链接文本'}](url)`
          break
        case 'list':
          newText = `\n- 列表项\n- 列表项\n- 列表项`
          break
        case 'quote':
          newText = `\n> ${selectedText || '引用内容'}`
          break
        case 'code':
          newText = `\`\`\`${selectedText ? '' : 'javascript'}\n${selectedText || '// 代码内容'}\n\`\`\``
          break
        default:
          newText = syntax
      }

      const newContent = text.substring(0, start) + newText + text.substring(end)
      setFormData(prev => ({ ...prev, content: newContent }))

      // 设置光标位置
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + newText.length, start + newText.length)
      }, 0)
    }
  }

  const generateContent = async () => {
    if (!formData.title) {
      toast({
        title: '请先输入标题',
        description: 'AI生成内容需要基于文章标题',
        variant: 'destructive',
      })
      return
    }

    try {
      // 模拟AI生成内容
      const generatedContent = `
# ${formData.title}

## 引言

这是一篇关于${formData.title}的详细文章。本文将深入探讨相关概念和实践应用。

## 核心概念

### 什么是${formData.title}？

${formData.title}是现代Web开发中的重要概念，它提供了解决特定问题的有效方法。

### 主要特性

1. **高性能** - 优化的执行效率
2. **易用性** - 简单直观的API设计
3. **可扩展性** - 支持大规模应用开发
4. **社区支持** - 活跃的开发者社区

## 实践应用

### 基础用法

\`\`\`javascript
// 示例代码
const example = {
  title: "${formData.title}",
  description: "这是一个示例"
};
\`\`\`

### 高级技巧

在实际项目中，我们需要考虑更多的因素...

## 最佳实践

1. **遵循规范** - 严格按照官方文档和最佳实践
2. **性能优化** - 注意代码执行效率
3. **错误处理** - 完善的错误处理机制
4. **测试覆盖** - 保证代码质量

## 总结

通过本文的学习，我们深入了解了${formData.title}的核心概念和应用方法。希望这些内容能够帮助您在实际项目中更好地应用这些技术。

## 参考资料

- [官方文档](https://example.com)
- [相关教程](https://example.com)
- [社区讨论](https://example.com)
      `

      setFormData(prev => ({ ...prev, content: generatedContent }))

      toast({
        title: '内容生成成功',
        description: 'AI已为您生成了初始内容，您可以继续编辑和完善',
      })
    } catch (error) {
      toast({
        title: '生成失败',
        description: '内容生成过程中出现错误，请重试',
        variant: 'destructive',
      })
    }
  }

  const handleSave = async (publish: boolean = false) => {
    if (!formData.title || !formData.content) {
      toast({
        title: '请填写必要信息',
        description: '标题和内容都是必填项',
        variant: 'destructive',
      })
      return
    }

    const loadingFn = publish ? setIsPublishing : setIsSaving
    loadingFn(true)

    try {
      // 模拟保存API调用
      await new Promise(resolve => setTimeout(resolve, 1500))

      const action = publish ? '发布' : '保存'
      toast({
        title: `${action}成功`,
        description: publish ? '文章已成功发布' : '文章已保存为草稿',
      })

      router.push('/dashboard/posts')
    } catch (error) {
      toast({
        title: `${action}失败`,
        description: `${action}过程中出现错误，请重试`,
        variant: 'destructive',
      })
    } finally {
      loadingFn(false)
    }
  }

  return (
    <div className="container px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/dashboard/posts">
                <ChevronLeft className="mr-2 h-4 w-4" />
                返回文章列表
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">创建新文章</h1>
              <p className="text-muted-foreground">撰写和发布您的博客文章</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="mr-2 h-4 w-4" />
              {showPreview ? '编辑' : '预览'}
            </Button>
            <Button variant="outline" onClick={generateContent} disabled={!formData.title}>
              <Sparkles className="mr-2 h-4 w-4" />
              AI生成
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={isSaving || isPublishing}
            >
              {isSaving ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  保存草稿
                </>
              )}
            </Button>
            <Button onClick={() => handleSave(true)} disabled={isSaving || isPublishing}>
              {isPublishing ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  发布中...
                </>
              ) : (
                '发布文章'
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-3">
            {!showPreview ? (
              <>
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">文章标题</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="请输入文章标题"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="text-lg"
                  />
                </div>

                {/* Slug */}
                <div className="space-y-2">
                  <Label htmlFor="slug">URL路径</Label>
                  <div className="flex items-center space-x-2">
                    <span className="text-muted-foreground">/posts/</span>
                    <Input
                      id="slug"
                      name="slug"
                      placeholder="url-path"
                      value={formData.slug}
                      onChange={handleInputChange}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    这将是文章的URL地址，只能包含字母、数字、连字符和中文字符
                  </p>
                </div>

                {/* Cover Image */}
                <div className="space-y-2">
                  <Label>封面图片</Label>
                  <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-6">
                    {formData.coverImage ? (
                      <div className="space-y-4">
                        <div className="aspect-[16/9] w-full overflow-hidden rounded-lg">
                          <img
                            src={formData.coverImage}
                            alt="封面图片"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex justify-center">
                          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                            更换图片
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 text-center">
                        <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">点击上传或拖拽图片到此处</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            支持 JPG、PNG、GIF 格式，建议尺寸 1200x630
                          </p>
                        </div>
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                          <Upload className="mr-2 h-4 w-4" />
                          选择图片
                        </Button>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Excerpt */}
                <div className="space-y-2">
                  <Label htmlFor="excerpt">文章摘要</Label>
                  <Textarea
                    id="excerpt"
                    name="excerpt"
                    placeholder="请输入文章摘要，将显示在文章列表中..."
                    value={formData.excerpt}
                    onChange={handleInputChange}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">建议长度在 100-200 字符之间</p>
                </div>

                {/* Markdown Toolbar */}
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => insertMarkdown('bold')}>
                        <Bold className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => insertMarkdown('italic')}>
                        <Italic className="h-4 w-4" />
                      </Button>
                      <Separator orientation="vertical" className="h-6" />
                      <Button variant="ghost" size="sm" onClick={() => insertMarkdown('link')}>
                        <Link className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => insertMarkdown('list')}>
                        <List className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => insertMarkdown('quote')}>
                        <Quote className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => insertMarkdown('code')}>
                        <Code className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Content */}
                <div className="space-y-2">
                  <Label htmlFor="content">文章内容</Label>
                  <Textarea
                    id="content"
                    name="content"
                    placeholder="请输入文章内容，支持 Markdown 语法..."
                    value={formData.content}
                    onChange={handleInputChange}
                    rows={20}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    支持 Markdown 语法，可以使用上方工具栏快速插入格式
                  </p>
                </div>
              </>
            ) : (
              /* Preview Mode */
              <div className="prose prose-gray max-w-none dark:prose-invert">
                {formData.title && <h1>{formData.title}</h1>}
                {formData.excerpt && <p className="lead">{formData.excerpt}</p>}
                {formData.coverImage && (
                  <img src={formData.coverImage} alt="封面图片" className="rounded-lg" />
                )}
                <div
                  dangerouslySetInnerHTML={{
                    __html: `
                  ${formData.content
                    .replace(
                      /```(\w+)?\n([\s\S]*?)```/g,
                      '<pre class="bg-muted p-4 rounded-lg overflow-x-auto"><code class="text-sm">$2</code></pre>'
                    )
                    .replace(
                      /`([^`]+)`/g,
                      '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>'
                    )
                    .replace(/### (.*)/g, '<h3 class="text-xl font-bold mt-6 mb-3">$1</h3>')
                    .replace(/## (.*)/g, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>')
                    .replace(/# (.*)/g, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/\n\n/g, '</p><p class="mb-4 leading-relaxed">')
                    .replace(/^/, '<p class="mb-4 leading-relaxed">')
                    .replace(/$/, '</p>')
                    .replace(/<p><\/p>/g, '')
                    .replace(/<h([1-6])>/g, '<h$1 class="scroll-mt-20">')
                    .replace(
                      /<blockquote>/g,
                      '<blockquote class="border-l-4 border-primary pl-4 italic text-muted-foreground my-4">'
                    )
                    .replace(
                      /<pre>/g,
                      '<pre class="bg-muted rounded-lg p-4 overflow-x-auto"><code>'
                    )
                    .replace(/<\/pre>/g, '</code></pre>')
                    .replace(/<p>(```)/g, '$1')
                    .replace(/(```)<\/p>/g, '$1')}
                `,
                  }}
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">文章分类</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockCategories.map(category => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category.id}`}
                      checked={selectedCategories.includes(category.id)}
                      onCheckedChange={() => handleCategoryToggle(category.id)}
                    />
                    <Label htmlFor={`category-${category.id}`} className="text-sm">
                      {category.name}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">文章标签</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map(tag => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
                <div className="space-y-2">
                  <Input
                    placeholder="输入标签并按回车"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                  />
                  <div className="flex flex-wrap gap-1">
                    {mockTags
                      .filter(tag => !selectedTags.includes(tag))
                      .slice(0, 8)
                      .map(tag => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="cursor-pointer text-xs"
                          onClick={() => handleAddTag(tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">发布选项</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="featured"
                    checked={formData.featured}
                    onCheckedChange={checked =>
                      setFormData(prev => ({ ...prev, featured: checked as boolean }))
                    }
                  />
                  <Label htmlFor="featured" className="text-sm">
                    设为精选文章
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="published"
                    checked={formData.published}
                    onCheckedChange={checked =>
                      setFormData(prev => ({ ...prev, published: checked as boolean }))
                    }
                  />
                  <Label htmlFor="published" className="text-sm">
                    立即发布
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Word Count */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">统计信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>字数：</span>
                  <span>{formData.content.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>预计阅读时间：</span>
                  <span>{Math.ceil(formData.content.length / 400)} 分钟</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
