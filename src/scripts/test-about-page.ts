/**
 * 关于页面功能测试脚本
 * 用于验证关于页面的各个API端点和功能是否正常工作
 */

async function testAboutPageAPIs() {
  const baseUrl = 'http://localhost:3000';
  const tests = [
    // 测试设置API
    {
      name: '获取个人信息',
      url: '/api/settings?personal=true',
      method: 'GET',
    },
    {
      name: '获取网站信息',
      url: '/api/settings?site=true',
      method: 'GET',
    },
    {
      name: '获取所有设置',
      url: '/api/settings',
      method: 'GET',
    },

    // 测试技能API
    {
      name: '获取技能分组',
      url: '/api/skills?groups=true',
      method: 'GET',
    },
    {
      name: '获取所有技能',
      url: '/api/skills',
      method: 'GET',
    },
    {
      name: '获取技能分类',
      url: '/api/skills?categories=true',
      method: 'GET',
    },
    {
      name: '获取技能统计',
      url: '/api/skills?stats=true',
      method: 'GET',
    },

    // 测试经历API
    {
      name: '获取所有经历',
      url: '/api/experiences',
      method: 'GET',
    },
    {
      name: '获取时间线格式',
      url: '/api/experiences?timeline=true',
      method: 'GET',
    },
    {
      name: '获取工作经历',
      url: '/api/experiences?type=WORK',
      method: 'GET',
    },

    // 测试社交链接API
    {
      name: '获取社交链接',
      url: '/api/social',
      method: 'GET',
    },
  ];

  console.log('🧪 开始测试关于页面API端点...\n');

  let passedTests = 0;
  let failedTests = 0;

  for (const test of tests) {
    try {
      console.log(`📡 测试: ${test.name}`);
      console.log(`   URL: ${test.method} ${test.url}`);

      const response = await fetch(`${baseUrl}${test.url}`, {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ 状态: ${response.status}`);
        console.log(`   📊 响应类型: ${Array.isArray(data.data) ? `数组 (${data.data.length} 项)` : typeof data.data}`);

        if (data.success && data.data) {
          console.log(`   📝 数据示例: ${JSON.stringify(data.data).slice(0, 100)}...`);
        }

        passedTests++;
      } else {
        console.log(`   ❌ 状态: ${response.status} ${response.statusText}`);
        failedTests++;
      }
    } catch (error) {
      console.log(`   ❌ 错误: ${error.message}`);
      failedTests++;
    }

    console.log(''); // 空行分隔
  }

  // 测试关于页面本身
  console.log('🌐 测试关于页面...');
  try {
    const response = await fetch(`${baseUrl}/about`);
    if (response.ok) {
      console.log('   ✅ 关于页面加载成功');
      passedTests++;
    } else {
      console.log(`   ❌ 关于页面加载失败: ${response.status}`);
      failedTests++;
    }
  } catch (error) {
    console.log(`   ❌ 关于页面错误: ${error.message}`);
    failedTests++;
  }

  // 总结
  console.log('\n📊 测试结果总结:');
  console.log(`   ✅ 通过: ${passedTests}`);
  console.log(`   ❌ 失败: ${failedTests}`);
  console.log(`   📈 成功率: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);

  if (failedTests === 0) {
    console.log('\n🎉 所有测试通过！关于页面功能正常工作。');
  } else {
    console.log('\n⚠️  部分测试失败，请检查相关功能。');
  }
}

// 运行测试
if (require.main === module) {
  console.log('请确保开发服务器正在运行 (npm run dev)\n');

  // 等待服务器启动
  setTimeout(() => {
    testAboutPageAPIs()
      .catch(error => {
        console.error('测试运行失败:', error);
        process.exit(1);
      });
  }, 2000);
}

export { testAboutPageAPIs };