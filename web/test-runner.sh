#!/bin/bash

# Simple test runner for DiploSense
echo "🧪 DiploSense Test Runner"
echo "========================"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check test setup
echo "⚙️ Checking test setup..."
echo "✅ Jest config: $([ -f jest.config.js ] && echo "✓" || echo "✗")"
echo "✅ Jest setup: $([ -f jest.setup.js ] && echo "✓" || echo "✗")"
echo "✅ Test utils: $([ -f src/test-utils/testUtils.tsx ] && echo "✓" || echo "✗")"
echo "✅ Mock data: $([ -f src/test-utils/mockData.ts ] && echo "✓" || echo "✗")"

# List available tests
echo ""
echo "📋 Available test files:"
find src -name "*.test.tsx" -o -name "*.test.ts" | sed 's/^/  - /'
find __tests__ -name "*.test.ts" 2>/dev/null | sed 's/^/  - /'

# Run specific test based on argument
case "$1" in
    "dashboard")
        echo ""
        echo "🎯 Running Dashboard tests..."
        npm test -- --testPathPattern="Dashboard.test.tsx" --verbose
        ;;
    "upload")
        echo ""
        echo "🎯 Running UploadPanel tests..."
        npm test -- --testPathPattern="UploadPanel.test.tsx" --verbose
        ;;
    "page")
        echo ""
        echo "🎯 Running Page tests..."
        npm test -- --testPathPattern="page.test.tsx" --verbose
        ;;
    "api")
        echo ""
        echo "🎯 Running API integration tests..."
        npm test -- --testPathPattern="api-integration.test.ts" --verbose
        ;;
    "coverage")
        echo ""
        echo "📊 Running all tests with coverage..."
        npm run test:coverage
        ;;
    "watch")
        echo ""
        echo "👀 Starting watch mode..."
        npm run test:watch
        ;;
    *)
        echo ""
        echo "🚀 Usage examples:"
        echo "  ./test-runner.sh dashboard  # Test Dashboard component"
        echo "  ./test-runner.sh upload     # Test UploadPanel component"
        echo "  ./test-runner.sh page       # Test main page"
        echo "  ./test-runner.sh api        # Test API integration"
        echo "  ./test-runner.sh coverage   # Run with coverage"
        echo "  ./test-runner.sh watch      # Run in watch mode"
        echo ""
        echo "🧪 Running all tests..."
        npm test
        ;;
esac