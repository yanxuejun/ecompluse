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

# 国家代码映射（从lib/country-google-shopping.ts复制）
country_google_shopping_map = {
    'AF': {'gl': 'af', 'hl': 'fa'},  # Afghanistan
    'AL': {'gl': 'al', 'hl': 'sq'},  # Albania
    'DZ': {'gl': 'dz', 'hl': 'ar'},  # Algeria
    'AO': {'gl': 'ao', 'hl': 'pt'},  # Angola
    'AR': {'gl': 'ar', 'hl': 'es'},  # Argentina
    'AM': {'gl': 'am', 'hl': 'hy'},  # Armenia
    'AU': {'gl': 'au', 'hl': 'en'},  # Australia
    'AT': {'gl': 'at', 'hl': 'de'},  # Austria
    'AZ': {'gl': 'az', 'hl': 'az'},  # Azerbaijan
    'BH': {'gl': 'bh', 'hl': 'ar'},  # Bahrain
    'BD': {'gl': 'bd', 'hl': 'bn'},  # Bangladesh
    'BY': {'gl': 'by', 'hl': 'be'},  # Belarus
    'BE': {'gl': 'be', 'hl': 'nl'},  # Belgium (Dutch)
    'BE_FR': {'gl': 'be', 'hl': 'fr'},  # Belgium (French)
    'BE_DE': {'gl': 'be', 'hl': 'de'},  # Belgium (German)
    'BO': {'gl': 'bo', 'hl': 'es'},  # Bolivia
    'BA': {'gl': 'ba', 'hl': 'bs'},  # Bosnia and Herzegovina
    'BW': {'gl': 'bw', 'hl': 'en'},  # Botswana
    'BR': {'gl': 'br', 'hl': 'pt'},  # Brazil
    'BG': {'gl': 'bg', 'hl': 'bg'},  # Bulgaria
    'CA': {'gl': 'ca', 'hl': 'en'},  # Canada (English)
    'CA_FR': {'gl': 'ca', 'hl': 'fr'},  # Canada (French)
    'CL': {'gl': 'cl', 'hl': 'es'},  # Chile
    'CN': {'gl': 'cn', 'hl': 'zh-CN'},  # China
    'CO': {'gl': 'co', 'hl': 'es'},  # Colombia
    'CR': {'gl': 'cr', 'hl': 'es'},  # Costa Rica
    'HR': {'gl': 'hr', 'hl': 'hr'},  # Croatia
    'CY': {'gl': 'cy', 'hl': 'el'},  # Cyprus (Greek)
    'CZ': {'gl': 'cz', 'hl': 'cs'},  # Czechia
    'DK': {'gl': 'dk', 'hl': 'da'},  # Denmark
    'DO': {'gl': 'do', 'hl': 'es'},  # Dominican Republic
    'EC': {'gl': 'ec', 'hl': 'es'},  # Ecuador
    'EG': {'gl': 'eg', 'hl': 'ar'},  # Egypt
    'EE': {'gl': 'ee', 'hl': 'et'},  # Estonia
    'FI': {'gl': 'fi', 'hl': 'fi'},  # Finland
    'FR': {'gl': 'fr', 'hl': 'fr'},  # France
    'GE': {'gl': 'ge', 'hl': 'ka'},  # Georgia
    'DE': {'gl': 'de', 'hl': 'de'},  # Germany
    'GH': {'gl': 'gh', 'hl': 'en'},  # Ghana
    'GR': {'gl': 'gr', 'hl': 'el'},  # Greece
    'GT': {'gl': 'gt', 'hl': 'es'},  # Guatemala
    'HN': {'gl': 'hn', 'hl': 'es'},  # Honduras
    'HK': {'gl': 'hk', 'hl': 'zh-HK'},  # Hong Kong
    'HU': {'gl': 'hu', 'hl': 'hu'},  # Hungary
    'IS': {'gl': 'is', 'hl': 'is'},  # Iceland
    'IN': {'gl': 'in', 'hl': 'en'},  # India
    'ID': {'gl': 'id', 'hl': 'id'},  # Indonesia
    'IR': {'gl': 'ir', 'hl': 'fa'},  # Iran
    'IE': {'gl': 'ie', 'hl': 'en'},  # Ireland
    'IL': {'gl': 'il', 'hl': 'he'},  # Israel
    'IT': {'gl': 'it', 'hl': 'it'},  # Italy
    'JM': {'gl': 'jm', 'hl': 'en'},  # Jamaica
    'JP': {'gl': 'jp', 'hl': 'ja'},  # Japan
    'JO': {'gl': 'jo', 'hl': 'ar'},  # Jordan
    'KZ': {'gl': 'kz', 'hl': 'kk'},  # Kazakhstan
    'KE': {'gl': 'ke', 'hl': 'en'},  # Kenya
    'KR': {'gl': 'kr', 'hl': 'ko'},  # Korea
    'KW': {'gl': 'kw', 'hl': 'ar'},  # Kuwait
    'LV': {'gl': 'lv', 'hl': 'lv'},  # Latvia
    'LB': {'gl': 'lb', 'hl': 'ar'},  # Lebanon
    'LT': {'gl': 'lt', 'hl': 'lt'},  # Lithuania
    'LU': {'gl': 'lu', 'hl': 'fr'},  # Luxembourg
    'MO': {'gl': 'mo', 'hl': 'zh-HK'},  # Macao
    'MK': {'gl': 'mk', 'hl': 'mk'},  # North Macedonia
    'MY': {'gl': 'my', 'hl': 'ms'},  # Malaysia
    'MT': {'gl': 'mt', 'hl': 'mt'},  # Malta
    'MX': {'gl': 'mx', 'hl': 'es'},  # Mexico
    'MD': {'gl': 'md', 'hl': 'ro'},  # Moldova
    'MC': {'gl': 'mc', 'hl': 'fr'},  # Monaco
    'MN': {'gl': 'mn', 'hl': 'mn'},  # Mongolia
    'ME': {'gl': 'me', 'hl': 'sr'},  # Montenegro
    'MA': {'gl': 'ma', 'hl': 'fr'},  # Morocco
    'MZ': {'gl': 'mz', 'hl': 'pt'},  # Mozambique
    'NA': {'gl': 'na', 'hl': 'en'},  # Namibia
    'NP': {'gl': 'np', 'hl': 'ne'},  # Nepal
    'NL': {'gl': 'nl', 'hl': 'nl'},  # Netherlands
    'NZ': {'gl': 'nz', 'hl': 'en'},  # New Zealand
    'NI': {'gl': 'ni', 'hl': 'es'},  # Nicaragua
    'NG': {'gl': 'ng', 'hl': 'en'},  # Nigeria
    'NO': {'gl': 'no', 'hl': 'no'},  # Norway
    'OM': {'gl': 'om', 'hl': 'ar'},  # Oman
    'PK': {'gl': 'pk', 'hl': 'en'},  # Pakistan
    'PA': {'gl': 'pa', 'hl': 'es'},  # Panama
    'PY': {'gl': 'py', 'hl': 'es'},  # Paraguay
    'PE': {'gl': 'pe', 'hl': 'es'},  # Peru
    'PH': {'gl': 'ph', 'hl': 'en'},  # Philippines
    'PL': {'gl': 'pl', 'hl': 'pl'},  # Poland
    'PT': {'gl': 'pt', 'hl': 'pt'},  # Portugal
    'PR': {'gl': 'pr', 'hl': 'es'},  # Puerto Rico
    'QA': {'gl': 'qa', 'hl': 'ar'},  # Qatar
    'RO': {'gl': 'ro', 'hl': 'ro'},  # Romania
    'RU': {'gl': 'ru', 'hl': 'ru'},  # Russia
    'SA': {'gl': 'sa', 'hl': 'ar'},  # Saudi Arabia
    'RS': {'gl': 'rs', 'hl': 'sr'},  # Serbia
    'SG': {'gl': 'sg', 'hl': 'en'},  # Singapore
    'SK': {'gl': 'sk', 'hl': 'sk'},  # Slovakia
    'SI': {'gl': 'si', 'hl': 'sl'},  # Slovenia
    'ZA': {'gl': 'za', 'hl': 'en'},  # South Africa
    'ES': {'gl': 'es', 'hl': 'es'},  # Spain
    'SE': {'gl': 'se', 'hl': 'sv'},  # Sweden
    'CH': {'gl': 'ch', 'hl': 'de'},  # Switzerland (German)
    'CH_FR': {'gl': 'ch', 'hl': 'fr'},  # Switzerland (French)
    'CH_IT': {'gl': 'ch', 'hl': 'it'},  # Switzerland (Italian)
    'TW': {'gl': 'tw', 'hl': 'zh-TW'},  # Taiwan
    'TH': {'gl': 'th', 'hl': 'th'},  # Thailand
    'TR': {'gl': 'tr', 'hl': 'tr'},  # Turkey
    'UA': {'gl': 'ua', 'hl': 'uk'},  # Ukraine
    'AE': {'gl': 'ae', 'hl': 'ar'},  # United Arab Emirates
    'GB': {'gl': 'uk', 'hl': 'en'},  # United Kingdom
    'US': {'gl': 'us', 'hl': 'en'},  # United States
    'UY': {'gl': 'uy', 'hl': 'es'},  # Uruguay
    'UZ': {'gl': 'uz', 'hl': 'uz'},  # Uzbekistan
    'VE': {'gl': 've', 'hl': 'es'},  # Venezuela
    'VN': {'gl': 'vn', 'hl': 'vi'},  # Vietnam
}

