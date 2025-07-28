import os
import sys
import argparse
from pathlib import Path
import requests
import json

def main():
    # 解析命令行参数
    parser = argparse.ArgumentParser(description='发送订阅邮件')
    parser.add_argument('email', type=str, help='收件人邮箱')
    parser.add_argument('categories', type=str, help='类目列表，如 US_1,US_1604,US_188')
    args = parser.parse_args()
    
    print("--- 开始运行 send_subscription_email.py ---")
    print(f"收件人: {args.email}")
    print(f"类目: {args.categories}")
    
    # 解析类目列表
    category_list = [cat.strip() for cat in args.categories.split(',') if cat.strip()]
    print(f"解析的类目: {category_list}")
    
    html_parts = []
    
    # 处理每个类目
    for cat in category_list:
        parts = cat.split('_')
        if len(parts) != 2:
            print(f"跳过无效类目格式: {cat}")
            continue
        
        country, category_id = parts
        print(f"\n处理类目: {country}_{category_id}")
        
        # 查找对应的HTML文件
        output_root = Path(__file__).parent.parent / 'gmc_data' / 'output'
        report_dir = output_root / country / 'report'
        html_file = report_dir / f"{country}_{category_id}.analyzed.html"
        
        print(f"查找HTML文件: {html_file}")
        print(f"文件存在: {html_file.exists()}")
        
        if not html_file.exists():
            print(f"HTML文件不存在: {html_file}")
            continue
        
        try:
            # 读取HTML内容
            with open(html_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 提取主要内容（去掉外层div包装）
            # 查找 <div style="background:#f7f9fa;padding:40px 0 0 0;min-height:100vh;"> 开始到 </div> 结束的内容
            start_marker = '<div style="background:#f7f9fa;padding:40px 0 0 0;min-height:100vh;">'
            end_marker = '</div>'
            
            start_pos = content.find(start_marker)
            if start_pos != -1:
                # 找到开始位置，查找对应的结束位置
                start_pos += len(start_marker)
                # 简单处理：找到最后一个 </div>
                end_pos = content.rfind(end_marker)
                if end_pos != -1:
                    content = content[start_pos:end_pos].strip()
            
            html_parts.append(f'<div style="margin-bottom:32px;">{content}</div>')
            print(f"成功读取HTML内容，长度: {len(content)} 字符")
            
        except Exception as e:
            print(f"读取HTML文件失败: {html_file}, 错误: {e}")
            continue
    
    if not html_parts:
        print("错误: 没有找到任何HTML内容。")
        return
    
    # 拼接最终HTML
    final_html = f'''
    <div style="font-family:Arial,sans-serif;">
      <h2></h2>
      {''.join(html_parts)}
    </div>
    '''
    
    print(f"\n生成的HTML内容长度: {len(final_html)} 字符")
    
    # 使用Resend API发送邮件
    try:
        resend_api_key = os.getenv('RESEND_API_KEY')
        if not resend_api_key:
            print("错误: 未设置 RESEND_API_KEY 环境变量")
            return
        
        # Resend API 请求
        url = "https://api.resend.com/emails"
        headers = {
            "Authorization": f"Bearer {resend_api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "from": os.getenv('RESEND_FROM', 'noreply@ecompulsedata.com'),
            "to": [args.email],
            "subject": "您的每周订阅报告-EcomPulseData",
            "html": final_html
        }
        
        response = requests.post(url, headers=headers, json=data)
        
        if response.status_code == 200:
            result = response.json()
            print(f"邮件发送成功: {args.email}")
            print(f"Resend 结果: {result}")
        else:
            print(f"发送邮件失败: {response.status_code}")
            print(f"错误信息: {response.text}")
            
    except Exception as e:
        print(f"发送邮件失败: {e}")
        print("请检查 RESEND_API_KEY 环境变量")

if __name__ == "__main__":
    main() 