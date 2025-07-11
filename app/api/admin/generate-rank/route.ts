import { NextRequest, NextResponse } from "next/server";
import { BigQuery } from "@google-cloud/bigquery";

const projectId = process.env.GCP_PROJECT_ID!;
const datasetId = process.env.GCP_DATASET_ID!;
const serviceAccountJson = process.env.GCP_SERVICE_ACCOUNT_JSON!;
const googleApiKey = process.env.GOOGLE_SEARCH_API_KEY!;
const googleEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID!;

function getBigQueryClient() {
  return new BigQuery({
    projectId,
    credentials: JSON.parse(serviceAccountJson),
  });
}

async function searchGoogleImage(title: string) {
  const url = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleEngineId}&q=${encodeURIComponent(
    title
  )}&searchType=image&num=1`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.items && data.items.length > 0) {
    return {
      image_url: data.items[0].link,
      search_link: data.items[0].image.contextLink,
      search_title: data.items[0].title,
    };
  }
  return { image_url: "", search_link: "", search_title: "" };
}

export async function POST(req: NextRequest) {
  try {
    const { country, category, topN } = await req.json();
    const bq = getBigQueryClient();

    // 查询Top N
    const [rows] = await bq.query({
      query: `
        SELECT
          rank_id, rank, product_title, category_id, country, rank_timestamp, previous_rank
        FROM \`${projectId}.${datasetId}.BestSellers_TopProducts_479974220\`
        WHERE country = @country AND category_id = @category
        ORDER BY previous_rank - rank DESC
        LIMIT @topN
      `,
      params: { country, category, topN },
    });

    // 组装插入数据
    const enrichedRows = await Promise.all(
      rows.map(async (row: any, idx: number) => {
        const google = await searchGoogleImage(row.product_title);
        return {
          ...row,
          image_url: google.image_url,
          search_link: google.search_link,
          search_title: google.search_title,
          rank_improvement: row.previous_rank - row.rank,
          rank_type: 1,
          rank_order: idx + 1,
        };
      })
    );

    // 插入到 enriched 表
    await bq.dataset(datasetId).table("product_week_rank_enriched").insert(enrichedRows);

    return NextResponse.json({ success: true, count: enrichedRows.length });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || String(e) }, { status: 500 });
  }
} 