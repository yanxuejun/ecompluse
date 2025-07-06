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

async function listCategories() {
  try {
    console.log('🔍 正在查询 BigQuery 中的所有 Category ID...');
    console.log(`📊 项目: ${process.env.GOOGLE_CLOUD_PROJECT_ID}`);
    console.log(`📊 数据集: ${process.env.BIGQUERY_DATASET_ID}`);
    console.log(`📊 表: ${process.env.BIGQUERY_TABLE_ID}`);
    console.log('');
    
    const query = `
      SELECT 
        ranking_category as category_id,
        COUNT(*) as product_count,
        MIN(rank) as min_rank,
        MAX(rank) as max_rank,
        AVG(rank) as avg_rank
      FROM \`${process.env.GOOGLE_CLOUD_PROJECT_ID}.${process.env.BIGQUERY_DATASET_ID}.${process.env.BIGQUERY_TABLE_ID}\`
      WHERE ranking_country = 'US'
      GROUP BY ranking_category
      ORDER BY ranking_category ASC
    `;
    
    console.log('🔍 查询 SQL:');
    console.log(query);
    console.log('');
    
    const [rows] = await bigquery.query({ query });
    
    if (rows.length === 0) {
      console.log('❌ 没有找到任何 Category ID');
      return;
    }
    
    console.log(`✅ 找到 ${rows.length} 个 Category ID:`);
    console.log('');
    
    rows.forEach((row, index) => {
      console.log(`${index + 1}. Category ID: ${row.category_id}`);
      console.log(`   产品数量: ${row.product_count}`);
      console.log(`   排名范围: ${row.min_rank} - ${row.max_rank}`);
      console.log(`   平均排名: ${Math.round(row.avg_rank)}`);
      console.log('');
    });
    
    // 显示建议的 Category ID
    console.log('💡 建议的 Category ID (产品数量最多的前10个):');
    const topCategories = rows
      .sort((a, b) => b.product_count - a.product_count)
      .slice(0, 10);
    
    topCategories.forEach((row, index) => {
      console.log(`   ${index + 1}. Category ID: ${row.category_id} (${row.product_count} 个产品)`);
    });
    
  } catch (error) {
    console.error('❌ 查询 Category ID 时出错:', error.message);
    console.log('\n💡 可能的原因:');
    console.log('1. 检查环境变量配置');
    console.log('2. 检查 BigQuery 权限');
    console.log('3. 检查表名是否正确');
  }
}

// 运行脚本
listCategories(); 