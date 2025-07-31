import os
import csv
import time
from pathlib import Path

def main():
    print('--- 正在运行 Bitnami 低内存版本 ---')
    
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
    
    header_written = {}
    start_time = time.time()
    
    for file in files:
        print(f"正在处理: {file.name}")
        try:
            with open(file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                header = reader.fieldnames
                row_count = 0
                country_rows = {}
                for row in reader:
                    if not row or not isinstance(row, dict):
                        continue
                    country = row.get('ranking_country')
                    if not country:
                        continue
                    if country not in country_rows:
                        country_rows[country] = []
                    country_rows[country].append(row)
                    row_count += 1
                print(f"文件 {file.name} 处理完成，共 {row_count} 行")
                
                # 处理每个国家，直接写入文件（append模式）
                for country, rows in country_rows.items():
                    if not rows:
                        continue
                    country_dir = output_dir / country
                    country_dir.mkdir(parents=True, exist_ok=True)
                    out_path = country_dir / f'{country}.csv'
                    write_header = False
                    if country not in header_written:
                        write_header = True
                        header_written[country] = True
                    with open(out_path, 'a', encoding='utf-8', newline='') as out_f:
                        writer = csv.DictWriter(out_f, fieldnames=header)
                        if write_header and out_path.stat().st_size == 0:
                            writer.writeheader()
                        writer.writerows(rows)
                    print(f"已追加: {out_path} ({len(rows)} 条)")
        except Exception as e:
            print(f"处理文件失败: {file}, 错误: {e}")
            continue
    
    duration = round(time.time() - start_time, 2)
    print(f'全部国家文件已生成。总用时: {duration} 秒')

if __name__ == '__main__':
    main()