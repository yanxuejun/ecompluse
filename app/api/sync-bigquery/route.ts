import { NextRequest, NextResponse } from 'next/server';
import { BigQuery } from '@google-cloud/bigquery';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // 查询参数
  const country = searchParams.get('country');
  const title = searchParams.get('title'); // 产品标题模糊
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const category = searchParams.get('category'); // 目录id
  const brand = searchParams.get('brand');
  const brandIsNull = searchParams.get('brandIsNull'); // 新增
  const limit = Number(searchParams.get('limit') || 50);
  const minRank = searchParams.get('minRank');
  const maxRank = searchParams.get('maxRank');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');

  // 构建SQL
  let sql = `SELECT 
    rank_id, 
    rank, 
    ranking_country, 
    ranking_category, 
    brand, 
    product_title, 
    previous_rank, 
    price_range, 
    relative_demand, 
    previous_relative_demand, 
    rank_timestamp
    FROM \`new_gmc_data.BestSellers_TopProducts_479974220\`
    WHERE 1=1`;
  if (country) sql += ` AND ranking_country = @country`;
  if (title) sql += ` AND EXISTS (SELECT 1 FROM UNNEST(product_title) AS t WHERE t.name LIKE @title)`;
  if (category) sql += ` AND ranking_category = @category`;
  if (brand) sql += ` AND brand = @brand`;
  if (brandIsNull === 'true') sql += ` AND (brand IS NULL OR brand = '')`;
  if (start) sql += ` AND rank_timestamp >= @start`;
  if (end) sql += ` AND rank_timestamp <= @end`;
  if (minRank) sql += ` AND rank >= @minRank`;
  if (maxRank) sql += ` AND rank <= @maxRank`;
  if (minPrice) sql += ` AND price_range.min >= @minPrice`;
  if (maxPrice) sql += ` AND price_range.max <= @maxPrice`;
  sql += ` ORDER BY rank ASC LIMIT @limit`;

  // 参数化，所有参数都要有类型
  const params: any = {
    country: country || null,
    title: title ? `%${title}%` : null,
    category: category ? Number(category) : null,
    brand: brand || null,
    brandIsNull: brandIsNull === 'true',
    start: start || null,
    end: end || null,
    limit,
    minRank: minRank ? Number(minRank) : null,
    maxRank: maxRank ? Number(maxRank) : null,
    minPrice: minPrice ? Number(minPrice) : null,
    maxPrice: maxPrice ? Number(maxPrice) : null,
  };

  const types: any = {
    country: 'STRING',
    title: 'STRING',
    category: 'INT64',
    brand: 'STRING',
    brandIsNull: 'BOOL',
    start: 'TIMESTAMP',
    end: 'TIMESTAMP',
    limit: 'INT64',
    minRank: 'INT64',
    maxRank: 'INT64',
    minPrice: 'NUMERIC',
    maxPrice: 'NUMERIC',
  };

  // 连接BigQuery
  const credentials = JSON.parse(process.env.GCP_SERVICE_ACCOUNT_JSON!);
  const bigquery = new BigQuery({ projectId: credentials.project_id, credentials });

  const [rows] = await bigquery.query({
    query: sql,
    params,
    types,
    location: 'US',
  });

  return NextResponse.json(rows);
}