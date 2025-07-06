-- 查询 enriched 产品周排名数据
-- 这个查询会返回每个国家、类目、排名的最新数据

-- 方法1：使用窗口函数获取最新数据
WITH RankedData AS (
  SELECT 
    *,
    ROW_NUMBER() OVER (
      PARTITION BY country, category_id, rank 
      ORDER BY created_at DESC
    ) as rn
  FROM `gmc-bestseller.new_gmc_data.product_week_rank_enriched`
)
SELECT 
  rank_id,
  rank,
  product_title,
  category_id,
  country,
  image_url,
  search_title,
  search_link,
  rank_timestamp,
  created_at,
  updated_at
FROM RankedData
WHERE rn = 1
ORDER BY country, category_id, rank;

-- 方法2：使用 DISTINCT 获取唯一数据（如果不需要历史记录）
-- SELECT DISTINCT
--   rank,
--   product_title,
--   category_id,
--   country,
--   image_url,
--   search_title,
--   search_link,
--   rank_timestamp,
--   created_at,
--   updated_at
-- FROM `gmc-bestseller.new_gmc_data.product_week_rank_enriched`
-- ORDER BY country, category_id, rank;

-- 方法3：查询特定国家和类目的最新数据
-- SELECT 
--   rank,
--   product_title,
--   image_url,
--   search_title,
--   search_link,
--   rank_timestamp,
--   created_at
-- FROM `gmc-bestseller.new_gmc_data.product_week_rank_enriched`
-- WHERE country = 'US' 
--   AND category_id = 123
--   AND created_at = (
--     SELECT MAX(created_at) 
--     FROM `gmc-bestseller.new_gmc_data.product_week_rank_enriched`
--     WHERE country = 'US' AND category_id = 123
--   )
-- ORDER BY rank; 