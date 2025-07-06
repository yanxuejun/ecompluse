require('dotenv').config();

// 从环境变量获取 BigQuery 配置
function getBigQueryConfig() {
  return {
    projectId: process.env.GCP_PROJECT_ID,
    datasetId: process.env.GCP_DATASET_ID,
    tableId: process.env.GCP_TABLE_ID
  };
}

// 从 GCP_SERVICE_ACCOUNT_JSON 创建临时密钥文件
function getServiceAccountPath() {
  const serviceAccountJson = process.env.GCP_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    return process.env.GCP_KEY_FILENAME;
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
    return process.env.GCP_KEY_FILENAME;
  }
}

const bigQueryConfig = getBigQueryConfig();

module.exports = {
  // BigQuery 配置
  bigquery: {
    projectId: bigQueryConfig.projectId,
    datasetId: bigQueryConfig.datasetId,
    tableId: bigQueryConfig.tableId,
    // 使用 GCP_SERVICE_ACCOUNT_JSON 或 GCP_KEY_FILENAME
    keyFilename: getServiceAccountPath()
  },
  
  // Google Custom Search API 配置
  googleSearch: {
    apiKey: process.env.GOOGLE_SEARCH_API_KEY,
    engineId: process.env.GOOGLE_SEARCH_ENGINE_ID
  },
  
  // 任务配置
  task: {
    country: process.env.TASK_COUNTRY || 'US',
    categoryId: process.env.TASK_CATEGORY_ID || '123456',
    limit: parseInt(process.env.TASK_LIMIT) || 10,
    delayBetweenRequests: parseInt(process.env.TASK_DELAY) || 1000 // 毫秒
  }
}; 