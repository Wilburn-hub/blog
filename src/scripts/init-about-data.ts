/**
 * 关于页面数据初始化脚本
 * 运行此脚本来初始化示例的个人信息、技能、经验和社交链接数据
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initAboutData() {
  console.log('开始初始化关于页面数据...');

  try {
    // 1. 初始化设置数据
    console.log('1. 初始化设置数据...');
    const settings = await prisma.setting.createMany({
      data: [
        {
          key: 'site_name',
          value: 'Personal Blog',
          type: 'STRING',
        },
        {
          key: 'site_description',
          value: 'A personal blog about technology, programming, and life',
          type: 'STRING',
        },
        {
          key: 'site_author',
          value: 'John Developer',
          type: 'STRING',
        },
        {
          key: 'site_email',
          value: 'john.developer@example.com',
          type: 'STRING',
        },
        {
          key: 'personal_bio',
          value: '我是一名充满热情的全栈开发者，专注于创建优雅、高效的Web应用程序。拥有8年的开发经验，精通现代前端和后端技术栈。我相信技术应该服务于人，致力于构建能够改善用户体验的产品。除了编程，我还喜欢开源贡献、技术写作和指导初学者开发者。',
          type: 'STRING',
        },
        {
          key: 'personal_avatar',
          value: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
          type: 'STRING',
        },
        {
          key: 'personal_location',
          value: '北京, 中国',
          type: 'STRING',
        },
        {
          key: 'personal_website',
          value: 'https://johndeveloper.dev',
          type: 'STRING',
        },
        {
          key: 'personal_phone',
          value: '+86 138-0000-0000',
          type: 'STRING',
        },
        {
          key: 'personal_resume',
          value: 'https://example.com/resume.pdf',
          type: 'STRING',
        },
        {
          key: 'personal_tagline',
          value: '用代码构建未来，用创新改变世界',
          type: 'STRING',
        },
        {
          key: 'theme_primary_color',
          value: '#3b82f6',
          type: 'STRING',
        },
        {
          key: 'theme_secondary_color',
          value: '#6366f1',
          type: 'STRING',
        },
      ],
      skipDuplicates: true,
    });
    console.log(`✅ 创建了 ${settings.count} 条设置数据`);

    // 2. 初始化技能数据
    console.log('2. 初始化技能数据...');
    const skills = await prisma.skill.createMany({
      data: [
        // 前端技能
        { name: 'React', category: 'frontend', level: 5, description: '精通React及其生态系统，包括Hooks、Context、Redux等', sortOrder: 1 },
        { name: 'Next.js', category: 'frontend', level: 5, description: '熟练使用Next.js构建SSR/SSG应用', sortOrder: 2 },
        { name: 'TypeScript', category: 'frontend', level: 5, description: '强类型编程，提升代码质量和开发效率', sortOrder: 3 },
        { name: 'Tailwind CSS', category: 'frontend', level: 4, description: '现代化CSS框架，快速构建响应式界面', sortOrder: 4 },
        { name: 'Vue.js', category: 'frontend', level: 3, description: '了解Vue.js框架及其组件化开发', sortOrder: 5 },

        // 后端技能
        { name: 'Node.js', category: 'backend', level: 5, description: '熟练使用Node.js构建服务端应用', sortOrder: 1 },
        { name: 'Express.js', category: 'backend', level: 5, description: 'Node.js Web框架，快速搭建RESTful API', sortOrder: 2 },
        { name: 'NestJS', category: 'backend', level: 4, description: '基于TypeScript的企业级Node.js框架', sortOrder: 3 },
        { name: 'PostgreSQL', category: 'backend', level: 4, description: '关系型数据库，数据建模和查询优化', sortOrder: 4 },
        { name: 'MongoDB', category: 'backend', level: 3, description: 'NoSQL数据库，处理非结构化数据', sortOrder: 5 },

        // 移动端技能
        { name: 'React Native', category: 'mobile', level: 3, description: '跨平台移动应用开发', sortOrder: 1 },
        { name: 'Flutter', category: 'mobile', level: 2, description: '了解Flutter基础开发', sortOrder: 2 },

        // DevOps技能
        { name: 'Docker', category: 'devops', level: 4, description: '容器化部署，微服务架构', sortOrder: 1 },
        { name: 'AWS', category: 'devops', level: 3, description: '云服务部署和管理', sortOrder: 2 },
        { name: 'CI/CD', category: 'devops', level: 4, description: '持续集成和持续部署流程', sortOrder: 3 },

        // 工具
        { name: 'Git', category: 'tool', level: 5, description: '版本控制，团队协作必备技能', sortOrder: 1 },
        { name: 'VS Code', category: 'tool', level: 5, description: '日常开发IDE，高效编码工具', sortOrder: 2 },
        { name: 'Figma', category: 'tool', level: 3, description: 'UI设计工具，原型制作', sortOrder: 3 },
      ],
      skipDuplicates: true,
    });
    console.log(`✅ 创建了 ${skills.count} 条技能数据`);

    // 3. 初始化经验数据
    console.log('3. 初始化经验数据...');
    const experiences = await prisma.experience.createMany({
      data: [
        // 工作经历
        {
          title: '高级全栈开发工程师',
          company: '科技创新有限公司',
          location: '北京',
          description: '负责公司核心产品的架构设计和开发，带领团队完成多个重要项目。优化系统性能，提升用户体验。参与技术选型和架构决策，推动技术创新。',
          startDate: new Date('2022-03-01'),
          endDate: null,
          isCurrent: true,
          type: 'WORK',
          sortOrder: 1,
        },
        {
          title: '全栈开发工程师',
          company: '互联网科技公司',
          location: '上海',
          description: '参与多个Web应用的开发，负责前后端架构设计。优化数据库查询性能，提升系统响应速度。与产品团队紧密合作，快速迭代产品功能。',
          startDate: new Date('2020-06-01'),
          endDate: new Date('2022-02-28'),
          isCurrent: false,
          type: 'WORK',
          sortOrder: 2,
        },
        {
          title: '前端开发工程师',
          company: '初创公司',
          location: '深圳',
          description: '负责公司主要产品的前端开发，使用React构建单页应用。与后端团队协作设计API接口，确保前后端数据交互的流畅性。',
          startDate: new Date('2018-07-01'),
          endDate: new Date('2020-05-31'),
          isCurrent: false,
          type: 'WORK',
          sortOrder: 3,
        },

        // 教育经历
        {
          title: '计算机科学与技术 学士学位',
          company: '北京理工大学',
          location: '北京',
          description: '主修计算机科学，GPA 3.8/4.0。获得优秀毕业生称号，多次获得奖学金。参与多个编程竞赛并获奖。',
          startDate: new Date('2014-09-01'),
          endDate: new Date('2018-06-30'),
          isCurrent: false,
          type: 'EDUCATION',
          sortOrder: 1,
        },

        // 项目经历
        {
          title: '开源博客系统',
          company: '个人项目',
          location: 'GitHub',
          description: '基于Next.js和Prisma开发的全栈博客系统，支持Markdown编辑、标签分类、评论系统等功能。项目在GitHub上获得1000+ stars。',
          startDate: new Date('2023-01-01'),
          endDate: new Date('2023-06-30'),
          isCurrent: false,
          type: 'PROJECT',
          sortOrder: 1,
        },
        {
          title: '电商平台重构',
          company: '工作项目',
          location: '公司内部',
          description: '负责将老旧的电商平台从PHP重构为Node.js + React的现代化架构。系统性能提升300%，用户体验大幅改善。',
          startDate: new Date('2022-08-01'),
          endDate: new Date('2022-12-31'),
          isCurrent: false,
          type: 'PROJECT',
          sortOrder: 2,
        },

        // 认证经历
        {
          title: 'AWS Certified Solutions Architect',
          company: 'Amazon Web Services',
          location: '在线',
          description: '通过AWS解决方案架构师认证，掌握云服务架构设计和最佳实践。',
          startDate: new Date('2023-03-15'),
          endDate: new Date('2023-03-15'),
          isCurrent: false,
          type: 'CERTIFICATION',
          sortOrder: 1,
        },
        {
          title: 'Google Cloud Professional Developer',
          company: 'Google Cloud',
          location: '在线',
          description: '获得Google云平台专业开发者认证，具备在GCP上构建和部署应用的能力。',
          startDate: new Date('2022-11-20'),
          endDate: new Date('2022-11-20'),
          isCurrent: false,
          type: 'CERTIFICATION',
          sortOrder: 2,
        },
      ],
      skipDuplicates: true,
    });
    console.log(`✅ 创建了 ${experiences.count} 条经验数据`);

    // 4. 初始化社交链接数据
    console.log('4. 初始化社交链接数据...');
    const socialLinks = await prisma.socialLink.createMany({
      data: [
        {
          platform: 'github',
          url: 'https://github.com/johndeveloper',
          title: 'GitHub',
          description: '查看我的开源项目和代码贡献',
          icon: 'github',
          color: '#333333',
          sortOrder: 1,
        },
        {
          platform: 'twitter',
          url: 'https://twitter.com/johndeveloper',
          title: 'Twitter',
          description: '关注我的技术分享和日常思考',
          icon: 'twitter',
          color: '#1DA1F2',
          sortOrder: 2,
        },
        {
          platform: 'linkedin',
          url: 'https://linkedin.com/in/johndeveloper',
          title: 'LinkedIn',
          description: '专业人脉和职业发展',
          icon: 'linkedin',
          color: '#0077B5',
          sortOrder: 3,
        },
        {
          platform: 'email',
          url: 'mailto:john.developer@example.com',
          title: 'Email',
          description: '通过邮件联系我',
          icon: 'mail',
          color: '#6B7280',
          sortOrder: 4,
        },
        {
          platform: 'website',
          url: 'https://johndeveloper.dev',
          title: 'Website',
          description: '访问我的个人网站',
          icon: 'globe',
          color: '#6B7280',
          sortOrder: 5,
        },
      ],
      skipDuplicates: true,
    });
    console.log(`✅ 创建了 ${socialLinks.count} 条社交链接数据`);

    console.log('\n🎉 关于页面数据初始化完成！');
    console.log('\n你可以访问以下页面查看效果：');
    console.log('- 关于页面: http://localhost:3000/about');
    console.log('- 设置管理: http://localhost:3000/api/settings');
    console.log('- 技能管理: http://localhost:3000/api/skills');
    console.log('- 经验管理: http://localhost:3000/api/experiences');
    console.log('- 社交链接管理: http://localhost:3000/api/social');

  } catch (error) {
    console.error('❌ 初始化数据时出错:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initAboutData()
    .then(() => {
      console.log('\n✅ 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ 脚本执行失败:', error);
      process.exit(1);
    });
}

export { initAboutData };