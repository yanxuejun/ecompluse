"""
Google Merchant Center (GMC) 关键词数据分析报告生成器 - Gemini AI版本

功能描述:
    此脚本用于分析指定国家的Google Merchant Center关键词数据，生成包含AI分析的HTML报告。
    脚本会处理指定国家目录下的 US_keyword.csv（或其它国家），为每个关键词生成详细的市场分析报告。

主要功能:
    1. 读取指定国家的GMC关键词数据CSV文件
    2. 分析产品排名、品牌分布、增长趋势等
    3. 调用Gemini AI API生成市场分析总结
    4. 生成美观的HTML报告文件

前置要求:
    1. Python 3.7+
    2. 安装必要的Python包: requests, pathlib
    3. 设置GEMINI_API_KEY环境变量
    4. 确保数据目录结构正确

环境变量设置:
    export GEMINI_API_KEY="your_gemini_api_key_here"
    
    或者在Windows PowerShell中:
    $env:GEMINI_API_KEY="your_gemini_api_key_here"

目录结构要求:
    gmc_data/
    └── output/
        └── {country}/
            └── {country}_keyword.csv

使用方法:
    1. 基本用法:
       python generate_report_by_country_keyword_gemini.py US "keyword"
    2. 查看帮助:
       python generate_report_by_country_keyword_gemini.py --help

参数说明:
    country: 国家代码 (必需)
        - US: 美国
        - AE: 阿联酋
        - GB: 英国
        - DE: 德国
        - 等等...
    keyword: 指定关键词 (必需，不区分大小写，需加英文双引号)
        - 如: "shoes"
        - 文件名必须为 {country}_keyword.csv

输出文件:
    1. {country}_keyword_{keyword}.analyzed.html - 包含AI分析的完整HTML报告
    2. {country}_keyword_{keyword}.summary.txt - AI生成的文本总结

作者: ecompulsedata.com
版本: 1.0
最后更新: 2025-01-23
"""

import os
import json
import csv
import sys
import argparse
from pathlib import Path
from datetime import datetime
import urllib.parse
import re
import requests

def get_shopping_url(product_title, country_code):
    if not product_title:
        return '#'
    country_google_shopping_map = {
        'US': {'gl': 'us', 'hl': 'en'},
        'AE': {'gl': 'ae', 'hl': 'ar'},
        'GB': {'gl': 'uk', 'hl': 'en'},
        'DE': {'gl': 'de', 'hl': 'de'},
        # ... 可补充其它国家 ...
    }
    country_map = country_google_shopping_map.get(country_code.upper(), {'gl': 'us', 'hl': 'en'})
    gl = country_map['gl']
    hl = country_map['hl']
    encoded_title = urllib.parse.quote(product_title)
    return f"https://www.google.com/search?tbm=shop&q={encoded_title}&gl={gl}&hl={hl}"

def extract_data_from_html(html_content):
    text_content = re.sub(r'<[^>]+>', '', html_content)
    text_content = re.sub(r'\s+', ' ', text_content).strip()
    return text_content

def call_gemini_api(data_text, country, keyword):
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("  警告: 未设置GEMINI_API_KEY环境变量，跳过AI总结")
        return None
    prompt = f"""I am an e-commerce operations manager responsible for product selection. Based on the given data, please provide a comprehensive analysis summary of around 100 words.\n\nData Source: {country} - {keyword}\nData Content:\n{data_text}\n\nPlease analyze the above data from an e-commerce product selection perspective, including:\n1. Market trends and characteristics of popular products\n2. Brand distribution analysis\n3. Price range analysis\n4. Features of fastest-growing products\n5. Product selection recommendations and opportunities\n\nPlease respond in English, around 100 words."""
    try:
        url = f"https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key={api_key}"
        payload = {
            "contents": [{
                "parts": [{
                    "text": prompt
                }]
            }],
            "generationConfig": {
                "temperature": 0.7,
                "topK": 40,
                "topP": 0.95,
                "maxOutputTokens": 1024
            }
        }
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        result = response.json()
        if 'candidates' in result and len(result['candidates']) > 0:
            content = result['candidates'][0]['content']['parts'][0]['text']
            estimated_tokens = len(prompt) + len(content)
            print(f"  估算token数: {estimated_tokens}")
            return content
        else:
            print("  Gemini API返回格式异常")
            print(f"  API响应: {result}")
            return None
    except Exception as e:
        print(f"  Gemini API调用失败: {e}")
        return None

