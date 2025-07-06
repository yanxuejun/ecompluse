# 趋势强度分析 (Momentum Analysis)

## 概述

趋势强度分析功能基于产品排名变化和相对需求变化，识别市场热点和产品趋势。通过分析历史数据与当前数据的对比，生成"火箭式上升产品榜"和"热度飙升榜"。

## 核心功能

### 1. 趋势分析逻辑

**核心字段:**
- `rank`: 当前排名
- `previous_rank`: 历史排名
- `relative_demand`: 当前相对需求
- `previous_relative_demand`: 历史相对需求

**分析指标:**
- **排名变化**: `previous_rank - rank` (正值表示排名上升)
- **需求变化**: `current_relative_demand - previous_relative_demand`
- **动量分数**: `rank_change * 0.7 + demand_change * 0.3`

### 2. 趋势类型分类

| 趋势类型 | 条件 | 描述 |
|---------|------|------|
| `ROCKET_RISING` | 排名上升 + 需求增长 | 🚀 火箭式上升 |
| `RANK_IMPROVING` | 排名上升 + 需求下降 | 📈 排名改善 |
| `DEMAND_INCREASING` | 排名下降 + 需求增长 | 🔥 需求增长 |
| `DECLINING` | 排名下降 + 需求下降 | 📉 下降趋势 |
| `STABLE_GROWING` | 排名不变 + 需求增长 | 📊 稳定增长 |
| `STABLE_DECLINING` | 排名不变 + 需求下降 | 📊 稳定下降 |
| `STABLE` | 排名不变 + 需求不变 | ➡️ 稳定 |
| `NEW_PRODUCT` | 新产品，无历史数据 | 🆕 新产品 |

## 文件结构

```
scripts/
├── momentum-analysis.js              # 趋势分析脚本
├── create-momentum-analysis-table.sql # BigQuery 表结构
└── README_Momentum_Analysis.md      # 说明文档

app/
├── api/momentum-analysis/route.ts    # API 路由
└── momentum-analysis/page.tsx        # 前端页面
```

## 使用方法

### 1. 创建 BigQuery 表

首先在 BigQuery 中创建趋势分析表：

```sql
-- 使用 create-momentum-analysis-table.sql 中的 SQL
-- 替换 your-project-id 和 your-dataset 为实际值
```

### 2. 运行趋势分析脚本

```bash
# 运行趋势分析
node scripts/momentum-analysis.js
```

### 3. 访问前端页面

访问 `/momentum-analysis` 页面查看分析结果。

## API 接口

### GET /api/momentum-analysis

获取趋势分析数据

**查询参数:**
- `country`: 国家代码 (默认: US)
- `categoryId`: 分类 ID (默认: 1)
- `trendType`: 趋势类型筛选 (可选)
- `limit`: 返回数量限制 (默认: 10)
- `analysisDate`: 分析日期 (可选)

**示例:**
```bash
GET /api/momentum-analysis?country=US&categoryId=1&trendType=ROCKET_RISING&limit=10
```

### POST /api/momentum-analysis

获取趋势统计信息

**请求体:**
```json
{
  "country": "US",
  "categoryId": "1",
  "analysisDate": "2024-01-15" // 可选
}
```

## 配置说明

### 环境变量

确保在 `.env` 文件中设置以下变量：

```env
# Google Cloud Platform
GCP_PROJECT_ID=your-project-id
GCP_DATASET_ID=your-dataset-id
GCP_SERVICE_ACCOUNT_JSON={"type": "service_account", ...}

# Google Custom Search API
GOOGLE_SEARCH_API_KEY=your-api-key
GOOGLE_SEARCH_ENGINE_ID=your-engine-id
```

### config.js 配置

在 `scripts/config.js` 中设置分析参数：

```javascript
module.exports = {
  task: {
    country: 'US',
    categoryId: '1',
    limit: 50,
    delayBetweenRequests: 1000
  },
  bigquery: {
    projectId: 'your-project-id',
    datasetId: 'your-dataset-id',
    tableId: 'your-table-id'
  },
  googleSearch: {
    apiKey: process.env.GOOGLE_SEARCH_API_KEY,
    engineId: process.env.GOOGLE_SEARCH_ENGINE_ID
  }
};
```

## 输出结果

### 1. 控制台输出

