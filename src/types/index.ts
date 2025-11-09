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
