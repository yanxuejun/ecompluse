const { BigQuery } = require('@google-cloud/bigquery');

// 从环境变量获取配置
const credentialsJson = process.env.GCP_SERVICE_ACCOUNT_JSON;
if (!credentialsJson) {
  console.error('❌ GCP_SERVICE_ACCOUNT_JSON 环境变量未设置');
  process.exit(1);
}

const credentials = JSON.parse(credentialsJson);
const bigquery = new BigQuery({ credentials });
const projectId = process.env.GCP_PROJECT_ID || 'gmc-bestseller';
const datasetId = 'new_gmc_data';
const tableId = 'Product_Favorites';

async function createProductFavoritesTable() {
  try {
    console.log('🚀 开始创建 Product_Favorites 表...');
    console.log(`📊 项目: ${projectId}`);
    console.log(`📊 数据集: ${datasetId}`);
    console.log(`📊 表名: ${tableId}`);

    const dataset = bigquery.dataset(datasetId);
    const table = dataset.table(tableId);

    // 检查表是否已存在
    const [exists] = await table.exists();
    if (exists) {
      console.log('⚠️  表已存在，跳过创建');
      return;
    }

    // 定义表结构
    const schema = [
      { name: 'id', type: 'INT64', mode: 'REQUIRED' },
      { name: 'userid', type: 'STRING', mode: 'REQUIRED' },
      { name: 'username', type: 'STRING', mode: 'NULLABLE' },
      { name: 'useremail', type: 'STRING', mode: 'NULLABLE' },
      { name: 'rank', type: 'INT64', mode: 'REQUIRED' },
      { name: 'country_code', type: 'STRING', mode: 'REQUIRED' },
      { name: 'categroy_id', type: 'INT64', mode: 'REQUIRED' },
      { name: 'brand', type: 'STRING', mode: 'NULLABLE' },
      { name: 'title', type: 'STRING', mode: 'REQUIRED' },
      { name: 'previous_rank', type: 'INT64', mode: 'NULLABLE' },
      { name: 'price_range', type: 'STRING', mode: 'NULLABLE' },
      { name: 'relative_demand', type: 'STRING', mode: 'NULLABLE' },
      { name: 'relative_demand_change', type: 'STRING', mode: 'NULLABLE' },
      { name: 'rank_timestamp', type: 'TIMESTAMP', mode: 'NULLABLE' },
      { name: 'created_at', type: 'TIMESTAMP', mode: 'REQUIRED' },
      { name: 'updated_at', type: 'TIMESTAMP', mode: 'REQUIRED' }
    ];

    const options = {
      schema: schema,
      location: 'US',
      description: '用户收藏的产品信息表',
      timePartitioning: {
        type: 'DAY',
        field: 'created_at'
      },
      clustering: {
        fields: ['userid', 'country_code', 'categroy_id']
      }
    };

    // 创建表
    const [table_result] = await table.create(options);
    console.log('✅ 表创建成功!');
    console.log(`📋 表 ID: ${table_result.id}`);

    // 创建索引
    console.log('🔍 创建索引...');
    
    // 注意：BigQuery 的索引创建方式不同，这里我们使用查询优化
    console.log('✅ 索引配置完成（通过聚类字段优化）');

    console.log('🎉 Product_Favorites 表创建完成！');
    console.log(`🔗 表路径: ${projectId}.${datasetId}.${tableId}`);

  } catch (error) {
    console.error('❌ 创建表失败:', error);
    throw error;
  }
}

// 运行脚本
if (require.main === module) {
  createProductFavoritesTable()
    .then(() => {
      console.log('✅ 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { createProductFavoritesTable };