def parse_num(v):
    try:
        return int(v)
    except Exception:
        return 0

def price_range(row):
    """生成价格区间字符串，与 category 版一致"""
    if row.get('price_min') and row.get('price_max') and row['price_min'] != row['price_max']:
        return f"{row['price_min']} - {row['price_max']} {row.get('price_currency', '')}"
    elif row.get('price_min'):
        return f"{row['price_min']} {row.get('price_currency', '')}"
    else:
        return ''

def main():
    parser = argparse.ArgumentParser(description='生成国家keyword CSV的HTML报表')
    parser.add_argument('country', type=str, help='国家代码，如 US, AE 等')
    parser.add_argument('keyword', type=str, help='指定关键词，不区分大小写，需加英文双引号，如 "shoes"')
    args = parser.parse_args()

    print("--- 开始运行 generate_report_by_country_keyword_gemini.py ---")
    print(f"国家: {args.country}")
    print(f"关键词: {args.keyword}")

    # 生成安全的 keyword 文件名部分（空格转下划线）
    safe_keyword = args.keyword.replace(' ', '_')

    # 查找 keyword CSV 文件
    output_root = Path(__file__).parent.parent / 'gmc_data' / 'output'
    country_dir = output_root / args.country
    report_dir = country_dir / 'report'
    if not report_dir.exists():
        print(f"错误: Report目录 {report_dir} 不存在！")
        return
    # 文件名如 US_{keyword}.csv
    keyword_csv_name = f"{args.country}_{args.keyword}.csv"
    keyword_csv_path = report_dir / keyword_csv_name
    if not keyword_csv_path.exists():
        print(f"错误: 未找到 {keyword_csv_path}")
        return

    # 读取CSV数据（不再筛选 keyword 字段，直接处理所有行）
    rows = []
    with open(keyword_csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    print(f"  读取到 {len(rows)} 行数据")
    if not rows:
        print(f"  文件 {keyword_csv_path} 无数据，跳过")
        return

    # Top 10 产品（按rank排序，取前十，product_title唯一）
    def rank_num(v):
        return parse_num(v)
    sorted_rows = sorted(rows, key=lambda x: rank_num(x.get('rank', 0)))
    seen_titles = set()
    top_products = []
    for r in sorted_rows:
        if r.get('product_title') and r['product_title'] not in seen_titles:
            top_products.append(r)
            seen_titles.add(r['product_title'])
        if len(top_products) >= 10:
            break
    # Top Performing Products - no brand
    top_no_brand_products = [r for r in rows if not r.get('brand') or str(r.get('brand', '')).strip() == '' or r.get('brand') == 'no brand']
    top_no_brand_products = sorted(top_no_brand_products, key=lambda x: rank_num(x.get('rank', 0)))[:10]
    # 品牌分布
    brand_count = {}
    for r in rows:
        brand = r.get('brand') and str(r.get('brand')).strip() or 'no brand'
        brand_count[brand] = brand_count.get(brand, 0) + 1
    total_brands = sum(brand_count.values())
    sorted_brands = sorted(brand_count.items(), key=lambda x: x[1], reverse=True)
    top_n = 10
    top_brands = sorted_brands[:top_n]
    other_count = sum(count for _, count in sorted_brands[top_n:])
    brand_table_rows = [{'brand': brand, 'share': f'{(count / total_brands * 100):.1f}%'} for brand, count in top_brands]
    if other_count > 0:
        brand_table_rows.append({'brand': 'other brands', 'share': f'{(other_count / total_brands * 100):.1f}%'})
    brand_table_html = f'''<table style="width:100%;border-collapse:collapse;margin-bottom:2rem;">
        <thead>
          <tr style="background:#f5f7fa;color:#222;font-size:1rem;">
            <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Brand</th>
            <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Share</th>
          </tr>
        </thead>
        <tbody>
          {''.join([f'''
            <tr>
              <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">{row['brand']}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">{row['share']}</td>
            </tr>
          ''' for row in brand_table_rows])}
        </tbody>
      </table>'''
    # Fastest Growing Products
    growth_rows = []
    for r in rows:
        if (r.get('rank') and r.get('previous_rank') and 
            not str(r['rank']).strip() == '' and not str(r['previous_rank']).strip() == ''):
            try:
                rank_change = int(r['previous_rank']) - int(r['rank'])
                demand_change = ''
                if (r.get('previous_relative_demand_bucket') and r.get('relative_demand_bucket') and 
                    r['previous_relative_demand_bucket'] != r['relative_demand_bucket']):
                    demand_change = f"{r['previous_relative_demand_bucket']} → {r['relative_demand_bucket']}"
                elif r.get('relative_demand_bucket'):
                    demand_change = f"Stable ({r['relative_demand_bucket']})"
                growth_rows.append({
                    **r,
                    'rank_change': rank_change,
                    'demand_change': demand_change
                })
            except (ValueError, TypeError):
                continue
    growth_rows = sorted(growth_rows, key=lambda x: x['rank_change'], reverse=True)[:10]
    # 新品
    new_entries = []
    for r in rows:
        if ((not r.get('previous_rank') or str(r.get('previous_rank', '')).strip() == '') and 
            r.get('rank') and str(r.get('rank', '')).strip() != ''):
            new_entries.append({
                **r,
                'rank_change': 'New entry',
                'demand_change': 'New entry'
            })
    new_entries = new_entries[:max(0, 10 - len(growth_rows))]
    fastest_growing = growth_rows + new_entries
    fastest_growing = fastest_growing[:10]
    # 最新rank_timestamp
    latest_rank_timestamp = max([r.get('rank_timestamp', '') for r in rows if r.get('rank_timestamp')], default='')
    latest_date = latest_rank_timestamp.split(' ')[0] if latest_rank_timestamp else ''
    current_date = datetime.now().strftime('%Y-%m-%d')
    # 报表副标题
    sub_header = f"Week of {current_date} | {args.keyword} | {args.country}"
    # 先调用Gemini API生成总结，拼接完整报表HTML用于AI分析
    print("  提取数据内容...")
    temp_html = f'''
      <div style="background:#f7f9fa;padding:40px 0 0 0;min-height:100vh;">
        <div style="max-width:900px;margin:0 auto;background:#fff;padding:32px 32px 48px 32px;border-radius:8px;box-shadow:0 2px 8px #0001;">
          <div style="text-align:center;margin-bottom:1.5rem;"><img src="https://www.ecompulsedata.com/logo-footer.png" alt="logo" style="height:48px;"></div>
          <h1 style="font-size:2.5rem;font-weight:700;text-align:center;color:#2a3b4d;margin-bottom:0.5rem;">E-Commerce Trend Report</h1>
          <div style="text-align:center;color:#444;font-size:1.1rem;margin-bottom:2.5rem;">{sub_header}</div>
          <h2 style="color:#2196f3;font-size:1.5rem;font-weight:700;margin-bottom:0.5rem;border-bottom:3px solid #2196f3;padding-bottom:0.2em;">Top Performing Products</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:2rem;">
            <thead>
              <tr style="background:#f5f7fa;color:#222;font-size:1rem;">
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Rank</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Product</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Brand</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Price</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Demand</th>
              </tr>
            </thead>
            <tbody>
              {''.join([f'''
                <tr>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">{p.get('rank', '')}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;"><a href="{get_shopping_url(p.get('product_title', ''), args.country)}" target="_blank" rel="noopener noreferrer" style="color:#2196f3;text-decoration:none;">{p.get('product_title', '')}</a></td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">{p.get('brand', '-')}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">{price_range(p)}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">{p.get('relative_demand_bucket', '')}</td>
                </tr>
              ''' for p in top_products])}
            </tbody>
          </table>
          <h2 style="color:#2196f3;font-size:1.5rem;font-weight:700;margin-bottom:0.5rem;border-bottom:3px solid #2196f3;padding-bottom:0.2em;">Top Performing Products - no brand</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:2rem;">
            <thead>
              <tr style="background:#f5f7fa;color:#222;font-size:1rem;">
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Rank</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Product</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Brand</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Price</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Demand</th>
              </tr>
            </thead>
            <tbody>
              {''.join([f'''
                <tr>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">{p.get('rank', '')}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;"><a href="{get_shopping_url(p.get('product_title', ''), args.country)}" target="_blank" rel="noopener noreferrer" style="color:#2196f3;text-decoration:none;">{p.get('product_title', '')}</a></td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">{p.get('brand', '-')}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">{price_range(p)}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">{p.get('relative_demand_bucket', '')}</td>
                </tr>
              ''' for p in top_no_brand_products])}
            </tbody>
          </table>
          <h2 style="color:#2196f3;font-size:1.5rem;font-weight:700;margin-bottom:0.5rem;border-bottom:3px solid #2196f3;padding-bottom:0.2em;">Fastest Growing Products</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:2rem;">
            <thead>
              <tr style="background:#f5f7fa;color:#222;font-size:1rem;">
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Rank</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Previous Rank</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Product</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Brand</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Price</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Rank Change</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Demand Change</th>
              </tr>
            </thead>
            <tbody>
              {''.join([f'''
                <tr>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">{p.get('rank', '')}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">{p.get('previous_rank', '')}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;"><a href="{get_shopping_url(p.get('product_title', ''), args.country)}" target="_blank" rel="noopener noreferrer" style="color:#2196f3;text-decoration:none;">{p.get('product_title', '')}</a></td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">{p.get('brand', '-')}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">{price_range(p)}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;color:{'#1dbf73' if isinstance(p.get('rank_change'), int) and p.get('rank_change', 0) > 0 else '#888'};font-weight:600;">{p.get('rank_change', '')}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;color:{'#1dbf73' if p.get('demand_change', '').find('→') != -1 else '#888'};font-weight:600;">{p.get('demand_change', '')}</td>
                </tr>
              ''' for p in fastest_growing])}
            </tbody>
          </table>
          <h2 style="color:#2196f3;font-size:1.5rem;font-weight:700;margin-bottom:0.5rem;border-bottom:3px solid #2196f3;padding-bottom:0.2em;">Brand Distribution</h2>
          {brand_table_html}
          <div style="text-align:center;color:#888;font-size:0.95rem;margin-top:2.5rem;">Data source : Google Merchant Center (GMC) {latest_date} &copy; ecompulsedata.com All rights reserved.</div>
        </div>
      </div>
      '''
    data_text = extract_data_from_html(temp_html)
    print(f"  提取的数据长度: {len(data_text)} 字符")
    summary = call_gemini_api(data_text, args.country, args.keyword)
    # 生成最终的HTML（包含总结）
    html = f'''
      <div style="background:#f7f9fa;padding:40px 0 0 0;min-height:100vh;">
        <div style="max-width:900px;margin:0 auto;background:#fff;padding:32px 32px 48px 32px;border-radius:8px;box-shadow:0 2px 8px #0001;">
          <div style="text-align:center;margin-bottom:1.5rem;"><img src="https://www.ecompulsedata.com/logo-footer.png" alt="logo" style="height:48px;"></div>
          <h1 style="font-size:2.5rem;font-weight:700;text-align:center;color:#2a3b4d;margin-bottom:0.5rem;">E-Commerce Trend Report</h1>
          <div style="text-align:center;color:#444;font-size:1.1rem;margin-bottom:2.5rem;">{sub_header}</div>
          {f'''
          <div style="background:linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);color:#374151;padding:24px;border-radius:12px;margin-bottom:2.5rem;box-shadow:0 4px 12px rgba(0,0,0,0.1);border:1px solid #e5e7eb;">
            <h3 style="margin:0 0 16px 0;font-size:1.3rem;font-weight:600;color:#1f2937;display:flex;align-items:center;">
              <span style="background:#3b82f6;color:#fff;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-right:12px;font-weight:700;font-size:1.1rem;">AI</span>
              Market Analysis Summary
            </h3>
            <div style="line-height:1.8;font-size:1rem;color:#4b5563;text-align:justify;">
              {summary.replace(chr(10), '<br>') if summary else ''}
            </div>
            <div style="margin-top:16px;padding-top:16px;border-top:1px solid #d1d5db;font-size:0.9rem;color:#6b7280;font-style:italic;">
              💡 Generated based on Google Merchant Center data analysis
            </div>
          </div>
          ''' if summary else ''}
          <h2 style="color:#2196f3;font-size:1.5rem;font-weight:700;margin-bottom:0.5rem;border-bottom:3px solid #2196f3;padding-bottom:0.2em;">Top Performing Products</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:2rem;">
            <thead>
              <tr style="background:#f5f7fa;color:#222;font-size:1rem;">
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Rank</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Product</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Brand</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Price</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Demand</th>
              </tr>
            </thead>
            <tbody>
              {''.join([f'''
                <tr>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">{p.get('rank', '')}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;"><a href="{get_shopping_url(p.get('product_title', ''), args.country)}" target="_blank" rel="noopener noreferrer" style="color:#2196f3;text-decoration:none;">{p.get('product_title', '')}</a></td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">{p.get('brand', '-')}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">{price_range(p)}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">{p.get('relative_demand_bucket', '')}</td>
                </tr>
              ''' for p in top_products])}
            </tbody>
          </table>
          <h2 style="color:#2196f3;font-size:1.5rem;font-weight:700;margin-bottom:0.5rem;border-bottom:3px solid #2196f3;padding-bottom:0.2em;">Top Performing Products - no brand</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:2rem;">
            <thead>
              <tr style="background:#f5f7fa;color:#222;font-size:1rem;">
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Rank</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Product</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Brand</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Price</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Demand</th>
              </tr>
            </thead>
            <tbody>
              {''.join([f'''
                <tr>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">{p.get('rank', '')}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;"><a href="{get_shopping_url(p.get('product_title', ''), args.country)}" target="_blank" rel="noopener noreferrer" style="color:#2196f3;text-decoration:none;">{p.get('product_title', '')}</a></td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">{p.get('brand', '-')}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">{price_range(p)}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">{p.get('relative_demand_bucket', '')}</td>
                </tr>
              ''' for p in top_no_brand_products])}
            </tbody>
          </table>
          <h2 style="color:#2196f3;font-size:1.5rem;font-weight:700;margin-bottom:0.5rem;border-bottom:3px solid #2196f3;padding-bottom:0.2em;">Fastest Growing Products</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:2rem;">
            <thead>
              <tr style="background:#f5f7fa;color:#222;font-size:1rem;">
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Rank</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Previous Rank</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Product</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Brand</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Price</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Rank Change</th>
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Demand Change</th>
              </tr>
            </thead>
            <tbody>
              {''.join([f'''
                <tr>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">{p.get('rank', '')}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">{p.get('previous_rank', '')}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;"><a href="{get_shopping_url(p.get('product_title', ''), args.country)}" target="_blank" rel="noopener noreferrer" style="color:#2196f3;text-decoration:none;">{p.get('product_title', '')}</a></td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">{p.get('brand', '-')}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">{price_range(p)}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;color:{'#1dbf73' if isinstance(p.get('rank_change'), int) and p.get('rank_change', 0) > 0 else '#888'};font-weight:600;">{p.get('rank_change', '')}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;color:{'#1dbf73' if p.get('demand_change', '').find('→') != -1 else '#888'};font-weight:600;">{p.get('demand_change', '')}</td>
                </tr>
              ''' for p in fastest_growing])}
            </tbody>
          </table>
          <h2 style="color:#2196f3;font-size:1.5rem;font-weight:700;margin-bottom:0.5rem;border-bottom:3px solid #2196f3;padding-bottom:0.2em;">Brand Distribution</h2>
          {brand_table_html}
          <div style="text-align:center;color:#888;font-size:0.95rem;margin-top:2.5rem;">Data source : Google Merchant Center (GMC) {latest_date} &copy; ecompulsedata.com All rights reserved.</div>
        </div>
      </div>
      '''
    # 保存 HTML
    html_file_path = keyword_csv_path.parent / f"{args.country}_{safe_keyword}.analyzed.html"
    with open(html_file_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"已生成: {html_file_path}")
    if summary:
        print("  AI总结:")
        print(f"  {summary}")
        # 保存总结到文件
        summary_file_path = keyword_csv_path.parent / f"{args.country}_{safe_keyword}.summary.txt"
        with open(summary_file_path, 'w', encoding='utf-8') as f:
            f.write(f"数据来源: {args.country} - {args.keyword}\n")
            f.write(f"生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write("=" * 50 + "\n")
            f.write(summary)
        print(f"  总结已保存: {summary_file_path}")

if __name__ == "__main__":
    main()