def get_shopping_url(product_title, country_code):
    """生成Google Shopping搜索链接"""
    if not product_title:
        return '#'
    
    # 获取国家映射，默认使用US
    country_map = country_google_shopping_map.get(country_code.upper(), {'gl': 'us', 'hl': 'en'})
    gl = country_map['gl']
    hl = country_map['hl']
    
    # 构建搜索URL
    encoded_title = urllib.parse.quote(product_title)
    return f"https://www.google.com/search?tbm=shop&q={encoded_title}&gl={gl}&hl={hl}"

def extract_data_from_html(html_content):
    """从HTML中提取纯数据，去除HTML标签"""
    # 移除HTML标签，保留文本内容
    text_content = re.sub(r'<[^>]+>', '', html_content)
    # 清理多余空白
    text_content = re.sub(r'\s+', ' ', text_content).strip()
    return text_content

def call_gemini_api(data_text, country, category_name):
    """调用Gemini API生成总结"""
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("  警告: 未设置GEMINI_API_KEY环境变量，跳过AI总结")
        return None
    
    prompt = f"""I am an e-commerce operations manager responsible for product selection. Based on the given data, please provide a comprehensive analysis summary of around 500 words.

Data Source: {country} - {category_name}
Data Content:
{data_text}

Please analyze the above data from an e-commerce product selection perspective, including:
1. Market trends and characteristics of popular products
2. Brand distribution analysis
3. Price range analysis
4. Features of fastest-growing products
5. Product selection recommendations and opportunities

Please respond in English, around 500 words."""
    
    try:
        # 使用正确的Gemini API端点
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
            
            # 估算token数（粗略估算：1个中文字符约等于1个token）
            estimated_tokens = len(prompt) + len(content)
            print(f"  估算token数: {estimated_tokens}")
            
            return content
        else:
            print("  Gemini API返回格式异常")
            print(f"  API响应: {result}")
            return None
            
    except Exception as e:
        print(f"  调用Gemini API失败: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"  错误详情: {e.response.text}")
        return None

def find_category_name(nodes, code):
    """递归查找 catalog_name"""
    for n in nodes:
        if n['code'] == code:
            return n['catalog_name']
        if n.get('children'):
            found = find_category_name(n['children'], code)
            if found:
                return found
    return ''

def parse_num(v):
    """解析数字"""
    if not v:
        return 0
    return float(str(v).replace(',', '').replace('$', '').replace('£', '').replace('€', '').replace('¥', '').replace('₹', '').replace('₽', '').replace('₩', '').replace('₪', '').replace('₦', '').replace('₨', '').replace('₴', '').replace('₸', '').replace('₺', '').replace('₼', '').replace('₾', '').replace('₿', '').replace(' ', ''))

def price_range(row):
    """生成价格区间字符串"""
    if row.get('price_min') and row.get('price_max') and row['price_min'] != row['price_max']:
        return f"{row['price_min']} - {row['price_max']} {row.get('price_currency', '')}"
    elif row.get('price_min'):
        return f"{row['price_min']} {row.get('price_currency', '')}"
    else:
        return ''

def get_category_name(categories, code):
    """获取类目名称"""
    return find_category_name(categories, code) or code

def main():
    # 解析命令行参数
    parser = argparse.ArgumentParser(description='生成国家report目录下所有CSV的HTML报表')
    parser.add_argument('country', type=str, help='国家代码，如 US, AE 等')
    args = parser.parse_args()
    
    print("--- 开始运行 generate_report_by_country.py ---")
    print(f"国家: {args.country}")
    
    # 读取 categories.json
    categories_path = Path(__file__).parent.parent / 'public' / 'categories.json'
    print(f"Categories path: {categories_path}")
    print(f"Categories file exists: {categories_path.exists()}")
    
    if not categories_path.exists():
        print("错误: categories.json 文件不存在！")
        return
    
    with open(categories_path, 'r', encoding='utf-8') as f:
        categories = json.load(f)
    
    # 查找国家目录
    output_root = Path(__file__).parent.parent / 'gmc_data' / 'output'
    country_dir = output_root / args.country
    
    print(f"国家目录: {country_dir}")
    print(f"国家目录存在: {country_dir.exists()}")
    
    if not country_dir.exists():
        print(f"错误: 国家目录 {country_dir} 不存在！")
        return
    
    # 查找report目录
    report_dir = country_dir / 'report'
    print(f"Report目录: {report_dir}")
    print(f"Report目录存在: {report_dir.exists()}")
    
    if not report_dir.exists():
        print(f"错误: Report目录 {report_dir} 不存在！")
        return
    
    # 查找所有CSV文件
    csv_files = [f for f in report_dir.iterdir() if f.suffix == '.csv']
    print(f"找到CSV文件: {[f.name for f in csv_files]}")
    
    if not csv_files:
        print(f"错误: 在Report目录 {report_dir} 中没有找到CSV文件！")
        return
    
    start_time = datetime.now()
    total_files_processed = 0
    
    # 处理每个CSV文件
    for csv_file in csv_files:
        print(f"\n处理文件: {csv_file.name}")
        csv_path = report_dir / csv_file.name
        
        # 读取CSV数据
        rows = []
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get('product_title'):
                    rows.append(row)
        
        print(f"  读取到 {len(rows)} 行数据")
        
        if not rows:
            print(f"  跳过空文件: {csv_file.name}")
            continue
        
        # Top 10 产品（按rank排序，取前十，product_title唯一）
        def rank_num(v):
            return parse_num(v)
        
        # 按rank升序排序
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
        
        # 从文件名提取类目ID
        filename_parts = csv_file.stem.split('_')
        category_id = filename_parts[-1] if len(filename_parts) > 1 else ''
        category_name = get_category_name(categories, category_id) if category_id else ''
        
        sub_header = f"Week of {current_date} | {category_name} | {args.country}"
        
        # 先调用Gemini API生成总结
        print("  提取数据内容...")
        # 先生成一个临时的HTML来提取数据
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
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Category</th>
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
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">{get_category_name(categories, p.get('ranking_category', ''))}</td>
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
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Category</th>
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
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">{get_category_name(categories, p.get('ranking_category', ''))}</td>
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
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Category</th>
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
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">{get_category_name(categories, p.get('ranking_category', ''))}</td>
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
        
        # 调用Gemini API生成总结
        summary = call_gemini_api(data_text, args.country, category_name)
        
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
              {summary.replace(chr(10), '<br>')}
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
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Category</th>
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
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">{get_category_name(categories, p.get('ranking_category', ''))}</td>
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
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Category</th>
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
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">{get_category_name(categories, p.get('ranking_category', ''))}</td>
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
                <th style="padding:8px 12px;border-bottom:2px solid #e0e3e8;text-align:left;">Category</th>
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
                  <td style="padding:8px 12px;border-bottom:1px solid #e0e3e8;">{get_category_name(categories, p.get('ranking_category', ''))}</td>
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
        html_file_path = csv_path.with_suffix('.analyzed.html')
        with open(html_file_path, 'w', encoding='utf-8') as f:
            f.write(html)
        
        print(f"已生成: {html_file_path}")
        
        if summary:
            print("  AI总结:")
            print(f"  {summary}")
            
            # 保存总结到文件
            summary_file_path = csv_path.with_suffix('.summary.txt')
            with open(summary_file_path, 'w', encoding='utf-8') as f:
                f.write(f"数据来源: {args.country} - {category_name}\n")
                f.write(f"生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write("=" * 50 + "\n")
                f.write(summary)
            
            print(f"  总结已保存: {summary_file_path}")
        
        total_files_processed += 1
    
    duration = (datetime.now() - start_time).total_seconds()
    print(f"\n全部报表生成完成，总用时: {duration:.2f} 秒")
    print(f"处理文件数: {total_files_processed}")

if __name__ == "__main__":
    main() 