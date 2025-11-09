# 测试指南和最佳实践

## 📚 测试框架配置

### Jest单元测试配置
项目使用Jest作为单元测试框架，配置文件：`jest.config.js`

#### 运行测试
```bash
# 运行所有测试
npm test

# 监视模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage

# CI环境运行
npm run test:ci
```

#### 测试文件结构
```
src/
├── lib/utils/__tests__/          # 工具函数测试
├── components/__tests__/         # 组件测试
├── app/api/__tests__/           # API测试
└── __tests__/                   # 集成测试
```

### Playwright E2E测试配置
项目使用Playwright进行端到端测试，配置文件：`playwright.config.ts`

#### 运行E2E测试
```bash
# 运行所有E2E测试
npm run test:e2e

# UI模式运行
npm run test:e2e:ui

# 调试模式
npm run test:e2e:debug

# 有头模式运行
npm run test:e2e:headed
```

#### E2E测试文件结构
```
tests/
├── e2e/                         # E2E测试
│   ├── basic.spec.ts           # 基础功能测试
│   ├── auth.spec.ts            # 认证流程测试
│   └── responsive.spec.ts      # 响应式设计测试
├── performance/                # 性能测试
│   └── load-testing.spec.ts    # 负载测试
└── security/                   # 安全测试
    └── security.spec.ts        # 安全性测试
```

---

## 🧪 测试最佳实践

### 单元测试最佳实践

#### 1. 测试命名规范
```typescript
describe('ComponentName', () => {
  describe('specific functionality', () => {
    it('should behave a certain way when specific condition', () => {
      // 测试代码
    })
  })
})
```

#### 2. 测试结构 (AAA模式)
```typescript
it('should validate user input correctly', () => {
  // Arrange - 准备测试数据
  const invalidInput = { email: 'invalid-email' }

  // Act - 执行操作
  const result = validateEmail(invalidInput.email)

  // Assert - 验证结果
  expect(result).toBe(false)
})
```

#### 3. Mock策略
```typescript
// Mock外部依赖
jest.mock('@/lib/services/user.service', () => ({
  getUserById: jest.fn(),
  createUser: jest.fn(),
}))

// 在测试中配置mock返回值
beforeEach(() => {
  ;(getUserById as jest.Mock).mockResolvedValue(mockUser)
})
```

### 集成测试最佳实践

#### 1. API测试模式
```typescript
describe('API Integration Tests', () => {
  beforeEach(() => {
    // 重置所有mock
    jest.clearAllMocks()
  })

  it('should handle complete user flow', async () => {
    // 设置mock
    const mockUser = { id: '1', email: 'test@example.com' }
    ;(userService.createUser as jest.Mock).mockResolvedValue(mockUser)

    // 执行API调用
    const response = await POST(request)

    // 验证响应
    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data.success).toBe(true)
  })
})
```

### E2E测试最佳实践

#### 1. 页面对象模式 (POM)
```typescript
// pages/LoginPage.ts
export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/auth/signin')
  }

  async login(email: string, password: string) {
    await this.page.getByLabel(/email/i).fill(email)
    await this.page.getByLabel(/password/i).fill(password)
    await this.page.getByRole('button', { name: /sign in/i }).click()
  }

  async getErrorMessage() {
    return this.page.getByText(/invalid credentials/i)
  }
}

// 测试文件
test('user can login with valid credentials', async ({ page }) => {
  const loginPage = new LoginPage(page)
  await loginPage.goto()
  await loginPage.login('test@example.com', 'password123')

  await expect(page).toHaveURL('/dashboard')
})
```

#### 2. 数据驱动测试
```typescript
const testCases = [
  { email: 'valid@example.com', password: 'ValidPass123!', expected: 'success' },
  { email: 'invalid-email', password: 'password', expected: 'error' },
  { email: 'test@example.com', password: 'wrong', expected: 'error' },
]

testCases.forEach(({ email, password, expected }) => {
  test(`should ${expected} for ${email}`, async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(email, password)

    if (expected === 'success') {
      await expect(page).toHaveURL('/dashboard')
    } else {
      await expect(loginPage.getErrorMessage()).toBeVisible()
    }
  })
})
```

