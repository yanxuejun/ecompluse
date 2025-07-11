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
    const { country, category, topN, isFastest } = await req.json();
    const categoryNum = Number(category);
    const bq = getBigQueryClient();

    const orderBy = isFastest ? 'ORDER BY previous_rank - rank DESC' : 'ORDER BY rank ASC';
    const sql = `
        SELECT
          rank_id, rank, product_title, ranking_category, ranking_country, rank_timestamp, previous_rank
        FROM \`${projectId}.${datasetId}.BestSellers_TopProducts_479974220\`
        WHERE ranking_country = @country AND ranking_category = @category
        ${orderBy}
        LIMIT @topN
      `;
    console.log("BigQuery SQL:", sql);
    console.log("BigQuery Params:", { country, category: categoryNum, topN });
    const [rows] = await bq.query({
      query: sql,
      params: { country, category: categoryNum, topN },
    });

    // 组装插入数据
    const enrichedRows = await Promise.all(
      rows.map(async (row: any, idx: number) => {
        const google = await searchGoogleImage(
          Array.isArray(row.product_title) && row.product_title.length > 0
            ? row.product_title[0].name
            : String(row.product_title || "")
        );
        return {
          rank_id: String(row.rank_id),
          rank: Number(row.rank),
          product_title: Array.isArray(row.product_title) && row.product_title.length > 0
            ? String(row.product_title[0].name)
            : "",
          category_id: Number(row.ranking_category),
          country: String(row.ranking_country),
          image_url: google.image_url,
          search_link: google.search_link,
          search_title: google.search_title,
          rank_timestamp: row.rank_timestamp,
          previous_rank: Number(row.previous_rank),
          rank_improvement: Number(row.previous_rank) - Number(row.rank),
          rank_type: "1",
          rank_order: String(idx + 1),
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