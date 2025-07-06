import { NextRequest, NextResponse } from 'next/server';
import { BigQuery } from '@google-cloud/bigquery';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // 查询参数
  const country = searchParams.get('country');
  const title = searchParams.get('title');
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const category = searchParams.get('category');
  const brand = searchParams.get('brand');
  const brandIsNull = searchParams.get('brandIsNull');
  const minRank = searchParams.get('minRank');
  const maxRank = searchParams.get('maxRank');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const page = Number(searchParams.get('page') || 1);
  const pageSize = Number(searchParams.get('pageSize') || 10);

  // 构建WHERE条件
  let where = 'WHERE 1=1';
  if (country) where += ` AND ranking_country = @country`;
  if (title) where += ` AND EXISTS (SELECT 1 FROM UNNEST(product_title) AS t WHERE t.name LIKE @title)`;
  if (category) where += ` AND ranking_category = @category`;
  if (brand) where += ` AND brand = @brand`;
  if (brandIsNull === 'true') where += ` AND (brand IS NULL OR brand = '')`;
  if (start) where += ` AND rank_timestamp >= @start`;
  if (end) where += ` AND rank_timestamp <= @end`;
  if (minRank) where += ` AND rank >= @minRank`;
  if (maxRank) where += ` AND rank <= @maxRank`;
  if (minPrice) where += ` AND price_range.min >= @minPrice`;
  if (maxPrice) where += ` AND price_range.max <= @maxPrice`;

  // 查询总数
  const countSql = `
    SELECT COUNT(*) as total
    FROM \`new_gmc_data.BestSellers_TopProducts_Optimized\`
    ${where}
  `;

  // 查询当前页数据
  const dataSql = `
    SELECT 
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
    FROM \`new_gmc_data.BestSellers_TopProducts_Optimized\`
    ${where}
    ORDER BY rank ASC
    LIMIT @pageSize OFFSET @offset
  `;

  // 参数
  const params: any = {
    country: country || null,
    title: title ? `%${title}%` : null,
    category: category ? Number(category) : null,
    brand: brand || null,
    brandIsNull: brandIsNull === 'true',
    start: start || null,
    end: end || null,
    minRank: minRank ? Number(minRank) : null,
    maxRank: maxRank ? Number(maxRank) : null,
    minPrice: minPrice ? Number(minPrice) : null,
    maxPrice: maxPrice ? Number(maxPrice) : null,
    pageSize,
    offset: (page - 1) * pageSize,
  };

  console.log('🔍 BigQuery Sync API - Count Query:');
  console.log(countSql);
  console.log('🔍 BigQuery Sync API - Data Query:');
  console.log(dataSql);
  console.log('📊 Query Parameters:', params);

  const types: any = {
    country: 'STRING',
    title: 'STRING',
    category: 'INT64',
    brand: 'STRING',
    brandIsNull: 'BOOL',
    start: 'TIMESTAMP',
    end: 'TIMESTAMP',
    minRank: 'INT64',
    maxRank: 'INT64',
    minPrice: 'NUMERIC',
    maxPrice: 'NUMERIC',
    pageSize: 'INT64',
    offset: 'INT64',
  };

  // 连接BigQuery
  const credentials = JSON.parse(process.env.GCP_SERVICE_ACCOUNT_JSON!);
  const bigquery = new BigQuery({ projectId: credentials.project_id, credentials });

  // 查询总数
  const [countRows] = await bigquery.query({
    query: countSql,
    params,
    types,
    location: 'US',
  });
  const total = countRows[0]?.total || 0;

  // 查询当前页数据
  const [dataRows] = await bigquery.query({
    query: dataSql,
    params,
    types,
    location: 'US',
  });

  return NextResponse.json({ data: dataRows, total });
}