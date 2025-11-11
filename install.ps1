# Helix Installation Script for Windows
Write-Host "🚀 Setting up Helix - AI-Powered System Design Autopilot" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Check if .env.local exists
if (-not (Test-Path .env.local)) {
    Write-Host ""
    Write-Host "⚙️  Creating .env.local file..." -ForegroundColor Yellow
    
    $envContent = @"
# Gemini API Key (Required)
# Get your key from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Database (Optional - for persistence)
# DATABASE_URL=postgresql://helix:helix_password@localhost:5432/helix
"@
    
    $envContent | Out-File -FilePath .env.local -Encoding UTF8
    Write-Host "✅ Created .env.local" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Please edit .env.local and add your Gemini API key!" -ForegroundColor Yellow
    Write-Host "   Get your key from: https://makersuite.google.com/app/apikey" -ForegroundColor Yellow
} else {
    Write-Host "✅ .env.local already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "✨ Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env.local and add your GEMINI_API_KEY"
Write-Host "2. Run: npm run dev"
Write-Host "3. Open: http://localhost:3000"
Write-Host ""
Write-Host "For detailed instructions, see SETUP.md"