脚本运行时会输出详细的分析过程：

```
🚀 Starting momentum analysis...
📋 Configuration from config.js:
   Country: US
   Category ID: 1
   Limit: 50
   BigQuery: your-project.your-dataset.your-table

📊 Fetching current rankings for country: US, category: 1
Found 50 current products

📊 Fetching previous rankings (7 days back) for country: US, category: 1
Found 45 previous products

🔍 Analyzing momentum trends...

🚀 趋势强度分析报告
==================================================

🔥 火箭式上升产品榜:
1. Product Name
   排名变化: 15 → 8 (↑7)
   需求变化: 0.85 → 1.25 (+0.40)
   动量分数: 5.20

📈 热度飙升榜:
1. Product Name
   需求增长: 0.75 → 1.15 (↑0.40)
   当前排名: 12

📊 趋势分布统计:
ROCKET_RISING: 8 个产品
RANK_IMPROVING: 12 个产品
DEMAND_INCREASING: 5 个产品
DECLINING: 15 个产品
STABLE: 10 个产品
```

### 2. BigQuery 数据

分析结果会保存到 `product_momentum_analysis` 表中，包含：

- 产品基本信息
- 排名变化数据
- 需求变化数据
- 动量分数
- 趋势类型
- 图片信息
- 时间戳

### 3. 前端展示

前端页面提供：

- **趋势分布统计**: 各趋势类型的数量分布
- **趋势筛选**: 按趋势类型筛选产品
- **产品卡片**: 显示产品图片、排名变化、需求变化、动量分数
- **响应式设计**: 支持移动端和桌面端

## 查询示例

### 获取火箭式上升产品

```sql
SELECT 
  product_title,
  current_rank,
  previous_rank,
  rank_change,
  current_relative_demand,
  previous_relative_demand,
  demand_change,
  momentum_score,
  image_url
FROM `your-project.your-dataset.product_momentum_analysis`
WHERE trend_type = 'ROCKET_RISING'
  AND country = 'US'
  AND category_id = '1'
ORDER BY momentum_score DESC
LIMIT 10;
```

### 获取热度飙升榜

```sql
SELECT 
  product_title,
  current_rank,
  demand_change,
  current_relative_demand,
  image_url
FROM `your-project.your-dataset.product_momentum_analysis`
WHERE demand_change > 0
  AND country = 'US'
  AND category_id = '1'
ORDER BY demand_change DESC
LIMIT 10;
```

### 趋势分布统计

```sql
SELECT 
  trend_type,
  COUNT(*) as count
FROM `your-project.your-dataset.product_momentum_analysis`
WHERE country = 'US'
  AND category_id = '1'
  AND DATE(analysis_timestamp) = CURRENT_DATE()
GROUP BY trend_type
ORDER BY count DESC;
```

## 注意事项

1. **数据依赖**: 需要历史排名数据才能进行趋势分析
2. **API 限制**: Google Custom Search API 有调用频率限制
3. **BigQuery 成本**: 大量查询可能产生费用
4. **数据准确性**: 确保历史数据的完整性和准确性

## 扩展功能

### 1. 自定义权重

可以调整动量分数的计算权重：

```javascript
// 在 momentum-analysis.js 中修改
const momentumScore = rankChange * 0.6 + demandChange * 0.4; // 调整权重
```

### 2. 多时间周期分析

支持不同时间周期的趋势分析：

```javascript
// 支持 7天、30天、90天等不同周期
const daysBack = 30; // 30天趋势分析
```

### 3. 趋势预测

基于历史趋势预测未来走势：

```javascript
// 可以添加趋势预测算法
function predictTrend(momentumData) {
  // 实现趋势预测逻辑
}
```

## 故障排除

### 常见问题

1. **无历史数据**: 确保 BigQuery 中有足够的历史数据
2. **API 错误**: 检查 Google Custom Search API 配置
3. **权限问题**: 确保 BigQuery 服务账户有足够权限
4. **网络问题**: 检查网络连接和防火墙设置

### 调试模式

启用详细日志：

```javascript
// 在脚本中设置
process.env.DEBUG = 'true';
```

## 更新日志

- **v1.0.0**: 初始版本，支持基础趋势分析
- **v1.1.0**: 添加前端界面和 API 接口
- **v1.2.0**: 优化性能和数据准确性 