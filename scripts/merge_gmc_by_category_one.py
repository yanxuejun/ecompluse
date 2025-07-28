import os
import json
import csv
import sys
import argparse
from pathlib import Path

def collect_all_codes(category):
    """递归收集所有子类目 code"""
    codes = [category['code']]
    if category.get('children') and len(category['children']) > 0:
        for child in category['children']:
            codes.extend(collect_all_codes(child))
    return codes

def main():
    # 解析命令行参数
    parser = argparse.ArgumentParser(description='按类目处理GMC数据')
    parser.add_argument('country', nargs='?', type=str, 
                       help='指定国家代码，如 US, AE 等。不指定则处理全部国家')
    args = parser.parse_args()
    
    print("--- 开始运行 merge_gmc_by_category_one.py ---")
    if args.country:
        print(f"指定国家: {args.country}")
    else:
        print("处理全部国家")
    
    # 读取 categories.json
    categories_path = Path(__file__).parent.parent / 'public' / 'categories.json'
    print(f"Categories path: {categories_path}")
    print(f"Categories file exists: {categories_path.exists()}")
    
    with open(categories_path, 'r', encoding='utf-8') as f:
        categories = json.load(f)
    
    # 找到所有 catalog_depth=1 的一级类目
    top_categories = [cat for cat in categories if cat['catalog_depth'] == '1']
    print(f"Top categories count: {len(top_categories)}")
    
    output_root = Path(__file__).parent.parent / 'gmc_data' / 'output'
    print(f"Output root: {output_root}")
    print(f"Output root exists: {output_root.exists()}")
    
    if not output_root.exists():
        print("错误: output 目录不存在！")
        return
    
    country_dirs = [d for d in output_root.iterdir() if d.is_dir()]
    print(f"Country directories found: {[d.name for d in country_dirs]}")
    
    if not country_dirs:
        print("错误: 没有找到国家目录！")
        return
    
    # 根据参数筛选要处理的国家
    if args.country:
        country_dirs = [d for d in country_dirs if d.name == args.country]
        if not country_dirs:
            print(f"错误: 没有找到国家 {args.country} 的目录！")
            return
        print(f"将处理国家: {[d.name for d in country_dirs]}")
    else:
        print(f"将处理全部国家: {[d.name for d in country_dirs]}")
    
    total_files_processed = 0
    
    for country in country_dirs:
        print(f"\n处理国家: {country.name}")
        country_dir = output_root / country.name
        
        # 直接查找国家目录下的CSV文件
        csv_files = [f for f in country_dir.iterdir() if f.suffix == '.csv']
        print(f"  找到CSV文件: {[f.name for f in csv_files]}")
        
        for csv_file in csv_files:
            print(f"  处理文件: {csv_file.name}")
            csv_path = country_dir / csv_file.name
            
            # 为每个一级类目创建对应的输出
            for cat in top_categories:
                cat_code = cat['code']
                print(f"    处理类目: {cat_code}")
                
                all_codes = set(collect_all_codes(cat))
                print(f"    类目 {cat_code} 包含的所有code: {list(all_codes)[:5]}...")  # 只显示前5个
                
                # 创建输出目录
                out_dir = country_dir / cat_code
                out_dir.mkdir(parents=True, exist_ok=True)
                out_file = out_dir / f"{cat_code}_{country.name}.csv"
                
                # 先写表头
                with open(csv_path, 'r', encoding='utf-8') as f:
                    first_line = f.readline().strip()
                
                with open(out_file, 'w', encoding='utf-8', newline='') as f:
                    f.write(first_line + '\n')
                
                # 流式读取和筛选
                count = 0
                with open(csv_path, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    with open(out_file, 'a', encoding='utf-8', newline='') as out_f:
                        writer = csv.DictWriter(out_f, fieldnames=reader.fieldnames)
                        
                        for row in reader:
                            if row['ranking_category'] in all_codes:
                                writer.writerow(row)
                                count += 1
                
                print(f"    已生成: {out_file} ({count} 条)")
                total_files_processed += 1
    
    print(f"\n处理完成！总共处理了 {total_files_processed} 个文件。")

if __name__ == "__main__":
    main() 