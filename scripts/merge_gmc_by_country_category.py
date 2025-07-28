import os
import json
import csv
import sys
import argparse
from pathlib import Path

def find_category_by_id(categories, target_id):
    """递归查找指定ID的类目"""
    for category in categories:
        if category['code'] == target_id:
            return category
        if category.get('children') and len(category['children']) > 0:
            result = find_category_by_id(category['children'], target_id)
            if result:
                return result
    return None

def collect_all_codes(category):
    """递归收集所有子类目 code"""
    codes = [category['code']]
    if category.get('children') and len(category['children']) > 0:
        for child in category['children']:
            codes.extend(collect_all_codes(child))
    return codes

def main():
    # 解析命令行参数
    parser = argparse.ArgumentParser(description='按国家和类目处理GMC数据')
    parser.add_argument('country', type=str, help='国家代码，如 US, AE 等')
    parser.add_argument('category_id', type=str, help='类目ID，如 5406')
    args = parser.parse_args()
    
    print("--- 开始运行 merge_gmc_by_country_category.py ---")
    print(f"国家: {args.country}")
    print(f"类目ID: {args.category_id}")
    
    # 读取 categories.json
    categories_path = Path(__file__).parent.parent / 'public' / 'categories.json'
    print(f"Categories path: {categories_path}")
    print(f"Categories file exists: {categories_path.exists()}")
    
    if not categories_path.exists():
        print("错误: categories.json 文件不存在！")
        return
    
    with open(categories_path, 'r', encoding='utf-8') as f:
        categories = json.load(f)
    
    # 查找指定的类目
    target_category = find_category_by_id(categories, args.category_id)
    if not target_category:
        print(f"错误: 没有找到类目ID {args.category_id}！")
        return
    
    print(f"找到类目: {target_category.get('catalog_name', '')} (ID: {target_category['code']})")
    
    # 收集所有子类目代码
    all_codes = set(collect_all_codes(target_category))
    print(f"类目 {args.category_id} 包含的所有code: {list(all_codes)}")  # 打印全部
    
    # 查找国家目录
    gmc_data_root = Path(__file__).parent.parent / 'gmc_data' / 'output'
    country_dir = gmc_data_root / args.country
    
    print(f"国家目录: {country_dir}")
    print(f"国家目录存在: {country_dir.exists()}")
    
    if not country_dir.exists():
        print(f"错误: 国家目录 {country_dir} 不存在！")
        return
    
    # 查找CSV文件
    csv_files = [f for f in country_dir.iterdir() if f.suffix == '.csv']
    print(f"找到CSV文件: {[f.name for f in csv_files]}")
    
    if not csv_files:
        print(f"错误: 在国家目录 {country_dir} 中没有找到CSV文件！")
        return
    
    # 输出目录为国家下的report目录
    output_dir = country_dir / 'report'
    output_dir.mkdir(parents=True, exist_ok=True)
    
    total_products = 0
    
    # 处理每个CSV文件
    for csv_file in csv_files:
        print(f"\n处理文件: {csv_file.name}")
        csv_path = country_dir / csv_file.name
        
        # 生成输出文件名
        output_filename = f"{args.country}_{args.category_id}.csv"
        output_path = output_dir / output_filename
        
        print(f"输出文件: {output_path}")
        
        # 先写表头
        with open(csv_path, 'r', encoding='utf-8') as f:
            first_line = f.readline().strip()
        
        with open(output_path, 'w', encoding='utf-8', newline='') as f:
            f.write(first_line + '\n')
        
        # 流式读取和筛选
        count = 0
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            with open(output_path, 'a', encoding='utf-8', newline='') as out_f:
                writer = csv.DictWriter(out_f, fieldnames=reader.fieldnames)
                
                for row in reader:
                    if row['ranking_category'] in all_codes:
                        writer.writerow(row)
                        count += 1
        
        print(f"已生成: {output_path} ({count} 条)")
        total_products += count
    
    print(f"\n处理完成！总共找到 {total_products} 个产品。")
    print(f"输出文件: {output_dir / f'{args.country}_{args.category_id}.csv'}")

if __name__ == "__main__":
    main() 