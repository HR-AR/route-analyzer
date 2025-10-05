#!/bin/bash
# Creates a clean distribution package for team members

set -e

echo "📦 Creating distribution package for team..."

# Create distribution directory
DIST_DIR="route-analyzer-distribution"
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# Copy essential files
echo "📋 Copying files..."
cp -r src "$DIST_DIR/"
cp -r scripts "$DIST_DIR/"
cp -r examples "$DIST_DIR/"
cp package.json "$DIST_DIR/"
cp tsconfig.json "$DIST_DIR/"
cp requirements.txt "$DIST_DIR/"
cp setup.sh "$DIST_DIR/"
cp .gitignore "$DIST_DIR/"

# Copy documentation
cp TEAM-README.md "$DIST_DIR/README.md"
cp docs/USAGE.md "$DIST_DIR/" 2>/dev/null || echo "No USAGE.md found"

# Create a simple start script
cat > "$DIST_DIR/analyze.sh" <<'EOF'
#!/bin/bash
# Simple wrapper for team members

if [ $# -eq 0 ]; then
    echo "Usage: ./analyze.sh path/to/data.csv"
    echo ""
    echo "Examples:"
    echo "  ./analyze.sh ~/Downloads/weekly-data.csv"
    echo "  ./analyze.sh data.csv"
    exit 1
fi

echo "🔍 Running route analysis..."
npm run time-breakdown -- "$1"
EOF

chmod +x "$DIST_DIR/analyze.sh"

# Create archive
echo "🗜️  Creating archive..."
tar -czf route-analyzer-dist.tar.gz "$DIST_DIR"

# Create zip for Windows users
if command -v zip &> /dev/null; then
    zip -r route-analyzer-dist.zip "$DIST_DIR" > /dev/null
    echo "✅ Created: route-analyzer-dist.zip"
fi

echo "✅ Created: route-analyzer-dist.tar.gz"
echo ""
echo "📧 Share with your team:"
echo "   - route-analyzer-dist.tar.gz (Mac/Linux)"
echo "   - route-analyzer-dist.zip (Windows)"
echo ""
echo "📝 Instructions for recipients:"
echo "   1. Extract the archive"
echo "   2. cd route-analyzer-distribution"
echo "   3. ./setup.sh"
echo "   4. ./analyze.sh your-data.csv"
echo ""
