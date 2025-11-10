# 文档结构说明

本文档说明项目的文档组织结构。

## 📁 目录结构

```
docs/
├── README.md                     # 📋 文档中心 - 所有文档的入口
├── STRUCTURE.md                  # 📁 本文件 - 文档结构说明
│
├── setup/                        # 🚀 设置和配置
│   ├── POSTGRESQL_SETUP.md      # PostgreSQL 详细设置指南
│   └── POSTGRESQL_QUICKSTART.md # PostgreSQL 快速启动
│
├── development/                  # 💻 开发相关
│   └── CLAUDE.md                 # Claude Code 开发指南
│
├── database/                     # 🗄️ 数据库相关
│   ├── README.md                 # 数据库文档索引
│   └── connection-guide.md       # 数据库连接指南
│
├── planning/                     # 📋 项目规划
│   ├── development-plan.md       # 开发路线图
│   ├── personal-blog-prd.md      # 产品需求文档
│   ├── technical-architecture.md # 技术架构文档
│   └── success-metrics.md        # 成功指标定义
│
├── features/                     # ✨ 功能特性
│   ├── ABOUT_PAGE_README.md      # 关于页面功能
│   └── TAGS_FEATURE.md           # 标签系统功能
│
├── api/                          # 🔌 API 文档
│   └── README.md                 # API 接口文档
│
└── operations/                   # 🔧 运维部署
    ├── deployment-guide.md       # 部署指南
    └── monitoring-guide.md       # 监控指南
```

## 📋 文档分类

### 🚀 设置文档 (setup/)

面向新用户和需要配置开发环境的开发者：

- **POSTGRESQL_QUICKSTART.md** - 最快的 PostgreSQL 环境启动方法
- **POSTGRESQL_SETUP.md** - 详细的数据库环境配置说明

### 💻 开发文档 (development/)

面向日常开发的指南和规范：

- **CLAUDE.md** - Claude Code 使用的开发指南和项目规范

### 🗄️ 数据库文档 (database/)

数据库设计、管理和操作相关：

- **README.md** - 数据库文档入口和概述
- **connection-guide.md** - 详细的数据库连接和故障排除

### 📋 规划文档 (planning/)

项目规划、需求和架构设计：

- **development-plan.md** - 分阶段的开发计划
- **personal-blog-prd.md** - 产品需求文档
- **technical-architecture.md** - 系统架构设计
- **success-metrics.md** - 项目成功指标

### ✨ 功能文档 (features/)

具体功能模块的详细说明：

- **ABOUT_PAGE_README.md** - 关于页面功能实现
- **TAGS_FEATURE.md** - 标签系统设计和实现

### 🔌 API 文档 (api/)

API 接口和使用说明：

- **README.md** - API 文档中心

### 🔧 运维文档 (operations/)

部署、监控和维护相关：

- **deployment-guide.md** - 生产环境部署指南
- **monitoring-guide.md** - 系统监控和维护

## 🎯 使用指南

### 新手入门

1. 阅读 [项目 README](../README.md) 了解项目概况
2. 查看 [PostgreSQL 快速启动](./setup/POSTGRESQL_QUICKSTART.md) 配置环境
3. 参考 [Claude 开发指南](./development/CLAUDE.md) 了解开发规范

### 开发人员

1. 查看 [开发指南](./development/CLAUDE.md) 了解项目规范
2. 参考 [数据库连接指南](./database/connection-guide.md) 配置数据库
3. 阅读 [技术架构](./planning/technical-architecture.md) 了解系统设计

### 项目维护

1. 查看 [开发计划](./planning/development-plan.md) 了解路线图
2. 参考 [部署指南](./operations/deployment-guide.md) 进行部署
3. 使用 [监控指南](./operations/monitoring-guide.md) 维护系统

## 📝 文档规范

### 文件命名

- 使用 kebab-case 命名 (例: `POSTGRESQL_SETUP.md`)
- 英文文件名使用描述性名称
- 中文文档可以在文件名中使用中文

### 文档结构

1. **标题层级**: 使用标准的 Markdown 标题层级
2. **目录**: 长文档应包含目录
3. **代码块**: 使用语法高亮的代码块
4. **链接**: 使用相对路径链接到其他文档

### 更新日志

每次文档更新时，应在文档末尾添加更新日志：

```markdown
## 🔄 更新日志

- **2025-11-10**: 创建文档结构说明
- **2025-11-10**: 重组项目文档
```

## 🔗 文档关联

### 依赖关系

- 所有文档都链接回 [文档中心](./README.md)
- 设置文档链接到相应的开发指南
- 功能文档链接到相关的 API 文档

### 交叉引用

- 使用相对路径进行文档间链接
- 在相关章节中互相引用
- 保持链接的有效性和准确性

## 📚 相关资源

- [Markdown 写作规范](https://www.markdownguide.org/basic-syntax/)
- [文档写作最佳实践](https://www.writethedocs.org/)
- [技术文档风格指南](https://developers.google.com/tech-writing)
