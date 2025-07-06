require('dotenv').config();
const { BigQuery } = require('@google-cloud/bigquery');

async function listDatasets() {
  try {
    // 使用配置中的服务账户
    const serviceAccountJson = process.env.GCP_SERVICE_ACCOUNT_JSON;
    let bigquery;
    
    if (serviceAccountJson) {
      // 创建临时密钥文件
      const fs = require('fs');
      const path = require('path');
      const tempDir = path.join(__dirname, 'temp');
      
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const tempFile = path.join(tempDir, 'service-account.json');
      fs.writeFileSync(tempFile, serviceAccountJson);
      
      bigquery = new BigQuery({
        keyFilename: tempFile,
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
      });
    } else {
      bigquery = new BigQuery({
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
      });
    }
    
    console.log(`Listing datasets for project: ${process.env.GOOGLE_CLOUD_PROJECT_ID}\n`);
    
    const [datasets] = await bigquery.getDatasets();
    
    if (datasets.length === 0) {
      console.log('No datasets found in this project.');
      return;
    }
    
    console.log('Available datasets:');
    datasets.forEach(dataset => {
      console.log(`- Dataset ID: ${dataset.id}`);
      console.log(`  Display Name: ${dataset.metadata.friendlyName || 'N/A'}`);
      console.log(`  Description: ${dataset.metadata.description || 'N/A'}`);
      console.log('');
    });
    
    console.log('Use one of these Dataset IDs in your .env file:');
    console.log('BIGQUERY_DATASET_ID=dataset-id-from-above');
    
  } catch (error) {
    console.error('Error listing datasets:', error.message);
    console.log('\nMake sure:');
    console.log('1. GOOGLE_CLOUD_PROJECT_ID is set correctly');
    console.log('2. GCP_SERVICE_ACCOUNT_JSON is valid');
    console.log('3. Service account has BigQuery permissions');
  }
}

listDatasets(); 