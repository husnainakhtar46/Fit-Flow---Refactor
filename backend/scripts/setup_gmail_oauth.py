"""
Gmail OAuth2 Setup Script

This script performs the one-time OAuth flow to authorize the application
to send emails on behalf of your Gmail account.

Usage:
    1. Download credentials.json from Google Cloud Console
    2. Place it in the backend root directory (or project root)
    3. Run: python scripts/setup_gmail_oauth.py
    4. Follow the browser prompts to authorize
    5. The script will create gmail-token.json
"""

import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from google_auth_oauthlib.flow import InstalledAppFlow
from google.oauth2.credentials import Credentials

# Gmail API scope for sending emails
SCOPES = ['https://www.googleapis.com/auth/gmail.send']

def main():
    print("=" * 60)
    print("Gmail OAuth2 Setup for FitFlow QA")
    print("=" * 60)
    print()
    
    # Look for credentials.json
    credentials_path = 'credentials.json'
    if not os.path.exists(credentials_path):
        print("ERROR: credentials.json not found!")
        print()
        print("Please follow these steps:")
        print("1. Go to https://console.cloud.google.com/")
        print("2. Create a project or select existing one")
        print("3. Enable the Gmail API")
        print("4. Go to APIs & Services > Credentials")
        print("5. Create OAuth 2.0 Client ID (Desktop app)")
        print("6. Download the JSON file and rename to 'credentials.json'")
        print("7. Place it in the backend directory")
        print("8. Run this script again")
        return
    
    print("Found credentials.json")
    print()
    print("A browser window will open for you to sign in and grant email send permission.")
    print()
    input("Press Enter to continue...")
    
    try:
        # Run the OAuth flow
        flow = InstalledAppFlow.from_client_secrets_file(credentials_path, SCOPES)
        creds = flow.run_local_server(port=8080)
        
        # Save the credentials
        token_path = 'gmail-token.json'
        with open(token_path, 'w') as token:
            token.write(creds.to_json())
        
        print()
        print("=" * 60)
        print("SUCCESS! Gmail OAuth2 setup complete.")
        print("=" * 60)
        print()
        print(f"Token saved to: {token_path}")
        print()
        print("You can now send inspection report emails via Gmail API!")
        
    except Exception as e:
        print(f"ERROR: {e}")
        print()
        print("If you see 'redirect_uri_mismatch', make sure you:")
        print("1. Created a 'Desktop app' OAuth client (not Web)")
        print("2. Or added http://localhost:8080/ to redirect URIs")


if __name__ == '__main__':
    main()
