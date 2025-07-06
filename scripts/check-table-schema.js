const { BigQuery } = require('@google-cloud/bigquery');
const config = require('./config');

// Initialize BigQuery
let bigquery;
if (process.env.GCP_SERVICE_ACCOUNT_JSON) {
  const credentials = JSON.parse(process.env.GCP_SERVICE_ACCOUNT_JSON);
  bigquery = new BigQuery({
    projectId: config.bigquery.projectId,
    credentials: credentials
  });
} else {
  bigquery = new BigQuery({
    projectId: config.bigquery.projectId,
    keyFilename: config.bigquery.keyFilename
  });
}

async function checkTableSchema() {
  try {
    console.log('🔍 Checking BigQuery table schema...');
    console.log(`📊 Table: ${config.bigquery.projectId}.${config.bigquery.datasetId}.product_momentum_analysis`);
    
    const dataset = bigquery.dataset(config.bigquery.datasetId);
    const table = dataset.table('product_momentum_analysis');
    
    // 获取表元数据
    const [metadata] = await table.getMetadata();
    
    console.log('\n📋 Table Schema:');
    console.log('='.repeat(50));
    
    metadata.schema.fields.forEach(field => {
      console.log(`${field.name}: ${field.type}${field.mode ? ` (${field.mode})` : ''}`);
    });
    
    console.log('\n📊 Table Info:');
    console.log(`- Table ID: ${metadata.id}`);
    console.log(`- Creation Time: ${new Date(metadata.creationTime).toLocaleString()}`);
    console.log(`- Last Modified: ${new Date(metadata.lastModifiedTime).toLocaleString()}`);
    console.log(`- Row Count: ${metadata.numRows || 'Unknown'}`);
    console.log(`- Size: ${metadata.numBytes ? (metadata.numBytes / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown'}`);
    
    return metadata;
  } catch (error) {
    console.error('❌ Error checking table schema:', error);
    
    if (error.code === 404) {
      console.log('\n💡 Table does not exist. Creating table with proper schema...');
      await createTableWithSchema();
    }
    
    throw error;
  }
}

async function createTableWithSchema() {
  try {
    console.log('🏗️ Creating product_momentum_analysis table...');
    
    const dataset = bigquery.dataset(config.bigquery.datasetId);
    const table = dataset.table('product_momentum_analysis');
    
    const schema = [
      { name: 'product_title', type: 'STRING', mode: 'REQUIRED' },
      { name: 'current_rank', type: 'INTEGER', mode: 'REQUIRED' },
      { name: 'previous_rank', type: 'INTEGER', mode: 'REQUIRED' },
      { name: 'rank_improvement', type: 'INTEGER', mode: 'REQUIRED' },
      { name: 'current_relative_demand', type: 'FLOAT', mode: 'NULLABLE' },
      { name: 'previous_relative_demand', type: 'FLOAT', mode: 'NULLABLE' },
      { name: 'demand_change', type: 'FLOAT', mode: 'NULLABLE' },
      { name: 'momentum_score', type: 'FLOAT', mode: 'NULLABLE' },
      { name: 'trend_type', type: 'STRING', mode: 'NULLABLE' },
      { name: 'days_between_rankings', type: 'INTEGER', mode: 'NULLABLE' },
      { name: 'country', type: 'STRING', mode: 'NULLABLE' },
      { name: 'category_id', type: 'STRING', mode: 'NULLABLE' },
      { name: 'analysis_timestamp', type: 'TIMESTAMP', mode: 'NULLABLE' },
      { name: 'created_at', type: 'TIMESTAMP', mode: 'NULLABLE' },
      { name: 'updated_at', type: 'TIMESTAMP', mode: 'NULLABLE' }
    ];
    
    const options = {
      schema: schema,
      location: 'US' // 根据您的项目设置调整
    };
    
    await table.create(options);
    console.log('✅ Table created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating table:', error);
    throw error;
  }
}

async function testDataInsertion() {
  try {
    console.log('\n🧪 Testing data insertion...');
    
    const dataset = bigquery.dataset(config.bigquery.datasetId);
    const table = dataset.table('product_momentum_analysis');
    
    // 测试数据，匹配表结构
    const testRow = {
      product_title: 'Test Product',
      current_rank: 10,
      previous_rank: 20,
      rank_change: 10, // 使用正确的字段名
      current_relative_demand: 85.5,
      previous_relative_demand: 85.5,
      demand_change: 0.0,
      momentum_score: 10.0,
      trend_type: 'ROCKET_RISING',
      country: 'US',
      category_id: '123456',
      image_url: '',
      search_title: '',
      search_link: '',
      analysis_timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('📊 Test data:', JSON.stringify(testRow, null, 2));
    
    await table.insert([testRow]);
    console.log('✅ Test data inserted successfully!');
    
  } catch (error) {
    console.error('❌ Test insertion failed:', error);
    throw error;
  }
}

// 主函数
async function main() {
  try {
    await checkTableSchema();
    await testDataInsertion();
    console.log('\n✅ All checks completed successfully!');
  } catch (error) {
    console.error('❌ Check failed:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { checkTableSchema, createTableWithSchema, testDataInsertion }; 