-- 创建产品趋势强度分析表
CREATE TABLE IF NOT EXISTS `your-project-id.your-dataset.product_momentum_analysis` (
  -- 产品基本信息
  product_title STRING NOT NULL,
  current_rank INT64,
  previous_rank INT64,
  rank_change INT64,
  
  -- 需求变化
  current_relative_demand FLOAT64,
  previous_relative_demand FLOAT64,
  demand_change FLOAT64,
  
  -- 趋势分析
  momentum_score FLOAT64,
  trend_type STRING,
  
  -- 地理位置和分类
  country STRING NOT NULL,
  category_id STRING NOT NULL,
  
  -- 图片信息
  image_url STRING,
  search_title STRING,
  search_link STRING,
  
  -- 时间戳
  analysis_timestamp TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- 创建分区表（按分析时间分区）
CREATE TABLE IF NOT EXISTS `your-project-id.your-dataset.product_momentum_analysis_partitioned`
PARTITION BY DATE(analysis_timestamp)
AS SELECT * FROM `your-project-id.your-dataset.product_momentum_analysis` WHERE FALSE;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS momentum_analysis_trend_type_idx 
ON `your-project-id.your-dataset.product_momentum_analysis` (trend_type);

CREATE INDEX IF NOT EXISTS momentum_analysis_country_category_idx 
ON `your-project-id.your-dataset.product_momentum_analysis` (country, category_id);

CREATE INDEX IF NOT EXISTS momentum_analysis_momentum_score_idx 
ON `your-project-id.your-dataset.product_momentum_analysis` (momentum_score DESC);

-- 查询示例：获取火箭式上升产品
-- SELECT 
--   product_title,
--   current_rank,
--   previous_rank,
--   rank_change,
--   current_relative_demand,
--   previous_relative_demand,
--   demand_change,
--   momentum_score,
--   image_url
-- FROM `your-project-id.your-dataset.product_momentum_analysis`
-- WHERE trend_type = 'ROCKET_RISING'
--   AND country = 'US'
--   AND category_id = 'your-category-id'
-- ORDER BY momentum_score DESC
-- LIMIT 10;

-- 查询示例：获取热度飙升榜
-- SELECT 
--   product_title,
--   current_rank,
--   demand_change,
--   current_relative_demand,
--   image_url
-- FROM `your-project-id.your-dataset.product_momentum_analysis`
-- WHERE demand_change > 0
--   AND country = 'US'
--   AND category_id = 'your-category-id'
-- ORDER BY demand_change DESC
-- LIMIT 10;

-- 查询示例：趋势分布统计
-- SELECT 
--   trend_type,
--   COUNT(*) as count
-- FROM `your-project-id.your-dataset.product_momentum_analysis`
-- WHERE country = 'US'
--   AND category_id = 'your-category-id'
--   AND DATE(analysis_timestamp) = CURRENT_DATE()
-- GROUP BY trend_type
-- ORDER BY count DESC; 