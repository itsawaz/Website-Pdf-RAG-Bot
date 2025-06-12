# PowerShell script to start the Gemini RAG Chatbot
# Run this script from the RAG directory

Write-Host "🚀 Starting Gemini RAG Chatbot..." -ForegroundColor Green

# Check if we're in the right directory
if (!(Test-Path "backend.py")) {
    Write-Host "❌ Error: backend.py not found. Please run this script from the RAG directory." -ForegroundColor Red
    exit 1
}

# Run setup check
Write-Host "🔍 Running setup verification..." -ForegroundColor Yellow
python setup_gemini.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Setup verification failed. Please check the output above." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Setup verification passed!" -ForegroundColor Green

# Start backend server in background
Write-Host "🔧 Starting backend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python backend.py" -WindowStyle Normal

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Check if frontend directory exists
if (Test-Path "frontend") {
    Write-Host "🎨 Starting frontend server..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -WindowStyle Normal
    
    Write-Host "🌐 Frontend will be available at: http://localhost:3000" -ForegroundColor Green
} else {
    Write-Host "⚠️  Frontend directory not found. Only backend server started." -ForegroundColor Yellow
}

Write-Host "📊 Backend API available at: http://localhost:8000" -ForegroundColor Green
Write-Host "📖 API documentation at: http://localhost:8000/docs" -ForegroundColor Green

Write-Host "`n✅ All services started!" -ForegroundColor Green
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")