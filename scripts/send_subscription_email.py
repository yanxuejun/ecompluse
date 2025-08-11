import os
import sys
import argparse
from pathlib import Path
import requests
import json
import time
import hmac
import hashlib
import base64
from urllib.parse import urlencode

def main():
    # Parse command-line arguments
    parser = argparse.ArgumentParser(description='Send subscription email')
    parser.add_argument('email', type=str, help='Recipient email address')
    parser.add_argument('category', type=str, help='Single category, e.g., US_1 or US_toy accessories')
    args = parser.parse_args()
    
    print("--- Running send_subscription_email.py ---")
    print(f"Recipient: {args.email}")
    print(f"Category: {args.category}")

    # Validate and extract parts from single category
    category = args.category.strip()
    parts = category.split('_', 1)
    if len(parts) != 2:
        print(f"Error: Invalid category format: {category}. Expected format like 'US_1' or 'US_toy accessories'.")
        return

    country = parts[0]
    print(f"\nProcessing category: {category}")

    # Find the corresponding HTML file
    output_root = Path(__file__).parent.parent / 'gmc_data' / 'output'
    report_dir = output_root / country / 'report'

    # The filename is based on the full category string
    filename_base = category.replace(' ', '_')
    html_file = report_dir / f"{filename_base}.analyzed.html"

    print(f"Looking for HTML file: {html_file}")
    print(f"File exists: {html_file.exists()}")

    if not html_file.exists():
        print(f"Error: HTML file not found: {html_file}")
        return

    try:
        # Read HTML content
        with open(html_file, 'r', encoding='utf-8') as f:
            content = f.read()

        # Extract the main content (remove outer div wrapper)
        start_marker = '<div style="background:#f7f9fa;padding:40px 0 0 0;min-height:100vh;">'
        end_marker = '</div>'

        start_pos = content.find(start_marker)
        if start_pos != -1:
            start_pos += len(start_marker)
            # Simple handling: find the last </div>
            end_pos = content.rfind(end_marker)
            if end_pos != -1:
                content = content[start_pos:end_pos].strip()

        wrapped_content = f'<div style="margin-bottom:32px;">{content}</div>'
        print(f"Successfully read HTML content, length: {len(content)} characters")
    except Exception as e:
        print(f"Failed to read HTML file: {html_file}, Error: {e}")
        return

    # Build unsubscribe JWT token and URL
    def base64url_encode(data: bytes) -> str:
        return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

    def sign_jwt_hs256(payload: dict, secret: str) -> str:
        header = {"alg": "HS256", "typ": "JWT"}
        header_b64 = base64url_encode(json.dumps(header, separators=(',', ':'), ensure_ascii=False).encode('utf-8'))
        payload_b64 = base64url_encode(json.dumps(payload, separators=(',', ':'), ensure_ascii=False).encode('utf-8'))
        signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
        signature = hmac.new(secret.encode('utf-8'), signing_input, hashlib.sha256).digest()
        signature_b64 = base64url_encode(signature)
        return f"{header_b64}.{payload_b64}.{signature_b64}"

    jwt_secret = os.getenv('UNSUBSCRIBE_JWT_SECRET')
    if not jwt_secret:
        print("Error: UNSUBSCRIBE_JWT_SECRET environment variable not set")
        return
    now = int(time.time())
    # Default token validity to 30 days
    exp_seconds = int(os.getenv('UNSUBSCRIBE_JWT_TTL_SECONDS', '2592000'))
    token_payload = {
        "email": args.email,
        "category": category,
        "type": "unsubscribe",
        "iat": now,
        "exp": now + exp_seconds,
    }
    unsubscribe_token = sign_jwt_hs256(token_payload, jwt_secret)

    base_unsubscribe_url = os.getenv('UNSUBSCRIBE_URL_BASE', 'https://ecompulsedata.com/api/unsubscribe')
    unsubscribe_url = f"{base_unsubscribe_url}?" + urlencode({"token": unsubscribe_token})

    # Final HTML with unsubscribe footer
    final_html = f'''
    <div style="font-family:Arial,sans-serif;">
      <h2></h2>
      {wrapped_content}
      <div style="margin-top:24px;font-size:12px;color:#6b7280;">
        如果你不想再接收该类别的周报，可以点击这里退订：
        <a href="{unsubscribe_url}">Unsubscribe</a>
      </div>
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
        
        # Email payload for Resend
        data = {
            "from": os.getenv('RESEND_FROM', 'noreply@ecompulsedata.com'),
            "to": [args.email],
            "subject": "Your Weekly Subscription Report - EcomPulseData",
            "html": final_html,
            # Enable one-click unsubscribe in supporting clients
            "headers": {
                "List-Unsubscribe": f"<{unsubscribe_url}>",
                "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
            }
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