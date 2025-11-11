#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "Starting llama.cpp application..."
echo "================================"

# Trap to ensure cleanup on exit
cleanup() {
    echo ""
    echo "Stopping services..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "Starting backend on http://localhost:8080..."
(cd backend && bash start_backend.sh) &
BACKEND_PID=$!

# Wait a moment for backend to start
echo "Waiting for backend to initialize..."
sleep 3

# Start frontend
echo "Starting frontend on http://localhost:3000..."
if [ ! -d "frontend/node_modules" ]; then
    echo "First time setup: Installing frontend dependencies..."
    (cd frontend && npm install)
fi
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "================================"
echo "Backend running at: http://localhost:8080"
echo "Frontend running at: http://localhost:3000"
echo "================================"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for both processes
wait
