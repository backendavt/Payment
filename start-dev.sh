#!/bin/bash

echo "🚀 Starting PayHero Payment Server in Development Mode..."
echo ""
echo "Make sure you have:"
echo "1. Node.js installed"
echo "2. Dependencies installed (run: npm install)"
echo "3. Configuration updated in config.js"
echo ""
echo "Starting server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the development server
npm run dev

