const { BigQuery } = require('@google-cloud/bigquery');
require('dotenv').config();

// Initialize BigQuery with service account credentials
let bigquery;
if (process.env.GCP_SERVICE_ACCOUNT_JSON) {
  // Use service account JSON directly
  const credentials = JSON.parse(process.env.GCP_SERVICE_ACCOUNT_JSON);
  bigquery = new BigQuery({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    credentials: credentials
  });
} else {
  // Fallback to key file
  bigquery = new BigQuery({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
  });
}

async function listTables() {
  try {
    console.log('正在列出 BigQuery 数据集中的表...');
    console.log(`项目: ${process.env.GOOGLE_CLOUD_PROJECT_ID}`);
    console.log(`数据集: ${process.env.BIGQUERY_DATASET_ID}`);
    console.log('');
    
    const dataset = bigquery.dataset(process.env.BIGQUERY_DATASET_ID);
    const [tables] = await dataset.getTables();
    
    if (tables.length === 0) {
      console.log('❌ 数据集中没有找到任何表');
      return;
    }
    
    console.log(`✅ 找到 ${tables.length} 个表:`);
    console.log('');
    
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.id}`);
      console.log(`   完整路径: ${table.metadata.tableReference.projectId}.${table.metadata.tableReference.datasetId}.${table.metadata.tableReference.tableId}`);
      console.log(`   创建时间: ${table.metadata.creationTime}`);
      console.log(`   最后修改: ${table.metadata.lastModifiedTime}`);
      console.log(`   行数: ${table.metadata.numRows || '未知'}`);
      console.log(`   大小: ${table.metadata.numBytes ? `${Math.round(table.metadata.numBytes / 1024 / 1024)} MB` : '未知'}`);
      console.log('');
    });
    
    // 显示建议的表名
    console.log('💡 建议的表名 (包含 "product" 或 "rank" 的表):');
    const relevantTables = tables.filter(table => 
      table.id.toLowerCase().includes('product') || 
      table.id.toLowerCase().includes('rank') ||
      table.id.toLowerCase().includes('week')
    );
    
    if (relevantTables.length > 0) {
      relevantTables.forEach(table => {
        console.log(`   - ${table.id}`);
      });
    } else {
      console.log('   没有找到相关的表名');
    }
    
  } catch (error) {
    console.error('❌ 列出表时出错:', error.message);
    if (error.code === 404) {
      console.log('💡 提示: 数据集可能不存在或没有访问权限');
    }
  }
}

// 运行脚本
listTables(); 