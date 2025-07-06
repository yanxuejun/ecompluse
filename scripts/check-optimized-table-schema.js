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

async function checkOptimizedTableSchema() {
  try {
    console.log('🔍 Checking BestSellers_TopProducts_Optimized table schema...');
    console.log(`📊 Table: ${config.bigquery.projectId}.${config.bigquery.datasetId}.BestSellers_TopProducts_Optimized`);
    
    const dataset = bigquery.dataset(config.bigquery.datasetId);
    const table = dataset.table('BestSellers_TopProducts_Optimized');
    
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
    throw error;
  }
}

// 主函数
async function main() {
  try {
    await checkOptimizedTableSchema();
    console.log('\n✅ Schema check completed successfully!');
  } catch (error) {
    console.error('❌ Check failed:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { checkOptimizedTableSchema }; 