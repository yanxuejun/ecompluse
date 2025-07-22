import { NextRequest } from 'next/server';
import { BigQuery } from '@google-cloud/bigquery';
import { stringify } from 'csv-stringify/sync';
import fs from 'fs';
import path from 'path';

const credentialsJson = process.env.GCP_SERVICE_ACCOUNT_JSON;
const credentials = JSON.parse(credentialsJson!);
const bigquery = new BigQuery({ credentials });
const projectId = process.env.GCP_PROJECT_ID!;
const datasetId = 'new_gmc_data';
const tableId = 'BestSellers_TopProducts_479974220';

const BATCH_SIZE = 10000;
const MAX_ROWS = 500000;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const country = searchParams.get('country') || '';
  const category = searchParams.get('category') || '';

  let where = [];
  const params: any = {};
  if (country) { where.push('ranking_country = @country'); params.country = country; }
  if (category) { where.push('CAST(ranking_category AS STRING) = @category'); params.category = category; }
  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const tableRef = `\`${projectId}.${datasetId}.${tableId}\``;

  // 生成日期目录
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);
  const exportDir = path.join(process.cwd(), 'exports', dateStr);
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }
  const fileName = `export_${country || 'all'}_${category || 'all'}_${Date.now()}.csv`;
  const filePath = path.join(exportDir, fileName);

  let totalRows = 0;
  let offset = 0;
  let isFirstBatch = true;

  try {
    while (totalRows < MAX_ROWS) {
      const batchQuery = `
        SELECT
          rank, previous_rank, ranking_country, ranking_category, 
          ARRAY(SELECT name FROM UNNEST(product_title) WHERE locale = 'en' LIMIT 1)[SAFE_OFFSET(0)]
            AS product_title_en,
          ARRAY(SELECT name FROM UNNEST(product_title) WHERE locale = 'zh-CN' LIMIT 1)[SAFE_OFFSET(0)]
            AS product_title_zh,
          ARRAY(SELECT name FROM UNNEST(product_title) LIMIT 1)[SAFE_OFFSET(0)]
            AS product_title_any,
          brand,
          FORMAT('%s-%s %s', CAST(price_range.min AS STRING), CAST(price_range.max AS STRING), price_range.currency) AS price_range,
          FORMAT('%s-%s %s', CAST(relative_demand.min AS STRING), CAST(relative_demand.max AS STRING), relative_demand.bucket) AS relative_demand,
          FORMAT('%s-%s %s', CAST(previous_relative_demand.min AS STRING), CAST(previous_relative_demand.max AS STRING), previous_relative_demand.bucket) AS previous_relative_demand,
          FORMAT_DATE('%Y-%m-%d', DATE(rank_timestamp)) AS rank_timestamp
        FROM ${tableRef}
        ${whereClause}
        ORDER BY rank ASC
        LIMIT @batchSize OFFSET @offset
      `;
      const batchParams = { ...params, batchSize: BATCH_SIZE, offset };
      const [rows] = await bigquery.query({ query: batchQuery, params: batchParams });
      if (rows.length === 0) break;

      // 合并 product_title 字段
      const processedRows = rows.map((row: any) => ({
        ...row,
        product_title: row.product_title_en || row.product_title_zh || row.product_title_any || '',
      }));
      // 写入CSV
      const csv = stringify(processedRows, { header: isFirstBatch });
      if (isFirstBatch) {
        fs.writeFileSync(filePath, csv);
        isFirstBatch = false;
      } else {
        fs.appendFileSync(filePath, csv.replace(/^[^\n]*\n/, ''));
      }

      totalRows += rows.length;
      offset += BATCH_SIZE;
      if (rows.length < BATCH_SIZE) break;
    }

    return new Response(JSON.stringify({ success: true, file: `/exports/${dateStr}/${fileName}`, totalRows: Math.min(totalRows, MAX_ROWS) }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response('Error: ' + err.message, { status: 500 });
  }
} 