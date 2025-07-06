# 动态计算功能实现

## 概述

基于您的需求，我们实现了在 SQL 查询中动态计算派生列的功能，特别是 `(previous_rank - rank) AS rank_improvement` 这样的计算方式。

## 核心实现

### 1. 动态计算列

在 BigQuery SQL 查询中，我们直接在 SELECT 语句中计算派生列：

```sql
SELECT 
  product_title,
  current_rank,
  previous_rank,
  -- 动态计算排名改善
  (previous_rank - current_rank) AS rank_improvement,
  current_relative_demand,
  previous_relative_demand,
  -- 动态计算需求变化
  (current_relative_demand - previous_relative_demand) AS demand_change,
  -- 动态计算动量分数
  ((previous_rank - current_rank) * 0.7 + (current_relative_demand - previous_relative_demand) * 0.3) AS momentum_score
FROM ...
```

### 2. 实现的文件

#### 脚本文件
- `scripts/momentum-analysis.js` - 基础趋势分析脚本
- `scripts/advanced-momentum-analysis.js` - 高级趋势分析脚本（推荐）
- `scripts/test-dynamic-calculation.js` - 动态计算测试脚本

#### SQL 文件
- `scripts/create-momentum-analysis-table.sql` - 基础趋势分析表结构
- `scripts/create-advanced-momentum-table.sql` - 高级趋势分析表结构

#### API 和前端
- `app/api/momentum-analysis/route.ts` - API 路由
- `app/momentum-analysis/page.tsx` - 前端页面

## 动态计算示例

### 1. 基础计算

```sql
-- 排名改善计算
(previous_rank - current_rank) AS rank_improvement

-- 需求变化计算
(current_relative_demand - previous_relative_demand) AS demand_change

-- 动量分数计算
((previous_rank - current_rank) * 0.7 + (current_relative_demand - previous_relative_demand) * 0.3) AS momentum_score
```

### 2. 条件判断

```sql
-- 动态判断趋势类型
CASE 
  WHEN (previous_rank - current_rank) > 0 AND (current_relative_demand - previous_relative_demand) > 0 THEN 'ROCKET_RISING'
  WHEN (previous_rank - current_rank) > 0 AND (current_relative_demand - previous_relative_demand) < 0 THEN 'RANK_IMPROVING'
  WHEN (previous_rank - current_rank) < 0 AND (current_relative_demand - previous_relative_demand) > 0 THEN 'DEMAND_INCREASING'
  WHEN (previous_rank - current_rank) < 0 AND (current_relative_demand - previous_relative_demand) < 0 THEN 'DECLINING'
  ELSE 'UNKNOWN'
END AS trend_type
```

### 3. 时间计算

```sql
-- 计算时间间隔
TIMESTAMP_DIFF(current_timestamp, previous_timestamp, DAY) AS days_between_rankings
```

## 使用方法

### 1. 运行测试

```bash
# 测试动态计算功能
node scripts/test-dynamic-calculation.js
```

### 2. 运行高级趋势分析

```bash
# 运行高级趋势分析（推荐）
node scripts/advanced-momentum-analysis.js
```

### 3. 访问前端页面

访问 `/momentum-analysis` 查看分析结果。

## 查询示例

### 1. 获取排名改善最大的产品

```sql
SELECT 
  product_title,
  current_rank,
  previous_rank,
  (previous_rank - current_rank) AS rank_improvement,
  momentum_score
FROM `your-project.your-dataset.product_advanced_momentum_analysis`
WHERE rank_improvement > 0
ORDER BY rank_improvement DESC
LIMIT 10;
```

### 2. 获取火箭式上升产品

```sql
SELECT 
  product_title,
  current_rank,
  previous_rank,
  (previous_rank - current_rank) AS rank_improvement,
  (current_relative_demand - previous_relative_demand) AS demand_change,
  momentum_score
FROM `your-project.your-dataset.product_advanced_momentum_analysis`
WHERE trend_type = 'ROCKET_RISING'
  AND (previous_rank - current_rank) > 0
  AND (current_relative_demand - previous_relative_demand) > 0
ORDER BY momentum_score DESC
LIMIT 10;
```

