# 安全说明

## 敏感信息处理

### 1. 环境变量
所有敏感信息应存储在 `.env` 文件中，该文件已被 `.gitignore` 忽略：

```env
# BigQuery 配置
GOOGLE_CLOUD_PROJECT_ID=your-project-id
BIGQUERY_DATASET_ID=your-dataset-id
BIGQUERY_TABLE_ID=your-table-id

# Google Cloud Service Account
GCP_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

# Google Search API
GOOGLE_SEARCH_API_KEY=your-api-key
GOOGLE_SEARCH_ENGINE_ID=your-engine-id

# Stripe 配置
STRIPE_SECRET_KEY=your-stripe-secret-key

# Clerk 配置
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key
```

### 2. 临时文件
- `scripts/temp/` 目录已被 `.gitignore` 忽略
- 不要将任何包含敏感信息的文件提交到 Git

### 3. 部署环境
在 Vercel 或其他部署平台中，通过环境变量设置敏感信息。

## 安全最佳实践

1. **永远不要提交敏感信息到 Git**
2. **使用环境变量存储所有密钥**
3. **定期轮换 API 密钥**
4. **使用最小权限原则**
5. **监控 API 使用情况**

## 如果意外提交了敏感信息

1. 立即删除敏感文件
2. 轮换所有暴露的密钥
3. 更新 `.gitignore` 文件
4. 联系相关服务提供商 