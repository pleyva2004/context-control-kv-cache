#!/bin/bash

# Navigate to script directory
cd "$(dirname "${BASH_SOURCE[0]}")"

# Cleanup on exit
trap 'kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit' SIGINT SIGTERM

# Start backend
(cd backend && bash start_backend.sh) &
BACKEND_PID=$!

# Wait for backend to load model
sleep 5

# Install frontend dependencies if needed
[ ! -d "frontend/node_modules" ] && (cd frontend && npm install)

# Start frontend
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo "Backend: http://localhost:8080"
echo "Frontend: http://localhost:3000"
echo "Press Ctrl+C to stop"

wait
