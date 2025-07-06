-- 简化版：创建 enriched 产品周排名表
-- 只包含基本的表结构，不包含索引

CREATE TABLE IF NOT EXISTS `gmc-bestseller.new_gmc_data.product_week_rank_enriched` (
  rank_id STRING,
  rank INT64,
  product_title STRING,
  category_id INT64,
  country STRING,
  image_url STRING,
  search_title STRING,
  search_link STRING,
  rank_timestamp TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
PARTITION BY DATE(created_at)
CLUSTER BY country, category_id, rank
OPTIONS(
  description="Enriched product week rank data with Google Search API information"
); 