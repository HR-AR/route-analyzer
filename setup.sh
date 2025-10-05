#!/bin/bash
set -e

echo "🚀 Setting up Route Analysis Dashboard..."

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Create Python virtual environment
echo "🐍 Creating Python virtual environment..."
python3 -m venv venv

# Activate and install Python dependencies
echo "📦 Installing Python dependencies..."
source venv/bin/activate
pip install -r requirements.txt --quiet

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

echo "✅ Setup complete!"
echo ""
echo "To use the tool:"
echo "  npm start -- path/to/your/data.csv"
echo ""
echo "Example:"
echo "  npm start -- ../data_table_1.csv"
