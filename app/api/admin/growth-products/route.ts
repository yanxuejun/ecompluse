import { NextRequest } from 'next/server';
import { BigQuery } from '@google-cloud/bigquery';

const credentialsJson = process.env.GCP_SERVICE_ACCOUNT_JSON;
if (!credentialsJson) throw new Error('GCP_SERVICE_ACCOUNT_JSON 环境变量未设置');
const credentials = JSON.parse(credentialsJson);
const bigquery = new BigQuery({ credentials });
const projectId = process.env.GCP_PROJECT_ID!;
const datasetId = 'new_gmc_data';
const tableId = 'BestSellers_TopProducts_479974220';
const tableRef = `
  ${'`'}${projectId}.${datasetId}.${tableId}${'`'}
`;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const country = searchParams.get('country') || '';
  const category = searchParams.get('category') || '';
  const brand = searchParams.get('brand') || '';
  const noBrand = searchParams.get('noBrand') === 'true';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
  const offset = (page - 1) * pageSize;

  let where = [];
  const params: any = {};
  if (country) { where.push('ranking_country = @country'); params.country = country; }
  if (category) { where.push('CAST(ranking_category AS STRING) = @category'); params.category = category; }
  if (brand) { where.push('brand = @brand'); params.brand = brand; }
  if (noBrand) { where.push('(brand IS NULL OR brand = "")'); }
  if (minPrice) { where.push('price_range.min >= @minPrice'); params.minPrice = Number(minPrice); }
  if (maxPrice) { where.push('price_range.max <= @maxPrice'); params.maxPrice = Number(maxPrice); }
  const minRank = searchParams.get('minRank') || '';
  const maxRank = searchParams.get('maxRank') || '';
  const minRelDemand = searchParams.get('minRelDemand') || '';
  const maxRelDemand = searchParams.get('maxRelDemand') || '';
  if (minRank) { where.push('rank >= @minRank'); params.minRank = Number(minRank); }
  if (maxRank) { where.push('rank <= @maxRank'); params.maxRank = Number(maxRank); }
  if (minRelDemand) { where.push('relative_demand.min >= @minRelDemand'); params.minRelDemand = Number(minRelDemand); }
  if (maxRelDemand) { where.push('relative_demand.max <= @maxRelDemand'); params.maxRelDemand = Number(maxRelDemand); }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const query = `
    SELECT
      rank,
      previous_rank,
      ranking_country,
      ranking_category,
      rank_id,
      product_title,
      brand,
      FORMAT('%s-%s %s', CAST(price_range.min AS STRING), CAST(price_range.max AS STRING), price_range.currency) AS price_range,
      FORMAT('%s-%s %s', CAST(relative_demand.min AS STRING), CAST(relative_demand.max AS STRING), relative_demand.bucket) AS relative_demand,
      FORMAT_DATE('%Y-%m-%d', DATE(rank_timestamp)) AS rank_timestamp
    FROM ${tableRef.trim()}
    ${whereClause}
    ORDER BY (previous_rank - rank) DESC
    LIMIT @pageSize OFFSET @offset
  `;
  params.pageSize = pageSize;
  params.offset = offset;

  // 统计总数
  const countQuery = `SELECT COUNT(1) as total FROM ${tableRef.trim()} ${whereClause}`;

  try {
    const [rows] = await bigquery.query({ query, params });
    const [countRows] = await bigquery.query({ query: countQuery, params });
    const total = countRows[0]?.total || 0;
    return Response.json({ success: true, data: rows, total });
  } catch (err: any) {
    console.error('BigQuery error:', err);
    return Response.json({ success: false, error: err.message });
  }
} 