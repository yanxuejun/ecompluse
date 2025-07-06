# 产品周排名更新任务

这个任务用于从 BigQuery 获取产品排名数据，通过 Google Custom Search API 获取产品图片和详细信息，然后保存到数据库中。

## 功能

1. **从 BigQuery 获取数据**：获取指定国家和类目的排名前十产品
2. **Google 搜索**：为每个产品调用 Google Custom Search API 获取图片和链接
3. **数据库存储**：将结果保存到 `product_week_rank` 表中

## 环境变量配置

在 `.env` 文件中添加以下配置：

```env
# BigQuery 配置
GOOGLE_CLOUD_PROJECT_ID=your-project-id
BIGQUERY_DATASET_ID=your-dataset-id
BIGQUERY_TABLE_ID=your-table-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json

# Google Custom Search API 配置
GOOGLE_SEARCH_API_KEY=your-google-search-api-key
GOOGLE_SEARCH_ENGINE_ID=your-search-engine-id

# 数据库配置
DATABASE_URL=your-database-connection-string
```

## 使用方法

### 1. 运行数据库迁移

```bash
npm run db:migrate
```

### 2. 直接运行脚本

```bash
npm run update-product-rank
```

### 3. 通过 API 触发

```bash
# 启动任务
curl -X POST http://localhost:3001/api/update-product-rank

# 检查状态
curl http://localhost:3001/api/update-product-rank
```

## 配置说明

### BigQuery 配置

- `GOOGLE_CLOUD_PROJECT_ID`：Google Cloud 项目 ID
- `BIGQUERY_DATASET_ID`：BigQuery 数据集 ID
- `BIGQUERY_TABLE_ID`：BigQuery 表 ID
- `GOOGLE_APPLICATION_CREDENTIALS`：服务账户密钥文件路径

### Google Custom Search API 配置

1. **获取 API Key**：
   - 访问 [Google Cloud Console](https://console.cloud.google.com/)
   - 启用 Custom Search API
   - 创建 API Key

2. **创建搜索引擎**：
   - 访问 [Google Programmable Search Engine](https://programmablesearchengine.google.com/)
   - 创建新的搜索引擎
   - 获取搜索引擎 ID

### 任务配置

在 `scripts/config.js` 中可以修改：

- `country`：国家代码（默认：'US'）
- `categoryId`：类目 ID（默认：609）
- `limit`：获取的产品数量（默认：10）
- `delayBetweenRequests`：请求间隔（默认：1000ms）

## 数据库表结构

```sql
CREATE TABLE product_week_rank (
  id SERIAL PRIMARY KEY,
  rank INTEGER NOT NULL,
  product_title TEXT NOT NULL,
  category_id INTEGER NOT NULL,
  image_url TEXT,
  search_title TEXT,
  search_link TEXT,
  country TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 输出示例

```
Starting product week rank update...
Country: US, Category ID: 609
BigQuery: your-project.your-dataset.your-table
Fetching top 10 products for country: US, category: 609
Found 10 products
Processing product 1/10: Wireless Bluetooth Headphones
Searching for: Wireless Bluetooth Headphones
Processing product 2/10: Smart Fitness Tracker
Searching for: Smart Fitness Tracker
...
Saving 10 products to database
Successfully saved 10 products
Product week rank update completed successfully!

Results Summary:
1. Wireless Bluetooth Headphones
   Rank: 1
   Image: Found
   Search Title: Wireless Bluetooth Headphones - Amazon.com

2. Smart Fitness Tracker
   Rank: 2
   Image: Found
   Search Title: Smart Fitness Tracker - Best Buy
...
```

## 错误处理

- **BigQuery 连接错误**：检查服务账户密钥和项目配置
- **Google Search API 错误**：检查 API Key 和搜索引擎 ID
- **数据库错误**：检查数据库连接和表结构

## 注意事项

1. **API 限制**：Google Custom Search API 有每日配额限制
2. **请求延迟**：脚本在请求之间添加延迟以避免触发限制
3. **数据清理**：每次运行会清除旧数据并插入新数据
4. **错误恢复**：如果中途失败，可以重新运行脚本 