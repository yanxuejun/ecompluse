import { NextRequest, NextResponse } from 'next/server';
import { BigQuery } from '@google-cloud/bigquery';

export async function GET(request: NextRequest) {
  try {
    console.log('开始执行 update-product-week-rank 任务...');
    
    // 验证请求来源（可选的安全措施）
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 初始化 BigQuery
    let bigquery: BigQuery;
    
    if (process.env.GCP_SERVICE_ACCOUNT_JSON) {
      const credentials = JSON.parse(process.env.GCP_SERVICE_ACCOUNT_JSON);
      bigquery = new BigQuery({
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        credentials
      });
    } else {
      bigquery = new BigQuery({
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
      });
    }

    // 执行更新逻辑
    const dataset = bigquery.dataset(process.env.BIGQUERY_DATASET_ID!);
    const table = dataset.table(process.env.BIGQUERY_TABLE_ID!);
    
    console.log('🔍 BigQuery Cron API - Dataset:', process.env.BIGQUERY_DATASET_ID);
    console.log('🔍 BigQuery Cron API - Table:', process.env.BIGQUERY_TABLE_ID);
    
    // 这里添加你的更新逻辑
    // 例如：更新产品周排名数据
    
    console.log('update-product-week-rank 任务执行完成');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Product week rank updated successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('update-product-week-rank 任务执行失败:', error);
    return NextResponse.json({ 
      error: 'Failed to update product week rank',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 