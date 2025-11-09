/**
 * 关于页面相关类型定义
 */

// 基础设置类型
export interface Setting {
  id: string;
  key: string;
  value: string;
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  createdAt: Date;
  updatedAt: Date;
}

// 社交链接类型
export interface SocialLink {
  id: string;
  platform: string;
  url: string;
  title?: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// 经验类型
export interface Experience {
  id: string;
  title: string;
  company?: string;
  location?: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  isCurrent: boolean;
  type: 'WORK' | 'EDUCATION' | 'PROJECT' | 'CERTIFICATION';
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// 技能类型
export interface Skill {
  id: string;
  name: string;
  category?: string;
  level: number; // 1-5
  description?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 个人信息类型
export interface PersonalInfo {
  name: string;
  bio: string;
  avatar?: string;
  location?: string;
  website?: string;
  email?: string;
  phone?: string;
  resume?: string;
  tagline?: string;
}

// 技能分组类型
export interface SkillGroup {
  category: string;
  skills: Skill[];
}

// 时间线项目类型
export interface TimelineItem {
  id: string;
  date: string;
  title: string;
  description?: string;
  type: 'work' | 'education' | 'project' | 'certification';
  company?: string;
  location?: string;
  isCurrent: boolean;
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 分页响应类型
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// 创建社交链接请求类型
export interface CreateSocialLinkRequest {
  platform: string;
  url: string;
  title?: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
}

// 更新社交链接请求类型
export interface UpdateSocialLinkRequest extends Partial<CreateSocialLinkRequest> {
  isActive?: boolean;
}

// 创建经验请求类型
export interface CreateExperienceRequest {
  title: string;
  company?: string;
  location?: string;
  description?: string;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
  type: 'WORK' | 'EDUCATION' | 'PROJECT' | 'CERTIFICATION';
  sortOrder?: number;
}

// 更新经验请求类型
export interface UpdateExperienceRequest extends Partial<CreateExperienceRequest> {}

// 创建技能请求类型
export interface CreateSkillRequest {
  name: string;
  category?: string;
  level?: number;
  description?: string;
  sortOrder?: number;
}

// 更新技能请求类型
export interface UpdateSkillRequest extends Partial<CreateSkillRequest> {
  isActive?: boolean;
}

// 设置键常量
export const SETTING_KEYS = {
  SITE_NAME: 'site_name',
  SITE_DESCRIPTION: 'site_description',
  SITE_AUTHOR: 'site_author',
  SITE_EMAIL: 'site_email',
  PERSONAL_BIO: 'personal_bio',
  PERSONAL_AVATAR: 'personal_avatar',
  PERSONAL_LOCATION: 'personal_location',
  PERSONAL_WEBSITE: 'personal_website',
  PERSONAL_PHONE: 'personal_phone',
  PERSONAL_RESUME: 'personal_resume',
  PERSONAL_TAGLINE: 'personal_tagline',
  GOOGLE_ANALYTICS_ID: 'google_analytics_id',
  SOCIAL_TWITTER: 'social_twitter',
  SOCIAL_GITHUB: 'social_github',
  SOCIAL_LINKEDIN: 'social_linkedin',
  THEME_PRIMARY_COLOR: 'theme_primary_color',
  THEME_SECONDARY_COLOR: 'theme_secondary_color',
} as const;

// 社交平台类型
export type SocialPlatform =
  | 'github'
  | 'twitter'
  | 'linkedin'
  | 'facebook'
  | 'instagram'
  | 'youtube'
  | 'dribbble'
  | 'behance'
  | 'medium'
  | 'dev'
  | 'email'
  | 'website';

// 预定义社交平台图标和颜色
export const SOCIAL_PLATFORMS: Record<SocialPlatform, { icon: string; color: string; label: string }> = {
  github: { icon: 'github', color: '#333333', label: 'GitHub' },
  twitter: { icon: 'twitter', color: '#1DA1F2', label: 'Twitter' },
  linkedin: { icon: 'linkedin', color: '#0077B5', label: 'LinkedIn' },
  facebook: { icon: 'facebook', color: '#1877F2', label: 'Facebook' },
  instagram: { icon: 'instagram', color: '#E4405F', label: 'Instagram' },
  youtube: { icon: 'youtube', color: '#FF0000', label: 'YouTube' },
  dribbble: { icon: 'dribbble', color: '#EA4C89', label: 'Dribbble' },
  behance: { icon: 'behance', color: '#1769FF', label: 'Behance' },
  medium: { icon: 'medium', color: '#000000', label: 'Medium' },
  dev: { icon: 'dev', color: '#000000', label: 'Dev.to' },
  email: { icon: 'mail', color: '#6B7280', label: 'Email' },
  website: { icon: 'globe', color: '#6B7280', label: 'Website' },
};

// 技能分类类型
export type SkillCategory =
  | 'frontend'
  | 'backend'
  | 'mobile'
  | 'devops'
  | 'database'
  | 'tool'
  | 'language'
  | 'framework'
  | 'library'
  | 'other';

// 技能分类标签
export const SKILL_CATEGORIES: Record<SkillCategory, string> = {
  frontend: '前端开发',
  backend: '后端开发',
  mobile: '移动开发',
  devops: 'DevOps',
  database: '数据库',
  tool: '工具',
  language: '编程语言',
  framework: '框架',
  library: '库',
  other: '其他',
};

// 经验类型标签
export const EXPERIENCE_TYPES: Record<Experience['type'], string> = {
  WORK: '工作经历',
  EDUCATION: '教育经历',
  PROJECT: '项目经历',
  CERTIFICATION: '认证经历',
};