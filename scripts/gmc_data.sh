#!/bin/bash

# --- 脚本设置 ---
# 任何命令执行失败则立即退出脚本 (生产环境推荐)
# 如果需要调试，请取消下面一行的注释
# set -x
set -euo pipefail

# --- 脚本配置 ---

# 1. 服务账号密钥文件
#    确保这个 JSON 文件和脚本在同一目录下，或者提供完整路径
KEY_FILE="gmc-bestseller.json"

# 2. 本地工作目录
PARENT_DIR="gmc_data"

# 3. Google Cloud Storage 配置
GCS_BUCKET_PATH="gs://mygmcdata/**"
GCS_BUCKET_NAME="gs://mygmcdata" 

# 4. BigQuery 配置
BQ_PROJECT_ID="gmc-bestseller" 
#    !!! 重要: 请确保下方的表名是您想要查询的正确表名 !!!
BQ_TABLE_NAME="gmc-bestseller.new_gmc_data.BestSellers_TopProducts_479974220"

# 5. BigQuery 导出数据的 SQL 查询 (使用可靠的字符串拼接方法)
BQ_EXPORT_SQL="EXPORT DATA "
BQ_EXPORT_SQL+="OPTIONS("
BQ_EXPORT_SQL+="  uri='GCS_URI_PLACEHOLDER',"
BQ_EXPORT_SQL+="  format='CSV',"
BQ_EXPORT_SQL+="  overwrite=true,"
BQ_EXPORT_SQL+="  header=true,"
BQ_EXPORT_SQL+="  field_delimiter=',' "
BQ_EXPORT_SQL+=") AS ( "
BQ_EXPORT_SQL+="SELECT "
BQ_EXPORT_SQL+="  t.rank_timestamp, "
BQ_EXPORT_SQL+="  t.rank, "
BQ_EXPORT_SQL+="  t.previous_rank, "
BQ_EXPORT_SQL+="  t.ranking_country, "
BQ_EXPORT_SQL+="  t.ranking_category, "
BQ_EXPORT_SQL+="  t.product_title[0].name as product_title, "
BQ_EXPORT_SQL+="  t.brand, "
BQ_EXPORT_SQL+="  t.price_range.min AS price_min, "
BQ_EXPORT_SQL+="  t.price_range.max AS price_max, "
BQ_EXPORT_SQL+="  t.price_range.currency AS price_currency, "
BQ_EXPORT_SQL+="  t.relative_demand.min AS relative_demand_min, "
BQ_EXPORT_SQL+="  t.relative_demand.max AS relative_demand_max, "
BQ_EXPORT_SQL+="  t.relative_demand.bucket AS relative_demand_bucket, "
BQ_EXPORT_SQL+="  t.previous_relative_demand.min AS previous_relative_demand_min, "
BQ_EXPORT_SQL+="  t.previous_relative_demand.max AS previous_relative_demand_max, "
BQ_EXPORT_SQL+="  t.previous_relative_demand.bucket AS previous_relative_demand_bucket "
BQ_EXPORT_SQL+="FROM "
BQ_EXPORT_SQL+="  \`BQ_TABLE_PLACEHOLDER\` AS t"
BQ_EXPORT_SQL+=");"

# --- 脚本主逻辑 ---

echo "--- 自动化数据管道开始 [$(date)] ---"

# 步骤 0: 使用服务账号进行身份验证
echo ""
echo "--- 步骤 0: 身份验证 ---"
if ! command -v gcloud &> /dev/null; then
    echo "致命错误: 'gcloud' 命令未找到。请安装 Google Cloud SDK。"
    exit 1
fi
if [ ! -f "$KEY_FILE" ]; then
    echo "致命错误: 服务账号密钥文件 '$KEY_FILE' 未找到。"
    exit 1
fi
echo "正在使用密钥文件 '$KEY_FILE' 激活服务账号..."
gcloud auth activate-service-account --key-file="$KEY_FILE"
echo "服务账号已成功激活。"


# 步骤 1: 清理 GCS 存储桶
echo ""
echo "--- 步骤 1: 清理 GCS 存储桶 ---"
echo "正在清理 GCS 路径: $GCS_BUCKET_PATH"
gcloud storage rm "$GCS_BUCKET_PATH" || true
echo "GCS 清理命令已执行。"


# 步骤 2: 从 BigQuery 导出数据到 GCS
echo ""
echo "--- 步骤 2: 从 BigQuery 导出数据到 GCS ---"
EXPORT_URI="${GCS_BUCKET_NAME}/gmcdata-$(date +%F)-*.csv"
FINAL_SQL="${BQ_EXPORT_SQL//GCS_URI_PLACEHOLDER/$EXPORT_URI}"
FINAL_SQL="${FINAL_SQL//BQ_TABLE_PLACEHOLDER/$BQ_TABLE_NAME}"
echo "将从表 '$BQ_TABLE_NAME' 导出到 '$EXPORT_URI'"
bq query --project_id="$BQ_PROJECT_ID" --use_legacy_sql=false "$FINAL_SQL"
echo "BigQuery 数据导出已完成。"


# 步骤 3: 清理本地旧的 'output' 目录
echo ""
echo "--- 步骤 3: 清理本地旧的 'output' 目录 ---"
if [ ! -d "$PARENT_DIR" ]; then
  echo "信息: 本地目录 '$PARENT_DIR' 不存在，将创建它。"
  mkdir -p "$PARENT_DIR"
fi
OUTPUT_DIR_TO_DELETE="$PARENT_DIR/output"
if [ -d "$OUTPUT_DIR_TO_DELETE" ]; then
  echo "正在删除本地目录: '$OUTPUT_DIR_TO_DELETE'..."
  rm -rf "$OUTPUT_DIR_TO_DELETE"
  echo "本地 'output' 目录已删除。"
else
  echo "本地 'output' 目录不存在，无需删除。"
fi


# 步骤 4: 归档本地已存在的文件
echo ""
echo "--- 步骤 4: 归档本地已存在的文件 ---"
TODAY=$(date +%F)
DEST_DIR="$PARENT_DIR/$TODAY"
echo "正在创建本地归档目录: $DEST_DIR"
mkdir -p "$DEST_DIR"
# 只在找到文件时才执行移动操作
if [ -n "$(find "$PARENT_DIR" -maxdepth 1 -type f)" ]; then
    echo "发现需要归档的文件，正在移动..."
    find "$PARENT_DIR" -maxdepth 1 -type f -exec mv -t "$DEST_DIR" {} +
    echo "本地文件归档完成。"
else
    echo "信息：没有找到需要归档的文件，跳过移动操作。"
fi


# 步骤 5: 从 GCS 下载新导出的文件到本地
echo ""
echo "--- 步骤 5: 从 GCS 下载新数据到本地 ---"
echo "准备从 '$EXPORT_URI' 下载到本地目录 '$PARENT_DIR/'"
gcloud storage cp "$EXPORT_URI" "$PARENT_DIR/"
echo "新数据文件已成功下载到 '$PARENT_DIR/'。"


echo ""
echo "--- 所有流程已成功完成！ [$(date)] ---"