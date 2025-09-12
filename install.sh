#!/bin/bash

echo "🚀 Installing NLU Chatbot with HuggingFace Integration..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd chatbot-backend
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../chatbot-frontend
npm install

# Create uploads directory
echo "📁 Creating uploads directory..."
cd ../chatbot-backend
mkdir -p uploads

echo "✅ Installation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set up your HuggingFace API key in chatbot-backend/.env"
echo "2. Run backend: cd chatbot-backend && npm run dev"
echo "3. Run frontend: cd chatbot-frontend && npm run dev"
echo "4. Open http://localhost:5173"
echo ""
echo "🎉 Happy coding!"
