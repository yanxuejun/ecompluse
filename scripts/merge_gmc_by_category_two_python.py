#!/usr/bin/env python3
# merge_gmc_by_category_two_python.py
# 用法：python merge_gmc_by_category_two_python.py [国家代码]
# 示例：python merge_gmc_by_category_two_python.py US
# 如果指定国家代码，只处理该国家目录，否则处理全部

import os
import json
import pandas as pd
import time
from pathlib import Path
import sys
from typing import List, Dict, Any

def collect_all_codes(category: Dict[str, Any]) -> List[str]:
    codes = [str(category['code'])]
    if 'children' in category and category['children']:
        for child in category['children']:
            codes.extend(collect_all_codes(child))
    return codes

def get_second_level_categories(top_cat: Dict[str, Any]) -> List[Dict[str, Any]]:
    return [cat for cat in top_cat.get('children', []) if cat['catalog_depth'] == '2']

def process_second_category(country: str, csv_file: Path, top_cat: Dict[str, Any], second_cat: Dict[str, Any]):
    output_root = Path(__file__).parent.parent / 'gmc_data' / 'output'
    country_dir = output_root / country
    all_codes = set(collect_all_codes(second_cat))
    second_cat_dir = country_dir / top_cat['code'] / second_cat['code']
    second_cat_dir.mkdir(parents=True, exist_ok=True)
    out_file = second_cat_dir / f"{second_cat['code']}_{country}.csv"

    try:
        df = pd.read_csv(csv_file)
        # 强制类型转换，保证isin判断正确
        df['ranking_category'] = df['ranking_category'].astype(str)
        filtered_df = df[df['ranking_category'].isin(all_codes)]
        if not filtered_df.empty:
            filtered_df.to_csv(out_file, index=False)
            print(f"已生成: {out_file} ({len(filtered_df)} 条)")
        else:
            # 仍然写表头
            df.head(0).to_csv(out_file, index=False)
            print(f"已生成: {out_file} (0 条)")
    except Exception as e:
        print(f"处理 {csv_file} 时出错: {e}")

def main():
    start_time = time.time()
    # 读取 categories.json
    categories_path = Path(__file__).parent.parent / 'public' / 'categories.json'
    with open(categories_path, 'r', encoding='utf-8') as f:
        categories = json.load(f)
    top_categories = [cat for cat in categories if cat['catalog_depth'] == '1']

    output_root = Path(__file__).parent.parent / 'gmc_data' / 'output'
    all_country_dirs = [d for d in output_root.iterdir() if d.is_dir()]

    # 获取要处理的国家目录
    target_country = sys.argv[1] if len(sys.argv) > 1 else None
    if target_country:
        country_dirs = [d for d in all_country_dirs if d.name == target_country]
    else:
        country_dirs = all_country_dirs

    if target_country and not country_dirs:
        print(f"错误：找不到国家目录 {target_country}")
        sys.exit(1)

    print(f"开始处理{('国家 ' + target_country) if target_country else '所有国家'}...")
    for country_dir in country_dirs:
        country = country_dir.name
        country_start_time = time.time()
        csv_files = [f for f in country_dir.iterdir() if f.suffix == '.csv']
        for csv_file in csv_files:
            csv_start_time = time.time()
            for top_cat in top_categories:
                second_cats = get_second_level_categories(top_cat)
                for second_cat in second_cats:
                    process_second_category(country, csv_file, top_cat, second_cat)
            csv_duration = time.time() - csv_start_time
            print(f"处理 {country}/{csv_file.name} 完成，用时: {csv_duration:.2f} 秒")
        country_duration = time.time() - country_start_time
        print(f"处理国家 {country} 完成，用时: {country_duration:.2f} 秒")
    total_duration = time.time() - start_time
    print(f"全部国家和二级类目处理完成，总用时: {total_duration:.2f} 秒")

if __name__ == "__main__":
    main() 