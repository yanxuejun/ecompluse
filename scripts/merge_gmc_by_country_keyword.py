import os
import json
import csv
import sys
import argparse
from pathlib import Path

def main():
    # 解析命令行参数
    parser = argparse.ArgumentParser(description='按国家和关键词处理GMC数据')
    parser.add_argument('country', type=str, help='国家代码，如 US, AE 等')
    parser.add_argument('keyword', type=str, help='搜索关键词，用于在product_title中模糊查询')
    args = parser.parse_args()
    
    print("--- 开始运行 merge_report_by_country_keyword.py ---")
    print(f"国家: {args.country}")
    print(f"关键词: {args.keyword}")
    
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
        output_filename = f"{args.country}_{args.keyword}.csv"
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
                    # 检查product_title是否包含关键词（不区分大小写）
                    product_title = row.get('product_title', '').lower()
                    if args.keyword.lower() in product_title:
                        writer.writerow(row)
                        count += 1
        
        print(f"已生成: {output_path} ({count} 条)")
        total_products += count
    
    print(f"\n处理完成！总共找到 {total_products} 个产品。")
    print(f"输出文件: {output_dir / f'{args.country}_{args.keyword}.csv'}")

if __name__ == "__main__":
    main() 