from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import asyncio
import tempfile
import os
from typing import List, Dict, Any, Iterator
import uvicorn
import json
from dotenv import load_dotenv
from main import GraniteRAGChatbot

# Load environment variables
load_dotenv()

app = FastAPI(title="RAG Chatbot API")

# Get configuration from environment
frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
backend_host = os.getenv('BACKEND_HOST', '0.0.0.0')
backend_port = int(os.getenv('BACKEND_PORT', 8000))

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global chatbot instance
chatbot = None

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    status: str = "success"

class WebsiteRequest(BaseModel):
    url: str
    max_pages: int = 5

class StatusResponse(BaseModel):
    message: str
    status: str

@app.on_event("startup")
async def startup_event():
    global chatbot
    try:
        chatbot = GraniteRAGChatbot()
        print(f"✅ Chatbot initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize chatbot: {str(e)}")
        raise

@app.get("/")
async def root():
    ai_provider = os.getenv('AI_PROVIDER', 'ollama')
    model_name = os.getenv('GEMINI_MODEL' if ai_provider == 'gemini' else 'OLLAMA_MODEL', 'unknown')
    return {
        "message": "RAG Chatbot API is running",
        "ai_provider": ai_provider,
        "model": model_name,
        "status": "healthy"
    }

@app.get("/model-info")
async def get_model_info():
    """Get information about the current AI model"""
    if not chatbot:
        raise HTTPException(status_code=500, detail="Chatbot not initialized")
    
    return {
        "ai_provider": chatbot.ai_provider,
        "model": chatbot.model,
        "embedding_model": "all-MiniLM-L6-v2",
        "database_documents": chatbot.collection.count()
    }

