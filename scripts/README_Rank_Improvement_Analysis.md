# 排名上升分析 (Rank Improvement Analysis)

## 功能概述

排名上升分析专门用于识别和分析产品排名改善情况，重点关注"火箭式上升"的产品。直接使用 `BestSellers_TopProducts_Optimized` 表中的 `rank_improvement` 字段，按降序排列，找出排名上升幅度最大的产品。

## 核心特性

### 🚀 火箭式上升识别
- **数据来源**: 直接使用表中的 `rank_improvement` 字段
- **筛选条件**: 只显示排名上升的产品 (`rank_improvement > 0`)
- **排序方式**: 按排名改善幅度降序排列
- **默认显示**: 前10名产品
- **全分类模式**: 当 `categoryId=123456` 时，检索所有分类的排名上升产品

### 📊 统计分析
- 总产品数量统计
- 上升/下降/稳定产品数量
- 平均排名改善幅度
- 最大/最小排名改善

### 🖼️ 数据丰富
- 自动获取产品图片
- 相对需求分析
- 数据时间显示
- 分类信息显示（全分类模式）

## 文件结构

```
scripts/
├── rank-improvement-analysis.js    # 主要分析脚本
└── README_Rank_Improvement_Analysis.md  # 说明文档

app/
├── api/rank-improvement/
│   └── route.ts                   # API 路由
└── rank-improvement/
    └── page.tsx                   # 前端页面
```

## 使用方法

### 1. 运行分析脚本

```bash
# 使用默认配置运行
node scripts/rank-improvement-analysis.js

# 或者在其他脚本中调用
const { performRankImprovementAnalysis } = require('./rank-improvement-analysis');
await performRankImprovementAnalysis();
```

### 2. 配置参数

在 `config.js` 中设置：

```javascript
module.exports = {
  task: {
    country: 'US',           // 国家代码
    categoryId: '1',         // 分类ID
    limit: 10               // 显示数量
  },
  bigquery: {
    projectId: 'your-project-id',
    datasetId: 'your-dataset-id',
    tableId: 'BestSellers_TopProducts_Optimized'
  },
  googleSearch: {
    apiKey: 'your-api-key',
    engineId: 'your-engine-id'
  }
};
```

### 3. 访问前端页面

```
# 特定分类
http://localhost:3000/rank-improvement?country=US&categoryId=1

# 所有分类
http://localhost:3000/rank-improvement?country=US&categoryId=123456
```

## API 接口

### GET /api/rank-improvement

获取排名上升分析数据

**参数:**
- `country` (string): 国家代码，默认 'US'
- `categoryId` (string): 分类ID，默认 '1'。使用 '123456' 检索所有分类
- `limit` (number): 显示数量，默认 10

**返回:**
```json
{
  "success": true,
  "data": [
    {
      "productTitle": "产品名称",
      "currentRank": 5,
      "previousRank": 15,
      "rankImprovement": 10,
      "currentRelativeDemand": 85.5,
      "previousRelativeDemand": 85.5,
      "demandChange": 0,
      "daysBetweenRankings": 7,
      "currentTimestamp": "2024-01-15T10:00:00Z",
      "previousTimestamp": "2024-01-15T10:00:00Z"
    }
  ],
  "count": 10,
  "filters": {
    "country": "US",
    "categoryId": "1",
    "limit": 10,
    "daysBack": 7
  }
}
```

### POST /api/rank-improvement

获取排名变化统计信息

**请求体:**
```json
{
  "country": "US",
  "categoryId": "1"
}
```

**返回:**
```json
{
  "success": true,
  "data": {
    "total_products": 100,
    "rising_products": 25,
    "declining_products": 30,
    "stable_products": 45,
    "avg_rank_improvement": 5.2,
    "max_rank_improvement": 15,
    "min_rank_improvement": 1
  }
}
```

## SQL 查询逻辑

### 核心查询

```sql
SELECT 
  COALESCE(
    (SELECT name FROM UNNEST(product_title) WHERE locale = 'en'),
    (SELECT name FROM UNNEST(product_title) LIMIT 1)
  ) AS product_title,
  rank AS current_rank,
  rank_improvement,
  relative_demand AS current_relative_demand,
  rank_timestamp
FROM `project.dataset.table`
WHERE ranking_country = @country 
  AND ranking_category = @categoryId
  AND rank_improvement > 0  -- 只选择排名上升的产品
  AND rank_timestamp = (
    SELECT MAX(rank_timestamp) 
    FROM `project.dataset.table`
    WHERE ranking_country = @country 
      AND ranking_category = @categoryId
  )
ORDER BY rank_improvement DESC  -- 按排名改善降序排序
LIMIT @limit
```

