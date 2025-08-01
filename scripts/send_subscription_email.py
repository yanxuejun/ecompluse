import os
import sys
import argparse
from pathlib import Path
import requests
import json

def main():
    # Parse command-line arguments
    parser = argparse.ArgumentParser(description='Send subscription email')
    parser.add_argument('email', type=str, help='Recipient email address')
    parser.add_argument('categories', type=str, help='List of categories, e.g., US_1,US_1604,US_toy accessories')
    args = parser.parse_args()
    
    print("--- Running send_subscription_email.py ---")
    print(f"Recipient: {args.email}")
    print(f"Categories: {args.categories}")
    
    # Parse the list of categories
    category_list = [cat.strip() for cat in args.categories.split(',') if cat.strip()]
    print(f"Parsed categories: {category_list}")
    
    html_parts = []
    
    # Process each category
    for cat in category_list:
        # MODIFICATION: Split only on the first underscore to correctly handle
        # formats like "US_toy accessories".
        parts = cat.split('_', 1)
        if len(parts) != 2:
            print(f"Skipping invalid category format: {cat}")
            continue
        
        country = parts[0]
        # The full category string 'cat' (e.g., "US_222" or "US_toy accessories")
        # will be used as the base for the filename.
        print(f"\nProcessing category: {cat}")
        
        # Find the corresponding HTML file
        output_root = Path(__file__).parent.parent / 'gmc_data' / 'output'
        report_dir = output_root / country / 'report'
        
        # MODIFICATION: The filename is now based on the full category string 'cat'.
        # This handles both "US_222.analyzed.html" and "US_toy accessories.analyzed.html".
        # As per the request, if the format is keyword-based, it will now look for the
        # corresponding .analyzed.html file instead of a .csv file to maintain
        # the script's primary function of emailing HTML reports.
        filename_base = cat.replace(' ', '_')
        html_file = report_dir / f"{filename_base}.analyzed.html"
        
        print(f"Looking for HTML file: {html_file}")
        print(f"File exists: {html_file.exists()}")
        
        if not html_file.exists():
            print(f"HTML file not found: {html_file}")
            continue
        
        try:
            # Read HTML content
            with open(html_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Extract the main content (remove outer div wrapper)
            # Find content from <div style="background:#f7f9fa;padding:40px 0 0 0;min-height:100vh;">
            # to the matching </div>
            start_marker = '<div style="background:#f7f9fa;padding:40px 0 0 0;min-height:100vh;">'
            end_marker = '</div>'
            
            start_pos = content.find(start_marker)
            if start_pos != -1:
                start_pos += len(start_marker)
                # Simple handling: find the last </div>
                end_pos = content.rfind(end_marker)
                if end_pos != -1:
                    content = content[start_pos:end_pos].strip()
            
            html_parts.append(f'<div style="margin-bottom:32px;">{content}</div>')
            print(f"Successfully read HTML content, length: {len(content)} characters")
            
        except Exception as e:
            print(f"Failed to read HTML file: {html_file}, Error: {e}")
            continue
    
    if not html_parts:
        print("Error: No HTML content was found.")
        return
    
    # Concatenate final HTML
    final_html = f'''
    <div style="font-family:Arial,sans-serif;">
      <h2></h2>
      {''.join(html_parts)}
    </div>
    '''
    
    print(f"\nGenerated HTML content length: {len(final_html)} characters")
    
    # Send email using Resend API
    try:
        resend_api_key = os.getenv('RESEND_API_KEY')
        if not resend_api_key:
            print("Error: RESEND_API_KEY environment variable not set")
            return
        
        # Resend API request
        url = "https://api.resend.com/emails"
        headers = {
            "Authorization": f"Bearer {resend_api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "from": os.getenv('RESEND_FROM', 'noreply@ecompulsedata.com'),
            "to": [args.email],
            "subject": "Your Weekly Subscription Report - EcomPulseData",
            "html": final_html
        }
        
        response = requests.post(url, headers=headers, json=data)
        
        if response.status_code == 200:
            result = response.json()
            print(f"Email sent successfully to: {args.email}")
            print(f"Resend result: {result}")
        else:
            print(f"Failed to send email: {response.status_code}")
            print(f"Error message: {response.text}")
            
    except Exception as e:
        print(f"Failed to send email: {e}")
        print("Please check the RESEND_API_KEY environment variable.")

if __name__ == "__main__":
    main()