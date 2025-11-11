#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if build directory exists
if [ ! -d "build" ]; then
    echo "Build directory not found. Building backend..."
    mkdir -p build
    cd build
    cmake ..
    make -j8
    cd ..
    echo "Build completed!"
else
    # Check if we need to rebuild
    if [ ! -f "build/bin/llama-server" ]; then
        echo "llama-server binary not found. Rebuilding..."
        cd build
        make -j8
        cd ..
        echo "Build completed!"
    fi
fi

# Check if the llama-server binary exists
if [ ! -f "build/bin/llama-server" ]; then
    echo "Error: llama-server binary not found after build!"
    echo "Try running: cd build && make -j8"
    exit 1
fi

# Get the project root directory (one level up from backend)
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
MODEL_PATH="$PROJECT_ROOT/llm/Llama-3.2-3B-Instruct-Q4_K_M.gguf"

# Check if model exists
if [ ! -f "$MODEL_PATH" ]; then
    echo "Error: Model not found at $MODEL_PATH"
    echo "Please download the model first."
    exit 1
fi

echo "Starting llama-server..."
echo "Model: $MODEL_PATH"
echo "Port: 8080"
echo ""

./build/bin/llama-server \
    -m "$MODEL_PATH" \
    --port 8080 \
    -ngl 99
