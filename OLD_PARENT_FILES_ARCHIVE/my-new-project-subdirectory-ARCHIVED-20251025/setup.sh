#!/bin/bash
set -e

echo "🚀 Setting up Route Analysis Dashboard..."

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Create Python virtual environment
echo "🐍 Creating Python virtual environment..."
python_cmd="$(command -v python3 || command -v python || true)"
if [ -z "$python_cmd" ]; then
  echo "❌ Python 3 is required but was not found on PATH. Install Python 3.11+ and re-run this script."
  exit 1
fi
"$python_cmd" -m venv venv

# Activate and install Python dependencies (supports POSIX shells and Git Bash on Windows)
echo "📦 Installing Python dependencies..."
if [ -f "venv/bin/activate" ]; then
  # POSIX virtualenv layout
  # shellcheck disable=SC1091
  source venv/bin/activate
elif [ -f "venv/Scripts/activate" ]; then
  # Windows virtualenv layout (forward slashes work in Git Bash)
  # shellcheck disable=SC1091
  source venv/Scripts/activate
else
  echo "❌ Could not find the virtual environment activation script. Remove the venv/ directory and re-run this setup."
  exit 1
fi
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
