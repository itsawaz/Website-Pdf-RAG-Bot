import ollama
import chromadb
from sentence_transformers import SentenceTransformer
import PyPDF2
import requests
from bs4 import BeautifulSoup
import re
from urllib.parse import urljoin, urlparse
import hashlib
import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

class GraniteRAGChatbot:
    def __init__(self):
        # Load configuration from environment
        self.ai_provider = os.getenv('AI_PROVIDER', 'ollama').lower()
        
        # Initialize AI client based on provider
        if self.ai_provider == 'gemini':
            api_key = os.getenv('GEMINI_API_KEY')
            if not api_key:
                raise ValueError("GEMINI_API_KEY not found in environment variables")
            genai.configure(api_key=api_key)
            self.model = os.getenv('GEMINI_MODEL', 'gemini-1.5-flash')
            self.gemini_model = genai.GenerativeModel(self.model)
            print(f"✅ Using Gemini model: {self.model}")
        else:
            # Initialize Ollama client
            self.client = ollama.Client()
            self.model = os.getenv('OLLAMA_MODEL', 'granite3.3:8b')
            print(f"✅ Using Ollama model: {self.model}")
        
        # Initialize embedding model
        self.embedder = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Initialize ChromaDB
        chroma_path = os.getenv('CHROMA_DB_PATH', './chroma_db')
        self.chroma_client = chromadb.PersistentClient(path=chroma_path)
        self.collection_name = "knowledge_base"
        
        # Try to get existing collection or create new one
        try:
            self.collection = self.chroma_client.get_collection(self.collection_name)
        except:
            self.collection = self.chroma_client.create_collection(self.collection_name)
        
        print(f"✅ RAG Chatbot initialized with {self.collection.count()} documents")
    
    def chunk_text(self, text, chunk_size=None, overlap=None):
        """Split text into overlapping chunks"""
        chunk_size = chunk_size or int(os.getenv('CHUNK_SIZE', 500))
        overlap = overlap or int(os.getenv('CHUNK_OVERLAP', 50))
        
        words = text.split()
        chunks = []
        
        for i in range(0, len(words), chunk_size - overlap):
            chunk = ' '.join(words[i:i + chunk_size])
            if chunk.strip():
                chunks.append(chunk.strip())
        
        return chunks
    
    def add_pdf(self, pdf_path):
        """Extract text from PDF and add to knowledge base"""
        try:
            print(f"📄 Processing PDF: {pdf_path}")
            
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                
                for page_num, page in enumerate(pdf_reader.pages):
                    page_text = page.extract_text()
                    text += f"\n--- Page {page_num + 1} ---\n{page_text}"
            
            # Clean and chunk the text
            text = re.sub(r'\s+', ' ', text).strip()
            chunks = self.chunk_text(text)
            
            # Generate embeddings and add to collection
            embeddings = self.embedder.encode(chunks)
            
            # Create unique IDs for chunks
            pdf_name = os.path.basename(pdf_path)
            ids = [f"pdf_{pdf_name}_{i}" for i in range(len(chunks))]
            
            self.collection.add(
                documents=chunks,
                embeddings=embeddings.tolist(),
                ids=ids,
                metadatas=[{"source": f"PDF: {pdf_name}", "type": "pdf"} for _ in chunks]
            )
            
            print(f"✅ Added {len(chunks)} chunks from PDF: {pdf_name}")
            
        except Exception as e:
            print(f"❌ Error processing PDF {pdf_path}: {str(e)}")
    
    def add_website(self, url, max_pages=5):
        """Scrape website content and add to knowledge base"""
        try:
            print(f"🌐 Processing website: {url}")
            
            visited_urls = set()
            urls_to_visit = [url]
            all_content = []
            
            for _ in range(max_pages):
                if not urls_to_visit:
                    break
                
                current_url = urls_to_visit.pop(0)
                if current_url in visited_urls:
                    continue
                
                visited_urls.add(current_url)
                
                try:
                    response = requests.get(current_url, timeout=10)
                    response.raise_for_status()
                    
                    soup = BeautifulSoup(response.content, 'html.parser')
                    
                    # Remove script and style elements
                    for script in soup(["script", "style", "nav", "footer", "header"]):
                        script.decompose()
                    
                    # Extract text content
                    text = soup.get_text()
                    text = re.sub(r'\s+', ' ', text).strip()
                    
                    if len(text) > 100:  # Only add substantial content
                        all_content.append({
                            'url': current_url,
                            'text': text,
                            'title': soup.title.string if soup.title else 'No Title'
                        })
                    
                    # Find more links (same domain only)
                    if len(visited_urls) < max_pages:
                        base_domain = urlparse(url).netloc
                        for link in soup.find_all('a', href=True):
                            full_url = urljoin(current_url, link['href'])
                            if urlparse(full_url).netloc == base_domain and full_url not in visited_urls:
                                urls_to_visit.append(full_url)
                
                except Exception as e:
                    print(f"⚠️ Error scraping {current_url}: {str(e)}")
                    continue
            
            # Process all collected content
            total_chunks = 0
            for content in all_content:
                chunks = self.chunk_text(content['text'])
                
                if chunks:
                    embeddings = self.embedder.encode(chunks)
                    
                    # Create unique IDs
                    url_hash = hashlib.md5(content['url'].encode()).hexdigest()[:8]
                    ids = [f"web_{url_hash}_{i}" for i in range(len(chunks))]
                    
                    self.collection.add(
                        documents=chunks,
                        embeddings=embeddings.tolist(),
                        ids=ids,
                        metadatas=[{
                            "source": f"Web: {content['title']}", 
                            "url": content['url'],
                            "type": "website"
                        } for _ in chunks]
                    )
                    total_chunks += len(chunks)
            
            print(f"✅ Added {total_chunks} chunks from {len(all_content)} web pages")
            
        except Exception as e:
            print(f"❌ Error processing website {url}: {str(e)}")
    
    def retrieve_context(self, query, top_k=5):
        """Retrieve relevant context for the query"""
        if self.collection.count() == 0:
            return []
        
        query_embedding = self.embedder.encode([query])
        results = self.collection.query(
            query_embeddings=query_embedding.tolist(),
            n_results=min(top_k, self.collection.count())
        )
        
        contexts = []
        if results['documents']:
            for i, doc in enumerate(results['documents'][0]):
                metadata = results['metadatas'][0][i] if results['metadatas'] else {}
                source = metadata.get('source', 'Unknown source')
                contexts.append(f"[{source}]\n{doc}")
        
        return contexts
    
    def chat(self, user_query):
        """Generate response using RAG with selected AI model"""
        if self.collection.count() == 0:
            return "❌ No knowledge base loaded. Please add PDFs or websites first using /add_pdf or /add_website commands."
        
        # Retrieve relevant context
        context_docs = self.retrieve_context(user_query, top_k=4)
        
        if not context_docs:
            return "❌ No relevant information found in the knowledge base."
        
        context = "\n\n".join(context_docs)
        
        # Create RAG prompt
        prompt = f"""You are a helpful assistant that answers questions based on provided context information.

CONTEXT INFORMATION:
{context}

QUESTION: {user_query}

INSTRUCTIONS:
- Answer the question based ONLY on the provided context
- If the context doesn't contain enough information, clearly state that
- Cite which source(s) you're using in your answer
- Be concise but comprehensive
- If multiple sources have conflicting information, mention this

ANSWER:"""
        
        try:
            if self.ai_provider == 'gemini':
                # Generate response using Gemini REST API directly
                api_key = os.getenv('GEMINI_API_KEY')
                model = os.getenv('GEMINI_MODEL', 'gemini-2.0-flash')
                
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
                
                payload = {
                    "contents": [
                        {
                            "parts": [
                                {
                                    "text": prompt
                                }
                            ]
                        }
                    ],
                    "generationConfig": {
                        "temperature": 0.1,
                        "topP": 0.9,
                        "maxOutputTokens": 500
                    }
                }
                
                headers = {
                    'Content-Type': 'application/json'
                }
                
                response = requests.post(url, json=payload, headers=headers)
                
                if response.status_code == 200:
                    result = response.json()
                    if 'candidates' in result and len(result['candidates']) > 0:
                        content = result['candidates'][0]['content']['parts'][0]['text']
                        return content
                    else:
                        return "❌ No response generated from Gemini"
                else:
                    error_details = response.text
                    return f"❌ Gemini API error ({response.status_code}): {error_details}"
                    
            else:
                # Generate response using Ollama
                response = self.client.chat(
                    model=self.model,
                    messages=[{'role': 'user', 'content': prompt}],
                    options={
                        'temperature': 0.1,
                        'top_p': 0.9,
                        'max_tokens': 500
                    }
                )
                return response['message']['content']
            
        except Exception as e:
            return f"❌ Error generating response: {str(e)}"
    
    def get_stats(self):
        """Get knowledge base statistics"""
        count = self.collection.count()
        if count == 0:
            return "📊 Knowledge base is empty"
        
        # Get sample of metadata to show source types
        sample = self.collection.get(limit=min(count, 100))
        sources = {}
        
        if sample['metadatas']:
            for metadata in sample['metadatas']:
                source_type = metadata.get('type', 'unknown')
                sources[source_type] = sources.get(source_type, 0) + 1
        
        stats = f"📊 Knowledge Base Stats:\n"
        stats += f"  Total chunks: {count}\n"
        for source_type, chunk_count in sources.items():
            stats += f"  {source_type.title()}: {chunk_count} chunks\n"
        
        return stats

def main():
    chatbot = GraniteRAGChatbot()
    
    print("""
🤖 Granite RAG Chatbot
Commands:
  /add_pdf <path>     - Add PDF to knowledge base
  /add_website <url>  - Add website to knowledge base  
  /stats              - Show knowledge base statistics
  /quit               - Exit chatbot
  
Just type your question to chat!
    """)
    
    while True:
        user_input = input("\n💬 You: ").strip()
        
        if user_input.lower() == '/quit':
            print("👋 Goodbye!")
            break
        
        elif user_input.startswith('/add_pdf '):
            pdf_path = user_input[9:].strip()
            if os.path.exists(pdf_path):
                chatbot.add_pdf(pdf_path)
            else:
                print(f"❌ PDF file not found: {pdf_path}")
        
        elif user_input.startswith('/add_website '):
            url = user_input[13:].strip()
            chatbot.add_website(url)
        
        elif user_input == '/stats':
            print(chatbot.get_stats())
        
        elif user_input.startswith('/'):
            print("❌ Unknown command. Use /add_pdf, /add_website, /stats, or /quit")
        
        else:
            if user_input:
                print("\n🤖 Granite:", chatbot.chat(user_input))

if __name__ == "__main__":
    main()