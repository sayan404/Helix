#!/bin/bash

# Helix Installation Script
echo "🚀 Setting up Helix - AI-Powered System Design Autopilot"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo ""
    echo "⚙️  Creating .env.local file..."
    cat > .env.local << EOF
# Gemini API Key (Required)
# Get your key from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Database (Optional - for persistence)
# DATABASE_URL=postgresql://helix:helix_password@localhost:5432/helix
EOF
    echo "✅ Created .env.local"
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env.local and add your Gemini API key!"
    echo "   Get your key from: https://makersuite.google.com/app/apikey"
else
    echo "✅ .env.local already exists"
fi

echo ""
echo "✨ Installation complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.local and add your GEMINI_API_KEY"
echo "2. Run: npm run dev"
echo "3. Open: http://localhost:3000"
echo ""
echo "For detailed instructions, see SETUP.md"