---

## 🔧 测试工具和配置

### 代码覆盖率配置
```javascript
// jest.config.js
collectCoverageFrom: [
  'src/**/*.{js,jsx,ts,tsx}',
  '!src/**/*.d.ts',
  '!src/app/globals.css',
  '!src/**/*.stories.tsx', // 排除Storybook文件
],
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70,
  },
},
```

### 测试环境配置
```typescript
// jest.setup.js
// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
}))

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock
```

### Playwright配置优化
```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
})
```

---

## 📊 测试报告和分析

### 生成覆盖率报告
```bash
npm run test:coverage
```

报告将生成在 `coverage/` 目录下，可以在浏览器中打开 `coverage/lcov-report/index.html` 查看详细报告。

### Playwright HTML报告
```bash
npm run test:e2e
```

报告将生成在 `playwright-report/` 目录下，可以在浏览器中查看详细的测试结果。

### CI/CD集成
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:ci
      - run: npm run test:e2e
```

---

## 🚀 持续测试策略

### 测试金字塔
```
        /\
       /  \
      / E2E \  <- 少量，端到端测试
     /______\
    /        \
   /Integration\ <- 适量，集成测试
  /____________\
 /              \
/   Unit Tests    \ <- 大量，单元测试
/________________\
```

### 测试触发策略
1. **本地开发**: `npm run test:watch`
2. **提交前**: 运行单元测试和类型检查
3. **PR构建**: 运行完整测试套件
4. **部署前**: 运行E2E测试和性能测试
5. **生产监控**: 运行健康检查和监控测试

### 测试数据管理
```typescript
// 测试数据工厂
export class TestDataFactory {
  static createUser(overrides: Partial<User> = {}) {
    return {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      ...overrides,
    }
  }

  static createPost(overrides: Partial<Post> = {}) {
    return {
      id: '1',
      title: 'Test Post',
      content: 'Test content',
      published: true,
      ...overrides,
    }
  }
}
```

---

## 🐛 常见问题解决

### 1. Mock问题
```typescript
// 错误：Mock没有正确设置
jest.mock('@/lib/service')
const service = require('@/lib/service')

// 正确：直接导入并mock
import { service } from '@/lib/service'
jest.mock('@/lib/service')
service.mockImplementation(() => mockValue)
```

### 2. 异步测试问题
```typescript
// 错误：没有等待异步操作
test('async test', () => {
  fetchData().then(data => {
    expect(data).toBe('value')
  })
})

// 正确：使用async/await或返回Promise
test('async test', async () => {
  const data = await fetchData()
  expect(data).toBe('value')
})
```

### 3. E2E测试稳定性
```typescript
// 添加等待确保页面稳定
await page.waitForLoadState('networkidle')
await page.waitForSelector('[data-testid="loaded"]')

// 使用测试ID而不是CSS选择器
await page.getByTestId('submit-button').click()
```

---

## 📚 学习资源

### 官方文档
- [Jest文档](https://jestjs.io/docs/getting-started)
- [Playwright文档](https://playwright.dev/docs/intro)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)

### 最佳实践
- [测试最佳实践指南](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
- [前端测试策略](https://testingjavascript.com/)

---

## 🎯 质量目标

### 短期目标 (1-2周)
- [ ] 单元测试覆盖率达到80%
- [ ] 修复所有失败的测试
- [ ] 添加关键功能的集成测试

### 中期目标 (1-2个月)
- [ ] E2E测试覆盖所有主要用户流程
- [ ] 性能测试自动化
- [ ] 安全测试集成到CI/CD

### 长期目标 (3-6个月)
- [ ] 视觉回归测试
- [ ] 可访问性自动化测试
- [ ] 跨浏览器兼容性自动化测试

---

*定期更新此指南以反映最新的测试实践和项目需求。*