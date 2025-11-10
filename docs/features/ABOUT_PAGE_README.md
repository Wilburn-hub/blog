# 关于页面功能使用指南

## 🚀 快速开始

### 1. 环境准备

确保你已经安装了所有必要的依赖：

```bash
npm install
npm install framer-motion  # 动画库
```

### 2. 数据库设置

```bash
# 生成 Prisma 客户端
npx prisma generate

# 运行数据库迁移（添加新的表结构）
npx prisma migrate dev --name add-about-page-models

# 可选：初始化示例数据
npx tsx src/scripts/init-about-data.ts
```

### 3. 启动开发服务器

```bash
npm run dev
```

### 4. 访问关于页面

打开浏览器访问 `http://localhost:3000/about`

## 📁 文件结构

关于页面的主要文件：

```
src/
├── app/about/page.tsx              # 关于页面主文件
├── components/about/               # 关于页面组件
│   ├── AboutHero.tsx              # 主要英雄区域
│   ├── SkillsSection.tsx          # 技能展示
│   ├── ExperienceTimeline.tsx     # 经历时间线
│   ├── SocialLinks.tsx            # 社交链接
│   └── ContactSection.tsx         # 联系信息
├── lib/services/                  # 业务逻辑服务
│   ├── setting.service.ts         # 设置管理
│   ├── social-link.service.ts     # 社交链接管理
│   ├── experience.service.ts      # 经历管理
│   └── skill.service.ts           # 技能管理
├── types/about.ts                 # TypeScript 类型定义
└── scripts/                       # 工具脚本
    ├── init-about-data.ts         # 数据初始化
    └── test-about-page.ts         # 功能测试
```

## 🔧 功能特性

### ✨ 主要组件

1. **AboutHero** - 个人信息展示
   - 头像和姓名
   - 个人简介和标语
   - 联系方式
   - 简历下载链接

2. **SkillsSection** - 技能展示
   - 按分类分组显示
   - 技能熟练度进度条
   - 响应式网格布局

3. **ExperienceTimeline** - 经历时间线
   - 工作、教育、项目、认证分类
   - 时间线视觉效果
   - 当前职位标识

4. **SocialLinks** - 社交链接
   - 多种显示模式（标准、紧凑、网格）
   - 自定义图标和颜色
   - 悬停动画效果

5. **ContactSection** - 联系表单
   - 联系方式卡片
   - 表单验证
   - 响应式设计

### 🎨 设计特性

- **响应式设计**: 适配移动端、平板和桌面设备
- **动画效果**: 使用 Framer Motion 实现流畅动画
- **暗色模式**: 支持明暗主题切换
- **现代化UI**: 基于 Tailwind CSS 的精美界面

## 📊 数据管理

### API 端点

| 功能     | 方法 | 端点               | 描述          |
| -------- | ---- | ------------------ | ------------- |
| 设置     | GET  | `/api/settings`    | 获取设置信息  |
| 设置     | POST | `/api/settings`    | 创建/更新设置 |
| 技能     | GET  | `/api/skills`      | 获取技能列表  |
| 技能     | POST | `/api/skills`      | 创建新技能    |
| 经历     | GET  | `/api/experiences` | 获取经历列表  |
| 经历     | POST | `/api/experiences` | 创建新经历    |
| 社交链接 | GET  | `/api/social`      | 获取社交链接  |
| 社交链接 | POST | `/api/social`      | 创建社交链接  |

### 数据初始化

运行初始化脚本添加示例数据：

```bash
npx tsx src/scripts/init-about-data.ts
```

这将创建：

- 基本网站设置
- 15+ 个技能（前端、后端、工具等）
- 8+ 个经历记录
- 5+ 个社交链接

## 🛠️ 自定义配置

### 修改个人信息

通过 API 更新个人信息：

```bash
curl -X PUT http://localhost:3000/api/settings \
  -H "Content-Type: application/json" \
  -d '{
    "personalInfo": {
      "name": "你的名字",
      "bio": "你的个人简介",
      "tagline": "你的标语",
      "location": "你的位置",
      "email": "your.email@example.com",
      "website": "https://yourwebsite.com"
    }
  }'
```

### 添加技能