@app.post("/chat", response_model=ChatResponse)
async def chat_with_bot(request: ChatRequest):
    try:
        if not chatbot:
            raise HTTPException(status_code=500, detail="Chatbot not initialized")
        
        response = chatbot.chat(request.message)
        return ChatResponse(response=response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat/stream")
async def chat_with_bot_stream(request: ChatRequest):
    try:
        if not chatbot:
            raise HTTPException(status_code=500, detail="Chatbot not initialized")
        
        def generate_stream() -> Iterator[str]:
            try:
                # Retrieve relevant context
                if chatbot.collection.count() == 0:
                    yield f"data: {json.dumps({'error': 'No knowledge base loaded'})}\n\n"
                    return
                
                context_docs = chatbot.retrieve_context(request.message, top_k=4)
                
                if not context_docs:
                    yield f"data: {json.dumps({'error': 'No relevant information found'})}\n\n"
                    return
                
                context = "\n\n".join(context_docs)
                
                # Create RAG prompt
                prompt = f"""You are a helpful assistant that answers questions based on provided context information.

CONTEXT INFORMATION:
{context}

QUESTION: {request.message}

INSTRUCTIONS:
- Answer the question based ONLY on the provided context
- If the context doesn't contain enough information, clearly state that
- Cite which source(s) you're using in your answer
- Be concise but comprehensive
- If multiple sources have conflicting information, mention this

ANSWER:"""
                
                # Stream response from Granite
                response = chatbot.client.chat(
                    model=chatbot.model,
                    messages=[{'role': 'user', 'content': prompt}],
                    options={
                        'temperature': 0.1,
                        'top_p': 0.9,
                        'max_tokens': 500
                    },
                    stream=True
                )
                
                for chunk in response:
                    if chunk['message']['content']:
                        data = {
                            'content': chunk['message']['content'],
                            'done': chunk.get('done', False)
                        }
                        yield f"data: {json.dumps(data)}\n\n"
                
                # Send completion signal
                yield f"data: {json.dumps({'done': True})}\n\n"
                
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
        
        return StreamingResponse(
            generate_stream(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream",
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload-pdf", response_model=StatusResponse)
async def upload_pdf(file: UploadFile = File(...)):
    try:
        if not chatbot:
            raise HTTPException(status_code=500, detail="Chatbot not initialized")
        
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        try:
            # Process the PDF
            chatbot.add_pdf(tmp_file_path)
            return StatusResponse(
                message=f"Successfully processed PDF: {file.filename}",
                status="success"
            )
        finally:
            # Clean up temporary file
            os.unlink(tmp_file_path)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/add-website", response_model=StatusResponse)
async def add_website(request: WebsiteRequest):
    try:
        if not chatbot:
            raise HTTPException(status_code=500, detail="Chatbot not initialized")
        
        chatbot.add_website(request.url, request.max_pages)
        return StatusResponse(
            message=f"Successfully processed website: {request.url}",
            status="success"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stats")
async def get_stats():
    try:
        if not chatbot:
            raise HTTPException(status_code=500, detail="Chatbot not initialized")
        
        stats = chatbot.get_stats()
        
        # Parse stats for better frontend display
        count = chatbot.collection.count()
        sample = chatbot.collection.get(limit=min(count, 100)) if count > 0 else {"metadatas": []}
        sources = {}
        
        if sample['metadatas']:
            for metadata in sample['metadatas']:
                source_type = metadata.get('type', 'unknown')
                sources[source_type] = sources.get(source_type, 0) + 1
        
        return {
            "total_chunks": count,
            "sources": sources,
            "raw_stats": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/clear-knowledge-base", response_model=StatusResponse)
async def clear_knowledge_base():
    try:
        if not chatbot:
            raise HTTPException(status_code=500, detail="Chatbot not initialized")
        
        # Clear the collection
        chatbot.collection.delete()
        
        # Recreate the collection
        chatbot.collection = chatbot.chroma_client.create_collection(chatbot.collection_name)
        
        return StatusResponse(
            message="Knowledge base cleared successfully",
            status="success"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/delete-by-source", response_model=StatusResponse)
async def delete_by_source(source_type: str):
    try:
        if not chatbot:
            raise HTTPException(status_code=500, detail="Chatbot not initialized")
        
        # Get all documents with metadata
        all_docs = chatbot.collection.get()
        
        if not all_docs['metadatas']:
            return StatusResponse(
                message="No documents found in knowledge base",
                status="success"
            )
        
        # Find IDs to delete based on source type
        ids_to_delete = []
        for i, metadata in enumerate(all_docs['metadatas']):
            if metadata.get('type', '').lower() == source_type.lower():
                ids_to_delete.append(all_docs['ids'][i])
        
        if ids_to_delete:
            chatbot.collection.delete(ids=ids_to_delete)
            return StatusResponse(
                message=f"Deleted {len(ids_to_delete)} documents of type {source_type}",
                status="success"
            )
        else:
            return StatusResponse(
                message=f"No documents found of type {source_type}",
                status="success"
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "chatbot_ready": chatbot is not None}

@app.get("/documents")
async def list_documents():
    try:
        if not chatbot:
            raise HTTPException(status_code=500, detail="Chatbot not initialized")
        
        # Get all documents with metadata
        all_docs = chatbot.collection.get()
        
        documents = []
        if all_docs['metadatas']:
            for i, metadata in enumerate(all_docs['metadatas']):
                doc_id = all_docs['ids'][i]
                content_preview = all_docs['documents'][i][:200] + "..." if len(all_docs['documents'][i]) > 200 else all_docs['documents'][i]
                
                documents.append({
                    "id": doc_id,
                    "source": metadata.get('source', 'Unknown'),
                    "type": metadata.get('type', 'unknown'),
                    "content_preview": content_preview,
                    "chunk_index": metadata.get('chunk_index', 0),
                    "metadata": metadata
                })
        
        # Group by source for better organization
        grouped_docs = {}
        for doc in documents:
            source = doc['source']
            if source not in grouped_docs:
                grouped_docs[source] = []
            grouped_docs[source].append(doc)
        
        return {
            "documents": documents,
            "grouped_documents": grouped_docs,
            "total_count": len(documents)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/documents/{document_id}", response_model=StatusResponse)
async def delete_document(document_id: str):
    try:
        if not chatbot:
            raise HTTPException(status_code=500, detail="Chatbot not initialized")
        
        # Check if document exists
        try:
            existing = chatbot.collection.get(ids=[document_id])
            if not existing['ids']:
                raise HTTPException(status_code=404, detail="Document not found")
        except:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Delete the specific document
        chatbot.collection.delete(ids=[document_id])
        
        return StatusResponse(
            message=f"Document {document_id} deleted successfully",
            status="success"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/documents/batch", response_model=StatusResponse)
async def delete_documents_batch(document_ids: list[str]):
    try:
        if not chatbot:
            raise HTTPException(status_code=500, detail="Chatbot not initialized")
        
        if not document_ids:
            raise HTTPException(status_code=400, detail="No document IDs provided")
        
        # Check which documents exist
        existing = chatbot.collection.get(ids=document_ids)
        existing_ids = existing['ids']
        
        if existing_ids:
            chatbot.collection.delete(ids=existing_ids)
            return StatusResponse(
                message=f"Deleted {len(existing_ids)} documents successfully",
                status="success"
            )
        else:
            return StatusResponse(
                message="No documents found to delete",
                status="success"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("backend:app", host=backend_host, port=backend_port, reload=True)
