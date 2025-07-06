const config = require('./config');

console.log('🔧 当前配置值:');
console.log('');

console.log('📊 BigQuery 配置:');
console.log(`   项目 ID: ${config.bigquery.projectId}`);
console.log(`   数据集 ID: ${config.bigquery.datasetId}`);
console.log(`   表 ID: ${config.bigquery.tableId}`);
console.log(`   密钥文件: ${config.bigquery.keyFilename}`);
console.log('');

console.log('🔍 Google Search API 配置:');
console.log(`   API Key: ${config.googleSearch.apiKey ? '已设置' : '未设置'}`);
console.log(`   Engine ID: ${config.googleSearch.engineId || '未设置'}`);
console.log('');

console.log('⚙️ 任务配置:');
console.log(`   国家: ${config.task.country}`);
console.log(`   Category ID: ${config.task.categoryId}`);
console.log(`   限制数量: ${config.task.limit}`);
console.log(`   请求延迟: ${config.task.delayBetweenRequests}ms`);
console.log('');

console.log('💡 环境变量:');
console.log(`   TASK_COUNTRY: ${process.env.TASK_COUNTRY || '未设置 (使用默认值: US)'}`);
console.log(`   TASK_CATEGORY_ID: ${process.env.TASK_CATEGORY_ID || '未设置 (使用默认值: 1253)'}`);
console.log(`   TASK_LIMIT: ${process.env.TASK_LIMIT || '未设置 (使用默认值: 10)'}`);
console.log(`   TASK_DELAY: ${process.env.TASK_DELAY || '未设置 (使用默认值: 1000)'}`);
console.log('');

console.log('🎯 要修改 Category ID，可以:');
console.log('1. 在 .env 文件中添加: TASK_CATEGORY_ID=你的CategoryID');
console.log('2. 或者直接修改 scripts/config.js 中的默认值');
console.log('3. 运行 node scripts/list-categories.js 查看可用的 Category ID'); 