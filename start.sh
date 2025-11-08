#!/bin/bash

echo "Starting llama.cpp application..."
echo "================================"

# Start backend
echo "Starting backend on http://localhost:8080..."
(cd backend && uvicorn app:app --reload --port 8080) &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start frontend
echo "Starting frontend on http://localhost:3000..."
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
