import { User, Post, Category, Comment, Like, View, Subscription, Setting } from '@prisma/client'

export type UserWithPosts = User & {
  posts: Post[]
}

export type PostWithAuthor = Post & {
  author: User
  categories: Category[]
  comments: Comment[]
  likes: Like[]
  _count?: {
    comments: number
    likes: number
    views: number
  }
}

export type PostWithRelations = Post & {
  author: User
  categories: Category[]
  comments: Comment[]
  likes: Like[]
}

export type CommentWithAuthor = Comment & {
  author: User
  replies?: CommentWithAuthor[]
  _count?: {
    replies: number
  }
}

export type CategoryWithPosts = Category & {
  posts: Post[]
  _count?: {
    posts: number
  }
}

export type BlogSettings = Record<string, string>

export interface BlogMetadata {
  title: string
  description: string
  keywords?: string[]
  author?: string
  image?: string
  url?: string
  type?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
}

export interface PaginationOptions {
  page?: number
  limit?: number
  sortBy?: 'createdAt' | 'updatedAt' | 'publishedAt' | 'viewCount'
  sortOrder?: 'asc' | 'desc'
}

export interface SearchOptions extends PaginationOptions {
  query?: string
  category?: string
  tags?: string[]
  author?: string
  featured?: boolean
  published?: boolean
}

export interface BlogStats {
  totalPosts: number
  totalViews: number
  totalComments: number
  totalLikes: number
  totalUsers: number
  totalSubscriptions: number
}

export interface DashboardStats extends BlogStats {
  recentViews: number
  recentComments: number
  recentLikes: number
  topPosts: PostWithRelations[]
  popularCategories: CategoryWithPosts[]
}

export type Theme = 'light' | 'dark' | 'system'

export interface UserPreferences {
  theme: Theme
  fontSize: 'sm' | 'md' | 'lg'
  showExcerpts: boolean
  postsPerPage: number
}

export interface NewsletterFormData {
  email: string
  name?: string
}

export interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
}

export interface CommentFormData {
  content: string
  postId: string
  parentId?: string
}

export interface AuthUser {
  id: string
  name?: string
  email: string
  username: string
  avatar?: string
  role?: 'admin' | 'user'
}

export interface NavigationItem {
  label: string
  href: string
  external?: boolean
}

export interface SidebarItem extends NavigationItem {
  icon?: React.ReactNode
  badge?: string | number
}

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface TableOfContentsItem {
  id: string
  title: string
  level: number
}

export interface RelatedPost {
  id: string
  title: string
  slug: string
  excerpt?: string
  coverImage?: string
  publishedAt: Date
  readingTime?: number
  categories: Category[]
}

export interface SocialLink {
  platform: string
  url: string
  icon?: string
}

export interface SeoData {
  title: string
  description: string
  keywords?: string[]
  canonical?: string
  noindex?: boolean
  nofollow?: boolean
  openGraph?: {
    title?: string
    description?: string
    image?: string
    url?: string
    type?: string
  }
  jsonLd?: Record<string, any>
}

// 标签相关类型定义
export interface Tag {
  name: string
  count: number
  slug?: string
}

export interface TagWithPosts extends Tag {
  posts: PostWithAuthor[]
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface TagCloudItem extends Tag {
  size: 'sm' | 'md' | 'lg' | 'xl'
  weight: number
}

export interface TagSearchParams {
  q?: string
  sort?: 'name' | 'count' | 'recent'
  order?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface TagStats {
  totalTags: number
  totalPosts: number
  averagePostsPerTag: number
  mostPopularTag: Tag
  recentTags: Tag[]
}

// RSS 相关类型定义
export interface RSSFeedInfo {
  title: string
  description: string
  link: string
  language: string
  copyright?: string
  managingEditor?: string
  webMaster?: string
  pubDate?: Date
  lastBuildDate?: Date
  categories?: string[]
  generator?: string
  docs?: string
  cloud?: {
    domain: string
    port: number
    path: string
    registerProcedure: string
    protocol: 'soap' | 'xml-rpc'
  }
  ttl?: number
  image?: {
    url: string
    title: string
    link: string
    width?: number
    height?: number
    description?: string
  }
  skipHours?: number[]
  skipDays?: string[]
}

export interface RSSItem {
  title: string
  link: string
  description: string
  content?: string
  pubDate: Date
  guid?: {
    value: string
    isPermaLink?: boolean
  }
  author?: string
  categories?: string[]
  comments?: string
  enclosure?: {
    url: string
    type: string
    length?: number
  }
  source?: {
    url: string
    title: string
  }
}

export interface RSSFeed {
  rss: {
    '@version': string
    channel: {
      title: string
      description: string
      link: string
      language: string
      copyright?: string
      managingEditor?: string
      webMaster?: string
      pubDate?: string
      lastBuildDate?: string
      generator?: string
      docs?: string
      ttl?: string
      image?: {
        url: string
        title: string
        link: string
        width?: string
        height?: string
        description?: string
      }
      item: RSSItem[]
    }
  }
}

export interface JSONFeed {
  version: string
  title: string
  home_page_url?: string
  feed_url?: string
  description: string
  user_comment?: string
  next_url?: string
  icon?: string
  favicon?: string
  author?: {
    name: string
    url?: string
    avatar?: string
  }
  expired?: boolean
  items: JSONFeedItem[]
}

export interface JSONFeedItem {
  id: string
  url: string
  external_url?: string
  title: string
  content_html?: string
  content_text?: string
  summary?: string
  image?: string
  banner_image?: string
  date_published: string
  date_modified?: string
  author?: {
    name: string
    url?: string
    avatar?: string
  }
  tags?: string[]
  language?: string
  attachments?: Array<{
    url: string
    mime_type: string
    title?: string
    size_in_bytes?: number
    duration_in_seconds?: number
  }>
}

export interface RSSConfig {
  enabled: boolean
  maxItems: number
  includeContent: boolean
  contentLength: number
  includeAuthor: boolean
  includeCategories: boolean
  includeImages: boolean
  cacheTTL: number
  feedInfo: Partial<RSSFeedInfo>
}

export interface RSSFeedOptions {
  type: 'rss' | 'json'
  limit?: number
  category?: string
  tag?: string
  author?: string
  featured?: boolean
}

export interface RSSAnalytics {
  totalRequests: number
  uniqueIPs: number
  lastAccessed: Date
  popularFeeds: Array<{
    type: string
    params: string
    count: number
  }>
}
