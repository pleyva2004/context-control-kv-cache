# Context Control KV Cache

R&D Project for KV caching with llama.cpp - A modern chat interface with advanced KV cache management for efficient conversation branching.

## Features

- **Fast Inference**: Powered by native llama.cpp C++ implementation
- **Real-time Streaming**: Stream responses as they're generated
- **Conversation Branching**: Reuse KV cache for efficient follow-up questions
- **Modern UI**: Dark-themed Next.js frontend with Tailwind CSS
- **Slot Management**: Track and manage KV cache slots
- **High Performance**: Optimized for local LLM inference with GPU acceleration

## Architecture

```
context-control-kv-cache/
├── backend/              # Native llama.cpp C++ server
│   ├── src/             # llama.cpp source code
│   ├── tools/server/    # Built-in web server & UI
│   ├── CMakeLists.txt   # Build configuration
│   ├── build/           # Compiled binaries (generated)
│   └── start_backend.sh # Backend startup script
├── frontend/            # Next.js frontend
│   ├── app/
│   │   ├── components/
│   │   │   ├── ChatInterface.tsx
│   │   │   └── ModelSelector.tsx
│   │   └── utils/
│   │       └── api.ts
│   └── package.json
├── llm/                 # LLM models directory
├── start.sh             # Convenience script to start both services
└── downloadModel.py     # Model download utility
```

## Prerequisites

- **C++ Compiler**: Clang (macOS) or GCC/MSVC (Linux/Windows)
- **CMake 3.14+**: For building the C++ backend
- **Node.js 18+**: For the frontend
- **npm or yarn**: JavaScript package manager
- **Metal (macOS) or CUDA (Linux/Windows)**: For GPU acceleration (optional but recommended)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/context-control-kv-cache.git
cd context-control-kv-cache
```

### 2. Download Model

Place your GGUF model in the `llm/` directory, or use the included download script:

```bash
python downloadModel.py
```

The default model is `Llama-3.2-3B-Instruct-Q4_K_M.gguf`.

### 3. Build the Backend

The backend is built from the native llama.cpp C++ source:

```bash
cd backend
mkdir -p build
cd build
cmake ..
make -j8
cd ../..
```

This will compile the `llama-server` binary in `backend/build/bin/`.

### 4. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

### 5. Start the Application

Use the convenience script to start both backend and frontend:

```bash
chmod +x start.sh
./start.sh
```

Or start them separately:

**Backend:**
```bash
cd backend
./start_backend.sh
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### 6. Open the Application

Visit [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

The llama-server provides OpenAI-compatible endpoints:

### Chat Completions
`POST /v1/chat/completions`

Standard OpenAI-compatible chat completion endpoint with streaming support.

**Request:**
```json
{
  "messages": [
    {"role": "user", "content": "Hello!"}
  ],
  "stream": true
}
```

**Response:** Server-Sent Events (SSE) stream with chunks containing:
```json
{
  "choices": [{"delta": {"content": "Hello!"}}],
  "slot_id": 0
}
```

### Completions
`POST /completion`

Direct completion endpoint for text generation.

### Other Endpoints

- `GET /health` - Server health check
- `GET /props` - Get server properties
- `GET /slots` - View KV cache slot status
- `POST /tokenize` - Tokenize text
- `POST /detokenize` - Detokenize tokens
- `POST /embedding` - Generate embeddings

For full API documentation, visit the [llama.cpp server documentation](https://github.com/ggerganov/llama.cpp/tree/master/examples/server).

## Configuration

### Backend Configuration

The backend is configured via command-line arguments in `backend/start_backend.sh`:

```bash
./build/bin/llama-server \
    -m "$MODEL_PATH" \
    --port 8080 \
    -ngl 99              # GPU layers (99 = auto-detect)
```

Common options:
- `-m`: Path to model file
- `--port`: Server port (default: 8080)
- `-ngl`: Number of GPU layers to offload
- `-c`: Context size (default: 2048)
- `-np`: Number of parallel sequences
- `--host`: Host address (default: 127.0.0.1)

For full configuration options, run:
```bash
./backend/build/bin/llama-server --help
```

### Frontend Configuration

Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Development

### Backend Development

After making changes to the C++ source:

```bash
cd backend/build
make -j8
cd ..
./start_backend.sh
```

For faster iteration, the `start_backend.sh` script automatically rebuilds if needed.

### Frontend Development

The frontend uses Next.js 15 with TypeScript and Tailwind CSS:

```bash
cd frontend
npm run dev
```

Hot reload is enabled by default for rapid development.

### Building for Production

**Backend:**
```bash
cd backend/build
cmake .. -DCMAKE_BUILD_TYPE=Release
make -j8
```

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

## KV Cache Management

The llama-server intelligently manages KV cache slots to optimize inference:

1. **Slot Allocation**: Automatic allocation of KV cache slots for parallel requests
2. **Cache Reuse**: Efficient cache management for multi-turn conversations
3. **Slot Monitoring**: Real-time slot status via `/slots` endpoint

You can monitor active slots and their status:

```bash
curl http://localhost:8080/slots
```

## Technologies

### Backend
- **llama.cpp** - Efficient C++ LLM inference engine
- **CMake** - Build system
- **Metal/CUDA** - GPU acceleration backends

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework

## Troubleshooting

### Backend Issues

**Build fails:**
```bash
# Ensure CMake is installed
cmake --version

# Clean build directory
cd backend
rm -rf build
mkdir build
cd build
cmake ..
make -j8
```

**Model not found:**
```bash
# Ensure model is in the correct path
ls llm/Llama-3.2-3B-Instruct-Q4_K_M.gguf

# Check path in start_backend.sh
cat backend/start_backend.sh
```

**GPU not detected:**
- **macOS**: Metal should be auto-detected. Ensure you're on macOS 13+
- **Linux**: Install CUDA toolkit and rebuild with `cmake .. -DGGML_CUDA=ON`
- **Windows**: Install CUDA toolkit and use appropriate CMake flags

**Server won't start:**
```bash
# Check if port 8080 is in use
lsof -i :8080

# Kill existing process
kill -9 $(lsof -t -i:8080)
```

### Frontend Issues

**Connection refused:**
- Ensure backend is running on port 8080
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Verify CORS is enabled in llama-server

**Dependencies issues:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Build errors:**
```bash
# Clear Next.js cache
cd frontend
rm -rf .next
npm run build
```

## License

See [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- [llama.cpp](https://github.com/ggerganov/llama.cpp) - Efficient C++ LLM inference engine
- [Next.js](https://nextjs.org/) - React framework for the web
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
