# Product Favorites 功能设置指南

## 概述

Product Favorites 功能允许用户收藏感兴趣的产品，并将数据存储在 BigQuery 数据库中。该功能参考了邮件订阅功能的实现方式。

## 功能特性

- ✅ 用户可以从 Top Growth Products 表格中添加产品到收藏
- ✅ 专门的 Product Favorites 页面显示所有收藏
- ✅ 支持分页显示
- ✅ 支持删除收藏
- ✅ 使用 BigQuery 数据库存储
- ✅ 支持中英文界面

## 数据库设置

### 1. 创建 BigQuery 表

运行以下命令创建 Product_Favorites 表：

```bash
node scripts/create-product-favorites-table.js
```

或者手动在 BigQuery 控制台运行 SQL：

```sql
CREATE TABLE IF NOT EXISTS `gmc-bestseller.new_gmc_data.Product_Favorites` (
  id INT64 NOT NULL,
  userid STRING NOT NULL,
  username STRING,
  useremail STRING,
  rank INT64 NOT NULL,
  country_code STRING NOT NULL,
  categroy_id INT64 NOT NULL,
  brand STRING,
  title STRING NOT NULL,
  previous_rank INT64,
  price_range STRING,
  relative_demand STRING,
  relative_demand_change STRING,
  rank_timestamp TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY DATE(created_at)
CLUSTER BY userid, country_code, categroy_id
OPTIONS(description="用户收藏的产品信息表");
```

### 2. 测试数据库连接

访问以下 URL 测试 BigQuery 连接：

```
GET /api/favorites/test-bigquery
```

## API 端点

### GET /api/favorites
获取用户的收藏列表

**参数：**
- `page`: 页码（默认：1）
- `pageSize`: 每页数量（默认：20）

**响应：**
```json
{
  "success": true,
  "data": [...],
  "total": 10,
  "page": 1,
  "pageSize": 20
}
```

### POST /api/favorites
添加产品到收藏

**请求体：**
```json
{
  "rank": 1,
  "country_code": "US",
  "categroy_id": 123,
  "brand": "Apple",
  "title": "iPhone 15",
  "previous_rank": 2,
  "price_range": "$800-$1000",
  "relative_demand": "HIGH",
  "relative_demand_change": "RISER",
  "rank_timestamp": "2024-01-01T00:00:00Z",
  "username": "用户名",
  "useremail": "user@example.com"
}
```

### DELETE /api/favorites/[id]
删除收藏

**参数：**
- `id`: 收藏记录 ID

## 前端组件

### 1. ProductFavorites.tsx
显示用户收藏列表的组件，包含：
- 产品信息表格
- 分页控件
- 删除按钮
- 加载状态

### 2. TopGrowthProducts.tsx (已修改)
在 Top Growth Products 表格中添加了收藏按钮：
- 每行末尾的 ★ 按钮
- 点击后添加到收藏
- 用户信息自动获取

## 用户界面

### 菜单导航
- 在左侧菜单中添加了 "Product Favorites" 选项
- 位置：在 "Top Growth Products by Monthly" 和 "Weekly Email Subscription" 之间

### 收藏列表页面
- 表格格式显示收藏的产品
- 包含所有产品信息字段
- 每行末尾有删除按钮
- 支持分页浏览

## 数据流程

1. **添加收藏**：
   - 用户在 Top Growth Products 页面点击 ★ 按钮
   - 前端获取用户信息（用户名、邮箱）
   - 发送 POST 请求到 `/api/favorites`
   - API 检查重复并插入到 BigQuery

2. **查看收藏**：
   - 用户点击 "Product Favorites" 菜单
   - 前端发送 GET 请求到 `/api/favorites`
   - 显示收藏列表，支持分页

3. **删除收藏**：
   - 用户在收藏列表中点击删除按钮
   - 前端发送 DELETE 请求到 `/api/favorites/[id]`
   - 从 BigQuery 中删除记录

## 环境变量要求

确保以下环境变量已正确设置：

```env
GCP_PROJECT_ID=gmc-bestseller
GCP_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

## 故障排除

### 1. 数据库连接问题
- 检查 `GCP_SERVICE_ACCOUNT_JSON` 环境变量
- 确认 BigQuery 项目权限
- 运行测试端点：`/api/favorites/test-bigquery`

### 2. 表不存在
- 运行创建表脚本：`node scripts/create-product-favorites-table.js`
- 或在 BigQuery 控制台手动创建表

### 3. 用户信息获取失败
- 确保用户已登录
- 检查 Clerk 用户对象结构
- 查看浏览器控制台错误信息

## 开发说明

### 技术栈
- **前端**: React, TypeScript, Tailwind CSS
- **后端**: Next.js API Routes
- **数据库**: Google BigQuery
- **认证**: Clerk
- **状态管理**: React Hooks

### 文件结构
```
app/
├── api/favorites/
│   ├── route.ts              # 主要 API 端点
│   ├── [id]/route.ts         # 删除端点
│   └── test-bigquery/route.ts # 测试端点
├── dashboard/
│   ├── ProductFavorites.tsx  # 收藏列表组件
│   └── TopGrowthProducts.tsx # 已修改，添加收藏按钮
└── scripts/
    └── create-product-favorites-table.js # 创建表脚本
```

## 下一步优化

1. **性能优化**：
   - 添加缓存机制
   - 优化 BigQuery 查询

2. **功能增强**：
   - 批量删除收藏
   - 收藏分类功能
   - 导出收藏列表

3. **用户体验**：
   - 添加收藏状态指示
   - 收藏数量显示
   - 搜索和过滤功能
