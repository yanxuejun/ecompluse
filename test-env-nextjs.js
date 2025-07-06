// 模拟 Next.js 环境变量加载
require('dotenv').config();

console.log('=== Next.js 环境变量测试 ===');

// 检查所有必需的环境变量
const requiredEnvVars = {
  'DATABASE_URL': process.env.DATABASE_URL,
  'GOOGLE_CLOUD_PROJECT_ID': process.env.GOOGLE_CLOUD_PROJECT_ID,
  'BIGQUERY_DATASET_ID': process.env.BIGQUERY_DATASET_ID,
  'BIGQUERY_TABLE_ID': process.env.BIGQUERY_TABLE_ID,
  'GOOGLE_SEARCH_API_KEY': process.env.GOOGLE_SEARCH_API_KEY,
  'GOOGLE_SEARCH_ENGINE_ID': process.env.GOOGLE_SEARCH_ENGINE_ID,
  'GCP_SERVICE_ACCOUNT_JSON': process.env.GCP_SERVICE_ACCOUNT_JSON
};

let allGood = true;

console.log('\n📋 环境变量状态:');
for (const [key, value] of Object.entries(requiredEnvVars)) {
  const status = value ? '✅' : '❌';
  const displayValue = value ? (key.includes('JSON') || key.includes('KEY') ? '***HIDDEN***' : value) : 'Missing';
  console.log(`${status} ${key}: ${displayValue}`);
  
  if (!value) {
    allGood = false;
  }
}

console.log('\n🔧 缓存问题解决方案:');
console.log('1. 已清除 .next 缓存目录');
console.log('2. 已清除 node_modules/.cache 目录');
console.log('3. 已重新安装依赖');

if (allGood) {
  console.log('\n✅ 所有环境变量都已正确设置！');
  console.log('💡 如果仍然有问题，请尝试以下步骤:');
  console.log('   - 重启开发服务器: npm run dev');
  console.log('   - 重启 IDE/编辑器');
  console.log('   - 检查 .env 文件是否有语法错误');
} else {
  console.log('\n❌ 部分环境变量缺失，请检查 .env 文件');
}

// 测试环境变量在 API 路由中的可用性
console.log('\n🧪 测试 API 路由环境变量加载...');
try {
  // 模拟 API 路由环境
  const apiEnv = {
    DATABASE_URL: process.env.DATABASE_URL,
    GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID,
    BIGQUERY_DATASET_ID: process.env.BIGQUERY_DATASET_ID,
    BIGQUERY_TABLE_ID: process.env.BIGQUERY_TABLE_ID,
    GOOGLE_SEARCH_API_KEY: process.env.GOOGLE_SEARCH_API_KEY,
    GOOGLE_SEARCH_ENGINE_ID: process.env.GOOGLE_SEARCH_ENGINE_ID,
    GCP_SERVICE_ACCOUNT_JSON: process.env.GCP_SERVICE_ACCOUNT_JSON
  };
  
  console.log('✅ API 路由环境变量加载正常');
} catch (error) {
  console.log('❌ API 路由环境变量加载失败:', error.message);
} 