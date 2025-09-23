import { NextRequest } from 'next/server';
import { BigQuery } from '@google-cloud/bigquery';

const credentialsJson = process.env.GCP_SERVICE_ACCOUNT_JSON;
if (!credentialsJson) throw new Error('GCP_SERVICE_ACCOUNT_JSON 环境变量未设置');
const credentials = JSON.parse(credentialsJson);
const bigquery = new BigQuery({ credentials });
const projectId = process.env.GCP_PROJECT_ID!;
const datasetId = 'new_gmc_data';
function getTableRef(period?: string) {
  const tableId = period === 'monthly' ? 'BestSellersProductClusterMonthly_479974220' : 'BestSellersProductClusterWeekly_479974220';
  return `\`${projectId}.${datasetId}.${tableId}\``;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const country = searchParams.get('country') || '';
  const category = searchParams.get('category') || '';
  const brand = searchParams.get('brand') || '';
  const noBrand = searchParams.get('noBrand') === 'true';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const relDemandChange = searchParams.get('relDemandChange') || '';
  const period = searchParams.get('period') || 'weekly';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
  const offset = (page - 1) * pageSize;

  const tableRef = getTableRef(period);
  let where = [];
  const params: any = {};
  if (country) { where.push('country_code = @country'); params.country = country; }
  if (category) { where.push('CAST(report_category_id AS STRING) = @category'); params.category = category; }
  if (brand) { where.push('brand = @brand'); params.brand = brand; }
  if (noBrand) { where.push('(brand IS NULL OR brand = "")'); }
  if (minPrice) { where.push('price_range.min_amount_micros >= @minPrice'); params.minPrice = Number(minPrice); }
  if (maxPrice) { where.push('price_range.max_amount_micros <= @maxPrice'); params.maxPrice = Number(maxPrice); }
  const minRank = searchParams.get('minRank') || '';
  const maxRank = searchParams.get('maxRank') || '';
  const minRelDemand = searchParams.get('minRelDemand') || '';
  const maxRelDemand = searchParams.get('maxRelDemand') || '';
  if (minRank) { where.push('rank >= @minRank'); params.minRank = Number(minRank); }
  if (maxRank) { where.push('rank <= @maxRank'); params.maxRank = Number(maxRank); }
  // relative_demand 现为字符串字段，去掉 min/max 数值过滤，改为模糊匹配
  if (minRelDemand) { where.push('LOWER(relative_demand) >= LOWER(@minRelDemand)'); params.minRelDemand = String(minRelDemand); }
  if (maxRelDemand) { where.push('LOWER(relative_demand) <= LOWER(@maxRelDemand)'); params.maxRelDemand = String(maxRelDemand); }
  const productTitle = searchParams.get('productTitle') || '';
  if (productTitle) {
    where.push('LOWER(title) LIKE LOWER(@productTitle)');
    params.productTitle = `%${productTitle}%`;
  }
  if (startDate) { where.push('DATE(_PARTITIONDATE) >= DATE(@startDate)'); params.startDate = startDate; }
  if (endDate) { where.push('DATE(_PARTITIONDATE) <= DATE(@endDate)'); params.endDate = endDate; }
  if (relDemandChange) { where.push('relative_demand_change = @relDemandChange'); params.relDemandChange = relDemandChange; }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const query = `
    SELECT
      rank,
      previous_rank,
      country_code,
      report_category_id,
      entity_id,
      title,
      brand,
      FORMAT('%s-%s %s', CAST(price_range.min_amount_micros AS STRING), CAST(price_range.max_amount_micros AS STRING), price_range.currency_code) AS price_range,
      CAST(relative_demand AS STRING) AS relative_demand,
      CAST(previous_relative_demand AS STRING) AS previous_relative_demand,
      CAST(relative_demand_change AS STRING) AS relative_demand_change,
      FORMAT_DATE('%Y-%m-%d', DATE(_PARTITIONDATE)) AS rank_timestamp
    FROM ${tableRef}
    ${whereClause}
    ORDER BY (previous_rank - rank) DESC
    LIMIT @pageSize OFFSET @offset
  `;
  params.pageSize = pageSize;
  params.offset = offset;

  // 统计总数
  const countQuery = `SELECT COUNT(1) as total FROM ${tableRef} ${whereClause}`;

  try {
    console.log('[TopGrowthProducts] SQL:', query.trim());
    console.log('[TopGrowthProducts] Params:', params);
    const [rows] = await bigquery.query({ query, params });
    console.log('[TopGrowthProducts] COUNT SQL:', countQuery.trim());
    console.log('[TopGrowthProducts] COUNT Params:', params);
    const [countRows] = await bigquery.query({ query: countQuery, params });
    const total = countRows[0]?.total || 0;
    return Response.json({ success: true, data: rows, total });
  } catch (err: any) {
    console.error('BigQuery error:', err);
    return Response.json({ success: false, error: err.message });
  }
}