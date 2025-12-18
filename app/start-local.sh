#!/bin/bash

# Start Local Development Environment for Rent Calculator

echo "🚀 Starting Rent Calculator App..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start backend server in background
echo "🔧 Starting backend server on port 8000..."
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start React frontend
echo "⚛️  Starting React frontend on port 3000..."
npm start

# Cleanup when script exits
trap "echo '🛑 Stopping servers...'; kill $BACKEND_PID 2>/dev/null" EXIT
