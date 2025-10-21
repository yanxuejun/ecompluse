-- 创建 Product_Favorites 表
-- 用于存储用户收藏的产品信息

CREATE TABLE IF NOT EXISTS `gmc-bestseller.new_gmc_data.Product_Favorites` (
  -- 主键和用户信息
  id INT64 NOT NULL,
  userid STRING NOT NULL,           -- Clerk userId
  username STRING,                   -- 用户显示名称
  useremail STRING,                  -- 用户邮箱
  
  -- 产品信息
  rank INT64 NOT NULL,              -- 产品排名
  country_code STRING NOT NULL,      -- 国家代码
  categroy_id INT64 NOT NULL,       -- 类目ID
  brand STRING,                     -- 品牌
  title STRING NOT NULL,            -- 产品标题
  previous_rank INT64,              -- 之前排名
  price_range STRING,               -- 价格范围
  relative_demand STRING,           -- 相对需求
  relative_demand_change STRING,    -- 相对需求变化
  rank_timestamp TIMESTAMP,          -- 排名时间戳
  
  -- 系统字段
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY DATE(created_at)
CLUSTER BY userid, country_code, categroy_id
OPTIONS(
  description="用户收藏的产品信息表"
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_product_favorites_userid
ON `gmc-bestseller.new_gmc_data.Product_Favorites`(userid);

CREATE INDEX IF NOT EXISTS idx_product_favorites_userid_rank
ON `gmc-bestseller.new_gmc_data.Product_Favorites`(userid, rank);

CREATE INDEX IF NOT EXISTS idx_product_favorites_created_at
ON `gmc-bestseller.new_gmc_data.Product_Favorites`(created_at);

-- 设置主键（BigQuery 不支持传统主键，但可以设置唯一约束）
-- 注意：BigQuery 的流式插入不支持唯一约束，需要在应用层处理重复
