-- 创建高级产品趋势强度分析表
CREATE TABLE IF NOT EXISTS `your-project-id.your-dataset.product_advanced_momentum_analysis` (
  -- 产品基本信息
  product_title STRING NOT NULL,
  current_rank INT64,
  previous_rank INT64,
  
  -- 动态计算的排名改善
  rank_improvement INT64,
  
  -- 需求数据
  current_relative_demand FLOAT64,
  previous_relative_demand FLOAT64,
  demand_change FLOAT64,
  
  -- 趋势分析
  momentum_score FLOAT64,
  trend_type STRING,
  
  -- 时间分析
  days_between_rankings INT64,
  
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
CREATE TABLE IF NOT EXISTS `your-project-id.your-dataset.product_advanced_momentum_analysis_partitioned`
PARTITION BY DATE(analysis_timestamp)
AS SELECT * FROM `your-project-id.your-dataset.product_advanced_momentum_analysis` WHERE FALSE;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS advanced_momentum_trend_type_idx 
ON `your-project-id.your-dataset.product_advanced_momentum_analysis` (trend_type);

CREATE INDEX IF NOT EXISTS advanced_momentum_country_category_idx 
ON `your-project-id.your-dataset.product_advanced_momentum_analysis` (country, category_id);

CREATE INDEX IF NOT EXISTS advanced_momentum_momentum_score_idx 
ON `your-project-id.your-dataset.product_advanced_momentum_analysis` (momentum_score DESC);

CREATE INDEX IF NOT EXISTS advanced_momentum_rank_improvement_idx 
ON `your-project-id.your-dataset.product_advanced_momentum_analysis` (rank_improvement DESC);

-- 查询示例：获取火箭式上升产品（排名改善 + 需求增长）
SELECT 
  product_title,
  current_rank,
  previous_rank,
  rank_improvement,
  current_relative_demand,
  previous_relative_demand,
  demand_change,
  momentum_score,
  days_between_rankings,
  image_url
FROM `your-project-id.your-dataset.product_advanced_momentum_analysis`
WHERE trend_type = 'ROCKET_RISING'
  AND country = 'US'
  AND category_id = '1'
  AND rank_improvement > 0
  AND demand_change > 0
ORDER BY momentum_score DESC
LIMIT 10;

-- 查询示例：获取排名改善最大的产品
SELECT 
  product_title,
  current_rank,
  previous_rank,
  rank_improvement,
  momentum_score,
  trend_type
FROM `your-project-id.your-dataset.product_advanced_momentum_analysis`
WHERE country = 'US'
  AND category_id = '1'
  AND rank_improvement > 0
ORDER BY rank_improvement DESC
LIMIT 10;

-- 查询示例：获取需求增长最大的产品
SELECT 
  product_title,
  current_rank,
  demand_change,
  current_relative_demand,
  previous_relative_demand,
  momentum_score
FROM `your-project-id.your-dataset.product_advanced_momentum_analysis`
WHERE country = 'US'
  AND category_id = '1'
  AND demand_change > 0
ORDER BY demand_change DESC
LIMIT 10;

-- 查询示例：趋势分布统计
SELECT 
  trend_type,
  COUNT(*) as count,
  AVG(momentum_score) as avg_momentum_score,
  AVG(rank_improvement) as avg_rank_improvement,
  AVG(demand_change) as avg_demand_change,
  AVG(days_between_rankings) as avg_days_between_rankings
FROM `your-project-id.your-dataset.product_advanced_momentum_analysis`
WHERE country = 'US'
  AND category_id = '1'
  AND DATE(analysis_timestamp) = CURRENT_DATE()
GROUP BY trend_type
ORDER BY count DESC;

-- 查询示例：获取最近7天的趋势变化
SELECT 
  DATE(analysis_timestamp) as analysis_date,
  trend_type,
  COUNT(*) as count,
  AVG(momentum_score) as avg_momentum_score
FROM `your-project-id.your-dataset.product_advanced_momentum_analysis`
WHERE country = 'US'
  AND category_id = '1'
  AND analysis_timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
GROUP BY analysis_date, trend_type
ORDER BY analysis_date DESC, count DESC;

-- 查询示例：获取动量分数最高的产品
SELECT 
  product_title,
  current_rank,
  previous_rank,
  rank_improvement,
  demand_change,
  momentum_score,
  trend_type,
  days_between_rankings
FROM `your-project-id.your-dataset.product_advanced_momentum_analysis`
WHERE country = 'US'
  AND category_id = '1'
  AND momentum_score > 0
ORDER BY momentum_score DESC
LIMIT 20; 