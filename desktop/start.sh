#!/bin/bash

echo "🚀 Activity Tracker Desktop App - Quick Start"
echo "=============================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
    echo ""
fi

# Check if config exists
if [ ! -f "app-config.json" ]; then
    echo "⚙️  Creating default configuration..."
    cat > app-config.json << EOF
{
  "decryptionKey": "",
  "employeeId": ""
}
EOF
    echo "✅ Configuration file created"
    echo ""
fi

echo "🎯 Starting Activity Tracker Desktop App..."
echo ""
echo "📝 Don't forget to configure your settings on first launch:"
echo "   - Decryption Key (from your ActivityTracker config)"
echo "   - Hostname (your identifier)"
echo ""

npm run electron:dev
