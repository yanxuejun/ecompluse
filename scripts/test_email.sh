#!/bin/bash

# 该脚本按顺序执行一系列数据处理、报告生成和邮件发送的Python脚本。
# 如果任何步骤出错，脚本将立即停止。
set -e

# --- 1. 数据合并 ---
echo "正在执行步骤 1: merge_gmc_by_country_bitnami.py"
python scripts/merge_gmc_by_country_bitnami.py

echo "正在执行步骤 2: merge_gmc_by_country_category.py US 166"
python scripts/merge_gmc_by_country_category.py US 166

echo "正在执行步骤 3: merge_gmc_by_country_keyword.py US \"hearing aids\""
python scripts/merge_gmc_by_country_keyword.py US "hearing aids"

# --- 2. 生成报告 ---
echo "正在执行步骤 4: generate_report_by_country_category_gemini.py US 166"
python scripts/generate_report_by_country_category_gemini.py US 166

echo "正在执行步骤 5: generate_report_by_country_keyword_gemini.py US \"hearing aids\""
python scripts/generate_report_by_country_keyword_gemini.py US "hearing aids"

# --- 3. 发送邮件 ---
echo "正在执行步骤 6: send_subscription_email.py (Category)"
python scripts/send_subscription_email.py yanxuejun@gmail.com "US_166"

echo "正在执行步骤 7: send_subscription_email.py (Keyword)"
python scripts/send_subscription_email.py yanxuejun@gmail.com "US_hearing aids"

echo "所有脚本成功执行完毕。"