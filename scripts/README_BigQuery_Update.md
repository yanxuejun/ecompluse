# BigQuery 数据更新脚本使用说明

## 概述

修改后的 `update-product-week-rank.js` 脚本现在将数据插入到 BigQuery 表中，而不是本地数据库。

## 主要变更

### 1. 数据流向变更
- **之前**: BigQuery → 本地数据库 (Prisma)
- **现在**: BigQuery → BigQuery (新表 `product_week_rank_enriched`)

### 2. 目标表结构
新的 `product_week_rank_enriched` 表包含以下字段：

```sql
CREATE TABLE `gmc-bestseller.new_gmc_data.product_week_rank_enriched` (
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
```

## 使用步骤

### 1. 创建目标表
首先运行 SQL 脚本创建目标表：

```bash
# 在 BigQuery 控制台中运行
bq query --use_legacy_sql=false < scripts/create-enriched-table.sql
```

### 2. 配置环境变量
确保 `.env` 文件包含必要的配置：

```env
# BigQuery 配置
GOOGLE_CLOUD_PROJECT_ID=gmc-bestseller
BIGQUERY_DATASET_ID=new_gmc_data
BIGQUERY_TABLE_ID=BestSellers_TopProducts_Optimized

# Google Search API 配置
GOOGLE_SEARCH_API_KEY=your-api-key
GOOGLE_SEARCH_ENGINE_ID=your-engine-id

# Google Cloud Service Account
GCP_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

# 任务配置（可选）
TASK_COUNTRY=US
TASK_CATEGORY_ID=1253
TASK_LIMIT=10
TASK_DELAY=1000
```

### 3. 查看当前配置
```bash
node scripts/show-config.js
```

### 4. 查看可用的 Category ID
```bash
node scripts/list-categories.js
```

### 5. 运行脚本
```bash
node scripts/update-product-week-rank.js
```

## 脚本功能

### 数据流程
1. **从源表读取**: 从 `BestSellers_TopProducts_Optimized` 表读取排名数据
2. **API 调用**: 为每个产品调用 Google Custom Search API 获取图片和详细信息
3. **数据插入**: 将增强后的数据插入到 `product_week_rank_enriched` 表

### 数据管理
- **注意**: BigQuery 流式缓冲区不支持 DELETE 操作
- 脚本会直接插入新数据，保留历史记录
- 查询时使用窗口函数获取最新数据（见 `query-enriched-data.sql`）

## 性能优化

### 1. 分区和集群
- 表按日期分区 (`created_at`)
- 按 `country`, `category_id`, `rank` 集群
- 提高查询性能

### 2. 索引
- 创建了复合索引 `idx_product_week_rank_enriched_country_category`
- 创建了时间索引 `idx_product_week_rank_enriched_created_at`

## 监控和调试

### 1. 日志输出
脚本会输出详细的执行日志：
- 读取的产品数量
- API 调用状态
- 插入的数据量
- Job ID（用于跟踪 BigQuery 作业）

### 2. 错误处理
- BigQuery 连接错误
- API 调用失败
- 数据插入失败

## 部署到 Vercel

### 1. 更新 API 路由
修改 `app/api/cron/update-product-week-rank/route.ts` 以使用新的 BigQuery 插入逻辑。

### 2. 环境变量
在 Vercel 项目设置中添加所有必要的环境变量。

### 3. 权限设置
确保服务账户有 BigQuery 的读写权限：
- BigQuery Data Editor
- BigQuery Job User

## 注意事项

1. **API 限制**: Google Custom Search API 有调用限制，脚本包含延迟机制
2. **BigQuery 限制**: 流式缓冲区不支持 DELETE 操作，会保留历史数据
3. **成本控制**: BigQuery 插入操作会产生费用，注意监控使用量
4. **数据查询**: 使用 `query-enriched-data.sql` 中的查询获取最新数据
5. **错误恢复**: 如果脚本中断，可以重新运行，会直接插入新数据

## 故障排除

### 常见问题
1. **权限错误**: 检查服务账户权限
2. **表不存在**: 先运行 `create-enriched-table.sql`
3. **API 限制**: 增加 `delayBetweenRequests` 配置
4. **网络错误**: 检查网络连接和防火墙设置 