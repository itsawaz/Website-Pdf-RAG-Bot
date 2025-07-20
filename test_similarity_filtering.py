"""
Test script to demonstrate the improved RAG system with similarity filtering.
This shows how the system now handles cases where no relevant matches are found.
"""

import requests
import json
import time

# Backend URL
BASE_URL = "http://localhost:8000"

def test_rag_system():
    print("🧪 Testing RAG System with Similarity Filtering")
    print("=" * 50)
    
    # Test 1: Check if backend is running
    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            print("✅ Backend is running")
            data = response.json()
            print(f"   Model: {data['model']}")
            print(f"   AI Provider: {data['ai_provider']}")
        else:
            print("❌ Backend not responding properly")
            return
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend. Make sure it's running on port 8000")
        return
    
    # Test 2: Get model info
    try:
        response = requests.get(f"{BASE_URL}/model-info")
        if response.status_code == 200:
            info = response.json()
            print(f"\n📊 Knowledge Base Info:")
            print(f"   Documents in database: {info['database_documents']}")
            print(f"   Embedding model: {info['embedding_model']}")
        else:
            print("❌ Could not get model info")
    except Exception as e:
        print(f"❌ Error getting model info: {e}")
    
    # Test 3: Test queries that should have no relevant matches
    test_queries = [
        "What is quantum computing in artificial intelligence?",
        "How to bake a chocolate cake?",
        "What are the latest cryptocurrency trends?",
        "Explain machine learning algorithms in detail"
    ]
    
    print(f"\n🔍 Testing Queries (these should return 'no related info' if no relevant docs exist):")
    print("-" * 70)
    
    for query in test_queries:
        print(f"\n🤔 Query: '{query}'")
        try:
            response = requests.post(
                f"{BASE_URL}/chat",
                json={"message": query},
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                result = response.json()
                response_text = result.get("response", "No response")
                print(f"🤖 Response: {response_text}")
                
                # Check if the response indicates no relevant information
                no_info_indicators = [
                    "no related information",
                    "no relevant information", 
                    "doesn't match any content",
                    "no knowledge base",
                    "insufficient information"
                ]
                
                if any(indicator in response_text.lower() for indicator in no_info_indicators):
                    print("   ✅ Properly handled - indicated no relevant information found")
                else:
                    print("   ℹ️ Generated response (may or may not be from knowledge base)")
                    
            else:
                error_data = response.json() if response.headers.get('content-type') == 'application/json' else response.text
                print(f"   ❌ Error: {error_data}")
                
        except Exception as e:
            print(f"   ❌ Request failed: {e}")
        
        time.sleep(1)  # Small delay between requests
    
    print(f"\n" + "=" * 50)
    print("🎯 Test Summary:")
    print("- If the knowledge base is empty or has no relevant content,")
    print("  you should see responses indicating 'no related information found'")
    print("- This prevents the AI from hallucinating or making up answers")
    print("- The similarity threshold can be adjusted via SIMILARITY_THRESHOLD env var")
    print("- Set DEBUG_SIMILARITY=true to see similarity scores in the logs")

if __name__ == "__main__":
    test_rag_system()
