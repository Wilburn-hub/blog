# 项目开发环境配置指南

## 🚀 快速开始

### 1. 环境准备
```bash
# 检查Node.js版本 (需要 >= 18.0.0)
node --version

# 检查npm版本
npm --version

# 检查PostgreSQL是否运行
brew services list | grep postgresql

# 检查Redis是否运行
brew services list | grep redis
```

### 2. 项目依赖安装
```bash
# 安装项目依赖
npm install

# 生成Prisma客户端
npx prisma generate

# 运行数据库迁移
npx prisma migrate dev

# 填充种子数据
npm run db:seed
```

### 3. 环境变量配置
```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑环境变量
nano .env.local
```

### 4. 启动开发服务器
```bash
# 启动前端开发服务器
npm run dev

# 启动数据库 (如果需要)
docker-compose up -d db redis

# 启动Prisma Studio (可选)
npm run db:studio
```

---

## 🛠️ 开发工具配置

### VS Code 扩展推荐
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "prisma.prisma",
    "ms-vscode.vscode-json",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

### VS Code 设置
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  }
}
```

---

## 📝 开发工作流

### Git 工作流
```bash
# 创建功能分支
git checkout -b feature/user-authentication

# 提交代码
git add .
git commit -m "feat: implement user authentication API"

# 推送分支
git push origin feature/user-authentication

# 创建Pull Request
# 通过GitHub/GitLab界面创建PR
```

### 提交信息规范
```bash
# 格式: <type>(<scope>): <description>

feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建过程或辅助工具的变动

# 示例
feat(auth): implement user login API
fix(search): resolve search API 500 error
docs(readme): update installation guide
```

---

## 🔧 代码质量工具

### ESLint 配置
```json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error",
    "no-console": "warn"
  }
}
```

### Prettier 配置
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### Husky 预提交钩子
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "git add"
    ],
    "*.{json,md,css}": [
      "prettier --write",
      "git add"
    ]
  }
}
```

---

## 🧪 测试配置

### Jest 配置
```javascript
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
}

module.exports = createJestConfig(customJestConfig)
```

### 测试脚本
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

---

## 📊 性能监控

### Bundle 分析
```bash
# 分析包大小
npm run build
npm run analyze
```

### 性能测试
```bash
# 安装Lighthouse CLI
npm install -g lighthouse

# 运行性能测试
lighthouse http://localhost:3000 --output html --output-path ./lighthouse-report.html
```

---

## 🔍 调试配置

### Chrome DevTools
1. 打开Chrome DevTools (F12)
2. 使用React Developer Tools扩展
3. 使用Redux DevTools (如果使用Redux)

### VS Code 调试
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Next.js",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "dev"],
  "port": 9229,
  "console": "integratedTerminal"
}
```

---

## 📋 开发检查清单

### 每日开发前
- [ ] 确认数据库服务运行正常
- [ ] 确认Redis服务运行正常
- [ ] 拉取最新代码
- [ ] 安装新的依赖
- [ ] 检查环境变量配置

### 提交代码前
- [ ] 运行代码格式化
- [ ] 运行ESLint检查
- [ ] 运行TypeScript类型检查
- [ ] 运行单元测试
- [ ] 确认构建成功
- [ ] 检查控制台错误

### 功能开发完成
- [ ] 功能测试通过
- [ ] 单元测试覆盖
- [ ] 集成测试通过
- [ ] 文档更新完成
- [ ] 代码审查通过
- [ ] 性能测试达标

---

## 🚨 常见问题解决

### 数据库连接问题
```bash
# 检查PostgreSQL状态
brew services list | grep postgresql

# 重启PostgreSQL
brew services restart postgresql

# 检查数据库连接
psql -h localhost -U postgres -d personal_blog
```

### Redis 连接问题
```bash
# 检查Redis状态
brew services list | grep redis

# 重启Redis
brew services restart redis

# 测试Redis连接
redis-cli ping
```

### 端口占用问题
```bash
# 查看端口占用
lsof -i :3000

# 杀死占用进程
kill -9 <PID>
```

### 依赖安装问题
```bash
# 清除npm缓存
npm cache clean --force

# 删除node_modules重新安装
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 有用资源

### 官方文档
- [Next.js 文档](https://nextjs.org/docs)
- [Prisma 文档](https://www.prisma.io/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [TypeScript 文档](https://www.typescriptlang.org/docs)

### 工具链接
- [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/)
- [Redux DevTools](https://chrome.google.com/webstore/detail/redux-devtools/)
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

### 学习资源
- [Next.js 教程](https://nextjs.org/learn)
- [Prisma 快速开始](https://www.prisma.io/docs/getting-started)
- [Tailwind CSS 学习](https://tailwindcss.com/course)

---

## 🎯 开发最佳实践

### 代码组织
- 使用TypeScript严格模式
- 保持组件单一职责
- 使用自定义Hooks提取逻辑
- 遵循React最佳实践

### 性能优化
- 使用React.memo优化组件
- 实现代码分割
- 优化图片加载
- 使用缓存策略

### 安全考虑
- 验证所有用户输入
- 使用HTTPS
- 实现适当的错误处理
- 定期更新依赖

### 可维护性
- 编写清晰的注释
- 使用有意义的变量名
- 保持代码一致性
- 编写充分的测试

---

**配置版本**: v1.0
**创建时间**: 2024-11-09
**最后更新**: 2024-11-09
**维护者**: 开发团队