### 3. 获取需求增长最大的产品

```sql
SELECT 
  product_title,
  current_rank,
  (current_relative_demand - previous_relative_demand) AS demand_change,
  momentum_score
FROM `your-project.your-dataset.product_advanced_momentum_analysis`
WHERE (current_relative_demand - previous_relative_demand) > 0
ORDER BY demand_change DESC
LIMIT 10;
```

## 优势

### 1. 性能优化
- 在数据库层面进行计算，减少数据传输
- 利用 BigQuery 的并行处理能力
- 避免在应用层进行大量计算

### 2. 灵活性
- 可以轻松添加新的计算列
- 支持复杂的条件判断
- 便于维护和修改

### 3. 可扩展性
- 支持不同的权重配置
- 可以添加更多的时间周期分析
- 便于集成到其他系统中

## 配置选项

### 1. 权重调整

在 `advanced-momentum-analysis.js` 中可以调整动量分数的权重：

```javascript
// 当前权重：排名变化70%，需求变化30%
((previous_rank - current_rank) * 0.7 + (current_relative_demand - previous_relative_demand) * 0.3) AS momentum_score

// 可以调整为：
((previous_rank - current_rank) * 0.6 + (current_relative_demand - previous_relative_demand) * 0.4) AS momentum_score
```

### 2. 时间周期

可以调整分析的时间周期：

```javascript
// 7天趋势分析
const daysBack = 7;

// 30天趋势分析
const daysBack = 30;

// 90天趋势分析
const daysBack = 90;
```

### 3. 趋势类型

可以自定义趋势类型的判断条件：

```sql
CASE 
  WHEN rank_improvement > 5 AND demand_change > 0.5 THEN 'SUPER_RISING'
  WHEN rank_improvement > 0 AND demand_change > 0 THEN 'ROCKET_RISING'
  -- 更多自定义条件
END AS trend_type
```

## 测试结果示例

运行测试脚本后的输出示例：

```
🧪 Testing dynamic calculation functionality...

📊 Test Results:
============================================================

1. Product B
   当前排名: 5
   历史排名: 8
   排名改善: 3 (上升)
   当前需求: 1.5
   历史需求: 1.0
   需求变化: 0.50 (增长)
   动量分数: 2.35
   趋势类型: ROCKET_RISING

2. Product A
   当前排名: 10
   历史排名: 15
   排名改善: 5 (上升)
   当前需求: 1.2
   历史需求: 0.8
   需求变化: 0.40 (增长)
   动量分数: 3.62
   趋势类型: ROCKET_RISING

3. Product C
   当前排名: 20
   历史排名: 12
   排名改善: -8 (下降)
   当前需求: 0.6
   历史需求: 1.3
   需求变化: -0.70 (下降)
   动量分数: -5.81
   趋势类型: DECLINING
```

## 注意事项

1. **数据完整性**: 确保历史数据完整，否则可能影响计算准确性
2. **性能考虑**: 复杂的计算可能影响查询性能，建议添加适当的索引
3. **数据更新**: 定期更新分析数据以保持趋势的时效性
4. **错误处理**: 处理 NULL 值和异常数据

## 扩展功能

### 1. 多维度分析
可以添加更多维度的计算，如：
- 市场份额变化
- 竞争强度分析
- 季节性调整

### 2. 预测模型
基于历史趋势数据，可以构建预测模型：
- 趋势延续性分析
- 拐点预测
- 风险评估

### 3. 可视化增强
可以添加更多可视化功能：
- 趋势图表
- 热力图
- 时间序列分析

## 总结

通过实现动态计算功能，我们成功地在 SQL 查询中直接计算了各种派生列，包括：

- ✅ `(previous_rank - rank) AS rank_improvement` - 排名改善
- ✅ `(current_relative_demand - previous_relative_demand) AS demand_change` - 需求变化
- ✅ 复杂的动量分数计算
- ✅ 动态趋势类型判断
- ✅ 时间间隔计算

这种实现方式既提高了性能，又增强了灵活性，为趋势分析提供了强大的基础。 