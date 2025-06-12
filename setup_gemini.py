#!/usr/bin/env python3
"""
Setup script for Gemini RAG Chatbot
This script helps verify and setup the Gemini integration
"""

import os
import sys
from dotenv import load_dotenv

def check_environment():
    """Check if all required environment variables are set"""
    load_dotenv()
    
    print("🔍 Checking environment configuration...")
    
    required_vars = {
        'AI_PROVIDER': os.getenv('AI_PROVIDER'),
        'GEMINI_API_KEY': os.getenv('GEMINI_API_KEY'),
        'GEMINI_MODEL': os.getenv('GEMINI_MODEL'),
    }
    
    missing_vars = []
    for var, value in required_vars.items():
        if value:
            print(f"✅ {var}: {value}")
        else:
            print(f"❌ {var}: Not set")
            missing_vars.append(var)
    
    if missing_vars:
        print(f"\n⚠️  Missing required environment variables: {', '.join(missing_vars)}")
        return False
    
    return True

def test_gemini_connection():
    """Test connection to Gemini API"""
    try:
        import google.generativeai as genai
        
        load_dotenv()
        api_key = os.getenv('GEMINI_API_KEY')
        model_name = os.getenv('GEMINI_MODEL', 'gemini-1.5-flash')
        
        print(f"🧪 Testing Gemini API connection...")
        print(f"   Model: {model_name}")
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(model_name)
        
        # Test with a simple prompt
        response = model.generate_content("Say 'Hello' if you can hear me.")
        print(f"✅ Gemini API test successful!")
        print(f"   Response: {response.text[:50]}...")
        
        return True
        
    except Exception as e:
        print(f"❌ Gemini API test failed: {str(e)}")
        return False

def check_dependencies():
    """Check if all required packages are installed"""
    print("📦 Checking dependencies...")
    
    required_packages = [
        ('google-generativeai', 'google.generativeai'),
        ('python-dotenv', 'dotenv'),
        ('fastapi', 'fastapi'),
        ('sentence-transformers', 'sentence_transformers'),
        ('chromadb', 'chromadb'),
        ('PyPDF2', 'PyPDF2'),
        ('requests', 'requests'),
        ('beautifulsoup4', 'bs4'),
    ]
    
    missing_packages = []
    for package_name, import_name in required_packages:
        try:
            __import__(import_name)
            print(f"✅ {package_name}")
        except ImportError:
            print(f"❌ {package_name}")
            missing_packages.append(package_name)
    
    if missing_packages:
        print(f"\n⚠️  Missing packages: {', '.join(missing_packages)}")
        print("Install them with: pip install " + " ".join(missing_packages))
        return False
    
    return True

def main():
    """Main setup function"""
    print("🚀 Gemini RAG Chatbot Setup\n")
    
    # Check dependencies
    deps_ok = check_dependencies()
    if not deps_ok:
        print("\n❌ Setup failed: Missing dependencies")
        return False
    
    # Check environment
    env_ok = check_environment()
    if not env_ok:
        print("\n❌ Setup failed: Environment configuration issues")
        return False
    
    # Test Gemini connection
    api_ok = test_gemini_connection()
    if not api_ok:
        print("\n❌ Setup failed: Cannot connect to Gemini API")
        return False
    
    print("\n✅ Setup completed successfully!")
    print("\nNext steps:")
    print("1. Run: python backend.py")
    print("2. In another terminal, run: cd frontend && npm run dev")
    print("3. Open http://localhost:3000 in your browser")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
