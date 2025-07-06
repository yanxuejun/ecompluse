-- 创建 enriched 产品周排名表
-- 这个表包含从原始数据中提取的产品信息，以及通过 Google Search API 获取的额外信息

CREATE TABLE IF NOT EXISTS `gmc-bestseller.new_gmc_data.product_week_rank_enriched` (
  -- 基础信息
  rank_id STRING,
  rank INT64,
  product_title STRING,
  category_id INT64,
  country STRING,
  
  -- Google Search API 获取的额外信息
  image_url STRING,
  search_title STRING,
  search_link STRING,
  
  -- 时间戳
  rank_timestamp TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
PARTITION BY DATE(created_at)
CLUSTER BY country, category_id, rank
OPTIONS(
  description="Enriched product week rank data with Google Search API information"
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_product_week_rank_enriched_country_category
ON `gmc-bestseller.new_gmc_data.product_week_rank_enriched`(country, category_id, rank);

CREATE INDEX IF NOT EXISTS idx_product_week_rank_enriched_created_at
ON `gmc-bestseller.new_gmc_data.product_week_rank_enriched`(created_at);

CREATE INDEX IF NOT EXISTS idx_product_week_rank_enriched_rank_timestamp
ON `gmc-bestseller.new_gmc_data.product_week_rank_enriched`(rank_timestamp); 