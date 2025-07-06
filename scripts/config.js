require('dotenv').config();

// 从 DATABASE_URL 解析 BigQuery 配置
function parseBigQueryFromDatabaseUrl(databaseUrl) {
  try {
    // 假设 DATABASE_URL 格式包含 BigQuery 信息
    // 例如: postgresql://user:pass@host:port/db?bigquery_project=project&bigquery_dataset=dataset&bigquery_table=table
    const url = new URL(databaseUrl);
    const params = url.searchParams;
    
    return {
      projectId: params.get('bigquery_project') || process.env.GOOGLE_CLOUD_PROJECT_ID,
      datasetId: params.get('bigquery_dataset') || process.env.BIGQUERY_DATASET_ID,
      tableId: params.get('bigquery_table') || process.env.BIGQUERY_TABLE_ID
    };
  } catch (error) {
    console.warn('Could not parse BigQuery config from DATABASE_URL, using environment variables');
    return {
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      datasetId: process.env.BIGQUERY_DATASET_ID,
      tableId: process.env.BIGQUERY_TABLE_ID
    };
  }
}

// 从 GCP_SERVICE_ACCOUNT_JSON 创建临时密钥文件
function getServiceAccountPath() {
  const serviceAccountJson = process.env.GCP_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    return process.env.GOOGLE_APPLICATION_CREDENTIALS;
  }
  
  try {
    // 解析 JSON 并创建临时文件
    const fs = require('fs');
    const path = require('path');
    const tempDir = path.join(__dirname, 'temp');
    
    // 确保临时目录存在
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempFile = path.join(tempDir, 'service-account.json');
    fs.writeFileSync(tempFile, serviceAccountJson);
    
    return tempFile;
  } catch (error) {
    console.warn('Could not create temp service account file:', error.message);
    return process.env.GOOGLE_APPLICATION_CREDENTIALS;
  }
}

const bigQueryConfig = parseBigQueryFromDatabaseUrl(process.env.DATABASE_URL);

module.exports = {
  // BigQuery 配置
  bigquery: {
    projectId: bigQueryConfig.projectId,
    datasetId: bigQueryConfig.datasetId,
    tableId: bigQueryConfig.tableId,
    // 使用 GCP_SERVICE_ACCOUNT_JSON 或 GOOGLE_APPLICATION_CREDENTIALS
    keyFilename: getServiceAccountPath()
  },
  
  // Google Custom Search API 配置
  googleSearch: {
    apiKey: process.env.GOOGLE_SEARCH_API_KEY,
    engineId: process.env.GOOGLE_SEARCH_ENGINE_ID
  },
  
  // 数据库配置
  database: {
    url: process.env.DATABASE_URL
  },
  
  // 任务配置
  task: {
    country: process.env.TASK_COUNTRY || 'US',
    categoryId: parseInt(process.env.TASK_CATEGORY_ID) || 1253,
    limit: parseInt(process.env.TASK_LIMIT) || 10,
    delayBetweenRequests: parseInt(process.env.TASK_DELAY) || 1000 // 毫秒
  }
}; 