```bash
curl -X POST http://localhost:3000/api/skills \
  -H "Content-Type: application/json" \
  -d '{
    "name": "JavaScript",
    "category": "frontend",
    "level": 5,
    "description": "精通现代JavaScript开发"
  }'
```

### 添加经历

```bash
curl -X POST http://localhost:3000/api/experiences \
  -H "Content-Type: application/json" \
  -d '{
    "title": "高级前端工程师",
    "company": "科技公司",
    "location": "北京",
    "description": "负责前端架构设计",
    "startDate": "2023-01-01",
    "isCurrent": true,
    "type": "WORK"
  }'
```

### 添加社交链接

```bash
curl -X POST http://localhost:3000/api/social \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "github",
    "url": "https://github.com/yourusername",
    "title": "GitHub",
    "description": "查看我的开源项目"
  }'
```

## 🎯 技能等级说明

技能等级从 1 到 5：

- **Level 1**: 初学者 (Learning)
- **Level 2**: 基础 (Beginner)
- **Level 3**: 中级 (Intermediate)
- **Level 4**: 高级 (Advanced)
- **Level 5**: 专家 (Expert)

## 📱 社交平台支持

内置支持以下社交平台：

- **GitHub** - 代码托管
- **Twitter** - 社交媒体
- **LinkedIn** - 职业社交
- **Facebook** - 社交网络
- **Instagram** - 图片分享
- **YouTube** - 视频平台
- **Email** - 邮箱联系
- **Website** - 个人网站

## 🧪 测试功能

运行测试脚本验证所有功能：

```bash
npx tsx src/scripts/test-about-page.ts
```

这将测试：

- 所有 API 端点
- 关于页面加载
- 数据响应格式

## 🎨 样式自定义

### 主题颜色

在设置中修改主题颜色：

```bash
curl -X POST http://localhost:3000/api/settings \
  -H "Content-Type: application/json" \
  -d '{
    "key": "theme_primary_color",
    "value": "#3b82f6"
  }'
```

### 自定义 CSS

所有组件都使用 Tailwind CSS，你可以：

1. 修改 `tailwind.config.ts` 添加自定义样式
2. 在组件中直接使用 Tailwind 类名
3. 通过 CSS 变量覆盖默认样式

## 📈 性能优化

### 图片优化

- 使用 Next.js Image 组件自动优化
- 支持多种格式和尺寸
- 懒加载和响应式图片

### 动画优化

- 使用 `viewport` 属性优化动画触发
- 合理设置动画延迟
- 考虑用户的 `prefers-reduced-motion` 设置

### 缓存策略

- API 端点使用适当的缓存策略
- 考虑添加 Redis 缓存提升性能
- 数据变更时清除相关缓存

## 🔍 故障排除

### 常见问题

1. **页面显示空白数据**
   - 检查数据库连接
   - 运行数据初始化脚本
   - 查看控制台错误信息

2. **动画不工作**
   - 确保安装了 `framer-motion`
   - 检查浏览器控制台错误
   - 确认 JavaScript 正常执行

3. **API 返回错误**
   - 检查数据库表是否存在
   - 验证环境变量配置
   - 查看服务器日志

4. **样式问题**
   - 确认 Tailwind CSS 正常工作
   - 检查 CSS 文件是否正确加载
   - 验证响应式断点

### 调试技巧

- 使用浏览器开发者工具检查网络请求
- 查看 React DevTools 调试组件状态
- 使用 Prisma Studio 检查数据库
- 检查组件 props 和数据流

## 🚀 部署说明

### 生产环境配置

1. 设置环境变量：

   ```env
   DATABASE_URL=your_production_database_url
   NEXTAUTH_URL=https://yourdomain.com
   ```

2. 构建项目：

   ```bash
   npm run build
   ```

3. 部署到 Vercel/Netlify/其他平台

### 数据迁移

在生产环境中运行：

```bash
npx prisma migrate deploy
npx tsx src/scripts/init-about-data.ts  # 可选：添加示例数据
```

## 📚 更多资源

- [Framer Motion 文档](https://www.framer.com/motion/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Next.js 文档](https://nextjs.org/docs)
- [Prisma 文档](https://www.prisma.io/docs)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进关于页面功能！

## 📄 许可证

MIT License - 详见 LICENSE 文件