### 统计查询

```sql
SELECT 
  COUNT(*) as total_products,
  COUNT(CASE WHEN rank_improvement > 0 THEN 1 END) as rising_products,
  COUNT(CASE WHEN rank_improvement < 0 THEN 1 END) as declining_products,
  COUNT(CASE WHEN rank_improvement = 0 THEN 1 END) as stable_products,
  AVG(CASE WHEN rank_improvement > 0 THEN rank_improvement END) as avg_rank_improvement,
  MAX(CASE WHEN rank_improvement > 0 THEN rank_improvement END) as max_rank_improvement,
  MIN(CASE WHEN rank_improvement > 0 THEN rank_improvement END) as min_rank_improvement
FROM `project.dataset.table`
WHERE ranking_country = @country 
  AND ranking_category = @categoryId
  AND rank_timestamp = (
    SELECT MAX(rank_timestamp) 
    FROM `project.dataset.table`
    WHERE ranking_country = @country 
      AND ranking_category = @categoryId
  )
```

## 数据存储

分析结果保存到 `product_momentum_analysis` 表：

```sql
CREATE TABLE IF NOT EXISTS `project.dataset.product_momentum_analysis` (
  product_title STRING,
  current_rank INT64,
  previous_rank INT64,
  rank_improvement INT64,
  current_relative_demand FLOAT64,
  previous_relative_demand FLOAT64,
  demand_change FLOAT64,
  momentum_score FLOAT64,
  trend_type STRING,
  days_between_rankings INT64,
  country STRING,
  category_id STRING,
  analysis_timestamp TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## 前端功能

### 页面特性
- 🎨 现代化 UI 设计
- 📊 实时数据展示
- 🔄 动态筛选功能
- 📱 响应式布局
- ⚡ 快速加载

### 显示内容
- 排名变化统计卡片
- 火箭式上升产品榜
- 详细产品信息卡片
- 排名改善可视化
- 相对需求分析
- 分类信息显示（全分类模式）

## 使用场景

### 1. 产品趋势分析
- 识别快速上升的产品
- 分析市场热点变化
- 预测产品发展趋势

### 2. 竞争情报
- 监控竞争对手产品表现
- 发现新兴产品机会
- 制定产品策略

### 3. 营销决策
- 选择推广产品
- 优化产品定位
- 制定营销策略

## 注意事项

1. **数据依赖**: 需要 `BestSellers_TopProducts_Optimized` 表包含 `rank_improvement` 字段
2. **API 限制**: Google Custom Search API 有调用频率限制
3. **数据准确性**: 确保 `rank_improvement` 字段的计算准确性
4. **时间范围**: 基于每周数据，显示最新的排名变化情况

## 扩展功能

### 可能的改进
- 添加更多筛选条件（价格范围、品牌等）
- 支持多时间周期分析
- 添加趋势预测功能
- 集成更多数据源

### 性能优化
- 缓存查询结果
- 异步图片加载
- 分页加载数据
- 查询结果缓存

## 故障排除

### 常见问题

1. **无数据返回**
   - 检查配置参数是否正确
   - 确认 BigQuery 表中有数据
   - 验证 `rank_improvement` 字段存在

2. **API 错误**
   - 检查环境变量设置
   - 确认 Google API 密钥有效
   - 验证 BigQuery 权限

3. **图片加载失败**
   - 检查 Google Search API 配置
   - 确认产品标题格式正确
   - 验证 API 调用限制

### 调试方法

```bash
# 查看详细日志
DEBUG=* node scripts/rank-improvement-analysis.js

# 测试 API 连接
curl "http://localhost:3000/api/rank-improvement?country=US&categoryId=1&limit=5"
```

## 更新日志

- **v1.0.0**: 初始版本，基础排名上升分析功能
- **v1.1.0**: 简化查询逻辑，直接使用 `rank_improvement` 字段
- **v1.2.0**: 添加全分类模式支持 (`categoryId=123456`)
- 支持核心排名改善计算
- 集成 Google Custom Search API
- 创建前端展示页面
- 添加统计分析功能
- 简化数据查询逻辑
- 支持全分类检索功能 