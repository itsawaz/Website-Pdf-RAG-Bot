# Gemini RAG Chatbot

A beautiful, modern RAG (Retrieval-Augmented Generation) chatbot powered by Google's Gemini/Gemma models with Aceternity UI.

## Features

✨ **Modern Dark UI** - Beautiful Aceternity UI components with animations  
🤖 **Google Gemini/Gemma** - Powered by Google's latest AI models  
🔄 **Flexible AI Backend** - Switch between Gemini API and local Ollama models  
📄 **PDF Support** - Upload and process PDF documents  
🌐 **Website Scraping** - Add websites as knowledge sources  
💾 **Persistent Storage** - ChromaDB for vector storage  
� **Smart Filtering** - Similarity-based filtering prevents irrelevant responses  
🔍 **Debug Mode** - Optional similarity score debugging  
�🎨 **Responsive Design** - Works on desktop and mobile  
⚡ **Real-time Chat** - Fast responses with typing indicators  

## AI Model Options

### Option 1: Google Gemini API (Recommended - Free)
- **Gemini 1.5 Flash** - Fast, efficient, free tier available
- **Gemini 1.5 Pro** - More capable, still free within limits
- **Gemma Models** - Open source models via Gemini API

### Option 2: Local Ollama Models
- **Granite 3.3B** - Local IBM model
- **Qwen, Llama, etc.** - Any Ollama-compatible model

## Prerequisites

- **Python 3.8+**
- **Node.js 16+**
- **Google AI Studio API Key** (free at https://makersuite.google.com/app/apikey)
- **OR Ollama** with models installed (optional)

### Get Gemini API Key (Free)

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the API key for configuration

### Optional: Install Ollama (for local models)

```bash
# Install Ollama (visit https://ollama.ai for instructions)
# Then pull models:
ollama pull granite3.3:8b
ollama pull qwen3:0.6b
```

## Quick Start

### Option 1: Automatic Setup (Windows with Gemini)

1. **Configure Environment**
```bash
# Copy the example environment file
copy .env.example .env

# Edit .env file and add your Gemini API key:
# AI_PROVIDER=gemini
# GEMINI_API_KEY=your_api_key_here
# GEMINI_MODEL=gemini-1.5-flash
```

2. **Run Setup and Start**
```powershell
# Run the setup verification
python setup_gemini.py

# Start all services
.\start_gemini.ps1
```

### Option 2: Manual Setup

1. **Configure Environment**
```bash
# Copy and edit environment file
copy .env.example .env
# Edit .env with your preferred settings
```

2. **Install Dependencies**
```bash
pip install -r requirements.txt
cd frontend
npm install
```

3. **Start Services**
```bash
# Terminal 1: Backend
python backend.py

# Terminal 2: Frontend
cd frontend
npm run dev
```

## Usage

1. Open http://localhost:3000 in your browser
2. Upload PDF files by dragging and dropping
3. Add websites by clicking the globe icon
4. Start asking questions about your content!

## API Endpoints

- `POST /chat` - Send chat messages
- `POST /upload-pdf` - Upload PDF files
- `POST /add-website` - Add website content
- `GET /stats` - Get knowledge base statistics
- `GET /health` - Health check

## Project Structure

```
RAG/
├── backend.py          # FastAPI backend server
├── main.py            # Original CLI chatbot
├── requirements.txt   # Python dependencies
├── start.bat         # Windows startup script
├── chroma_db/        # Vector database storage
└── frontend/         # Next.js frontend
    ├── app/          # Next.js app directory
    ├── components/   # React components
    └── lib/          # Utilities and API client
```

## Technologies Used

### Backend
- **FastAPI** - Modern Python web framework
- **Google Generative AI** - Gemini/Gemma API client
- **Ollama** - Local LLM inference (optional)
- **ChromaDB** - Vector database
- **Sentence Transformers** - Text embeddings
- **BeautifulSoup** - Web scraping

### Frontend  
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Aceternity UI** - Modern components
- **React Markdown** - Markdown rendering

## Configuration

Edit the `.env` file to configure your AI provider:

### For Gemini API (Recommended)
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash  # or gemini-1.5-pro, gemma-2-27b-it
```

### For Local Ollama
```env
AI_PROVIDER=ollama
OLLAMA_MODEL=granite3.3:8b  # or qwen3:0.6b, llama3:8b, etc.
```

### Other Settings
```env
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
FRONTEND_URL=http://localhost:3000
CHUNK_SIZE=500
CHUNK_OVERLAP=50

# Similarity Filtering (Advanced)
SIMILARITY_THRESHOLD=0.3  # Range 0.0-1.0, lower = more strict filtering
DEBUG_SIMILARITY=false   # Set to 'true' to see similarity scores in logs
```

## Smart Response Filtering

The chatbot now includes intelligent similarity-based filtering to prevent irrelevant or hallucinated responses:

🎯 **How it works:**
- When you ask a question, the system calculates similarity scores between your query and all documents
- Only documents above the similarity threshold (default 0.3) are used to generate responses
- If no documents meet the threshold, the system responds with "No related information found" instead of guessing

🔧 **Configuration:**
- `SIMILARITY_THRESHOLD`: Adjust from 0.0 (very permissive) to 1.0 (very strict)
  - 0.3 (default): Balanced filtering
  - 0.2: More permissive, includes marginally relevant content
  - 0.5: Stricter, only highly relevant content
- `DEBUG_SIMILARITY=true`: See similarity scores in backend logs for tuning

🧪 **Testing:** Run `python test_similarity_filtering.py` to test the filtering with sample queries.

## Troubleshooting

**Setup verification failing?**
- Run `python setup_gemini.py` to diagnose issues
- Check if all dependencies are installed: `pip install -r requirements.txt`

**Gemini API errors?**
- Verify your API key in `.env` file
- Check if you have free quota remaining at [Google AI Studio](https://makersuite.google.com/)
- Try switching to `gemini-1.5-flash` for better rate limits

**Backend not starting?**
- Check if the configured AI provider is available
- For Ollama: Make sure Ollama is running and model is installed
- Check if port 8000 is available

**Frontend not connecting?**
- Ensure backend is running on port 8000
- Check browser console for CORS errors
- Verify `FRONTEND_URL` in `.env` matches your frontend URL

## License

MIT License - feel free to use this project for your own purposes!
