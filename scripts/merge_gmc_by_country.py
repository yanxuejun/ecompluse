import os
import csv
import json
import time
from pathlib import Path

def main():
    print('--- 正在运行简化版本 ---')
    
    dir_path = Path(__file__).parent.parent / 'gmc_data'
    output_dir = dir_path / 'output'
    
    print('主线程启动')
    
    # 创建输出目录
    if not output_dir.exists():
        try:
            output_dir.mkdir(parents=True)
        except Exception as e:
            print(f'创建输出目录失败: {e}')
            return
    
    # 获取所有CSV文件
    files = [f for f in dir_path.iterdir() 
             if f.suffix == '.csv' and not f.name.startswith('output/')]
    
    if not files:
        print('没有找到需要处理的 .csv 文件。')
        return
    
    print(f'待处理文件总数: {len(files)}')
    
    header = None
    country_data = {}
    start_time = time.time()
    
    for file in files:
        print(f"正在处理: {file.name}")
        try:
            with open(file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                if not header:
                    header = reader.fieldnames
                
                row_count = 0
                for row in reader:
                    if not row or not isinstance(row, dict):
                        continue
                    country = row.get('ranking_country')
                    if not country:
                        continue
                    if country not in country_data:
                        country_data[country] = []
                    country_data[country].append(row)
                    row_count += 1
                print(f"文件 {file.name} 处理完成，共 {row_count} 行")
        except Exception as e:
            print(f"处理文件失败: {file}, 错误: {e}")
            continue
    
    print(f"所有文件处理完成，发现国家: {list(country_data.keys())}")
    
    # 写入文件
    for country, rows in country_data.items():
        if not rows:
            continue
        
        # 确保国家目录存在
        country_dir = output_dir / country
        country_dir.mkdir(parents=True, exist_ok=True)
        out_path = country_dir / f'{country}.csv'
        
        try:
            with open(out_path, 'w', encoding='utf-8', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=header)
                writer.writeheader()
                writer.writerows(rows)
            print(f"已生成: {out_path} ({len(rows)} 条)")
        except Exception as e:
            print(f'写入文件 {out_path} 时出错: {e}')
    
    duration = round(time.time() - start_time, 2)
    print(f'全部国家文件已生成。总用时: {duration} 秒')

if __name__ == '__main__':
    main() 