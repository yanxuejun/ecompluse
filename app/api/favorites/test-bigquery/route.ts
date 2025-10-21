import { NextRequest, NextResponse } from 'next/server';
import { BigQuery } from '@google-cloud/bigquery';

const credentialsJson = process.env.GCP_SERVICE_ACCOUNT_JSON;
if (!credentialsJson) throw new Error('GCP_SERVICE_ACCOUNT_JSON 环境变量未设置');
const credentials = JSON.parse(credentialsJson);
const bigquery = new BigQuery({ credentials });
const projectId = process.env.GCP_PROJECT_ID!;
const datasetId = 'new_gmc_data';
const tableId = 'Product_Favorites';
const tableRef = `\`${projectId}.${datasetId}.${tableId}\``;

// GET /api/favorites/test-bigquery - Test BigQuery connection
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 测试 BigQuery 连接...');
    console.log(`📊 项目: ${projectId}`);
    console.log(`📊 数据集: ${datasetId}`);
    console.log(`📊 表名: ${tableId}`);

    // 检查数据集是否存在
    const dataset = bigquery.dataset(datasetId);
    const [datasetExists] = await dataset.exists();
    
    if (!datasetExists) {
      return NextResponse.json({
        success: false,
        error: `数据集 ${datasetId} 不存在`,
        projectId,
        datasetId,
        tableId
      });
    }

    // 检查表是否存在
    const table = dataset.table(tableId);
    const [tableExists] = await table.exists();
    
    if (!tableExists) {
      return NextResponse.json({
        success: false,
        error: `表 ${tableId} 不存在，需要先创建`,
        projectId,
        datasetId,
        tableId,
        instructions: '请运行: node scripts/create-product-favorites-table.js'
      });
    }

    // 测试查询
    const testQuery = `
      SELECT COUNT(*) as count
      FROM ${tableRef}
      LIMIT 1
    `;

    const [rows] = await bigquery.query({ query: testQuery });
    const count = rows[0]?.count || 0;

    return NextResponse.json({
      success: true,
      message: 'BigQuery 连接成功',
      projectId,
      datasetId,
      tableId,
      tableExists: true,
      recordCount: count,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ BigQuery 测试失败:', error);
    return NextResponse.json({
      success: false,
      error: 'BigQuery 连接失败',
      details: error instanceof Error ? error.message : 'Unknown error',
      projectId,
      datasetId,
      tableId
    }, { status: 500 });
  }
}
