# 产品周排名任务配置指南

## 环境变量配置

在 `.env` 文件中添加以下配置：

### 1. 必需配置
```env
# 数据库配置
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# Google 服务账户配置（二选一）
GCP_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"your-project",...}
# 或者
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service-account-key.json

# Google Custom Search API 配置
GOOGLE_SEARCH_API_KEY=your_google_custom_search_api_key
GOOGLE_SEARCH_ENGINE_ID=your_google_custom_search_engine_id
```

### 2. BigQuery 配置（三种方式）

#### 方式一：环境变量
```env
GOOGLE_CLOUD_PROJECT_ID=your-google-cloud-project-id
BIGQUERY_DATASET_ID=your-bigquery-dataset-id
BIGQUERY_TABLE_ID=your-bigquery-table-id
```

#### 方式二：DATABASE_URL 查询参数
```env
DATABASE_URL="postgresql://user:pass@host:port/db?bigquery_project=project&bigquery_dataset=dataset&bigquery_table=table"
```

#### 方式三：混合配置
```env
DATABASE_URL="postgresql://user:pass@host:port/db?bigquery_project=project"
BIGQUERY_DATASET_ID=your-dataset-id
BIGQUERY_TABLE_ID=your-table-id
```

## 配置优先级

1. **服务账户**：`GCP_SERVICE_ACCOUNT_JSON` > `GOOGLE_APPLICATION_CREDENTIALS`
2. **BigQuery 项目**：DATABASE_URL 参数 > 环境变量
3. **BigQuery 数据集/表**：DATABASE_URL 参数 > 环境变量

## 获取配置值的步骤

### Google 服务账户配置

1. **使用 JSON 字符串**（推荐）：
   - 在 Google Cloud Console 中创建服务账户
   - 下载 JSON 密钥文件
   - 将整个 JSON 内容复制到 `GCP_SERVICE_ACCOUNT_JSON`

2. **使用文件路径**：
   - 将 JSON 密钥文件保存到项目目录
   - 设置 `GOOGLE_APPLICATION_CREDENTIALS` 为文件路径

### Google Custom Search API 配置

1. **获取 API Key**：
   - 访问 [Google Cloud Console](https://console.cloud.google.com/)
   - 启用 Custom Search API
   - 在 "凭据" 页面创建 API Key

2. **创建搜索引擎**：
   - 访问 [Google Programmable Search Engine](https://programmablesearchengine.google.com/)
   - 点击 "创建搜索引擎"
   - 配置搜索引擎（可以搜索整个网络）
   - 获取搜索引擎ID（在搜索引擎设置中）

## 测试配置

配置完成后，运行以下命令测试：

```bash
npm run test-simple
```

如果所有项目都显示 ✓，说明配置正确。

## 运行任务

配置完成后，可以运行任务：

```bash
# 测试配置
npm run test-simple

# 运行任务
npm run update-product-rank

# 或通过 API
curl -X POST http://localhost:3001/api/update-product-rank
```

## 配置示例

### 完整配置示例
```env
# 数据库
DATABASE_URL="postgresql://user:pass@host:port/db"

# Google 服务账户（JSON 字符串）
GCP_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"my-project-123","private_key_id":"abc123","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"service@my-project-123.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/service%40my-project-123.iam.gserviceaccount.com"}

# BigQuery 配置
GOOGLE_CLOUD_PROJECT_ID=my-project-123
BIGQUERY_DATASET_ID=product_data
BIGQUERY_TABLE_ID=weekly_rankings

# Google Search API
GOOGLE_SEARCH_API_KEY=AIzaSyC1234567890abcdefghijklmnopqrstuvwxyz
GOOGLE_SEARCH_ENGINE_ID=123456789012345678901:abcdefghijk
```

### 使用 DATABASE_URL 参数的配置
```env
# 数据库（包含 BigQuery 信息）
DATABASE_URL="postgresql://user:pass@host:port/db?bigquery_project=my-project-123&bigquery_dataset=product_data&bigquery_table=weekly_rankings"

# Google 服务账户
GCP_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

# Google Search API
GOOGLE_SEARCH_API_KEY=AIzaSyC1234567890abcdefghijklmnopqrstuvwxyz
GOOGLE_SEARCH_ENGINE_ID=123456789012345678901:abcdefghijk
```

## 常见问题

### 1. BigQuery 连接错误
- 检查 `GCP_SERVICE_ACCOUNT_JSON` 格式是否正确
- 确认服务账户有正确的 BigQuery 权限
- 验证项目ID、数据集ID、表ID是否正确

### 2. Google Search API 错误
- 检查 API Key 是否正确
- 确认搜索引擎ID是否正确
- 检查 API 配额是否用完

### 3. 数据库错误
- 确认 `DATABASE_URL` 配置正确
- 运行 `npx prisma migrate dev` 确保数据库表已创建

## 注意事项

1. **JSON 格式**：`GCP_SERVICE_ACCOUNT_JSON` 必须是有效的 JSON 字符串
2. **权限设置**：服务账户需要 BigQuery Data Viewer 和 BigQuery Job User 权限
3. **API 限制**：Google Custom Search API 有每日配额限制
4. **数据清理**：每次运行会清除旧数据并插入新数据 