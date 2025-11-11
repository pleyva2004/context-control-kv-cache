# Context Control KV Cache

R&D Project for KV caching with llama.cpp - A modern chat interface with advanced KV cache management for efficient conversation branching.

## Features

- 🚀 **Fast Inference**: Powered by llama.cpp with KV cache optimization
- 💬 **Real-time Streaming**: Stream responses as they're generated
- 🌳 **Conversation Branching**: Reuse KV cache for efficient follow-up questions
- 🎨 **Modern UI**: Dark-themed Next.js frontend with Tailwind CSS
- 🔄 **Slot Management**: Track and manage KV cache slots
- ⚡ **High Performance**: Optimized for local LLM inference

## Architecture

```
context-control-kv-cache/
├── backend/           # FastAPI backend with llama-cpp-python
│   └── app.py        # Main API server
├── frontend/          # Next.js frontend
│   ├── app/
│   │   ├── components/
│   │   │   ├── ChatInterface.tsx
│   │   │   └── ModelSelector.tsx
│   │   └── utils/
│   │       └── api.ts
│   └── package.json
├── llm/              # LLM models directory
├── start.sh          # Convenience script to start both services
└── requirements.txt  # Python dependencies
```

## Prerequisites

- **Python 3.9+**
- **Node.js 18+**
- **npm or yarn**
- **Metal (macOS) or CUDA (Linux/Windows)** for GPU acceleration (optional)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/context-control-kv-cache.git
cd context-control-kv-cache
```

### 2. Install Backend Dependencies

```bash
pip install -r requirements.txt
```

### 3. Download Model

Place your GGUF model in the `llm/` directory, or use the included download script:

```bash
python downloadModel.py
```

The default model is `Llama-3.2-3B-Instruct-Q4_K_M.gguf`.

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
uvicorn app:app --reload --port 8080
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### 6. Open the Application

Visit [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

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
  "slot_id": 3
}
```

### Conversation Branching
`POST /v1/chat/branch`

Branch from a previous conversation by reusing its KV cache.

**Request:**
```json
{
  "parent_slot_id": 3,
  "branch_mode": "reuse_kv",
  "text_excerpt": "excerpt from previous response",
  "context_window": 20,
  "prompt": "Follow-up question",
  "stream": true
}
```

### Other Endpoints

- `POST /generate` - Generate from a root or continuation message
- `POST /focus` - Focus on a specific text excerpt with follow-up
- `POST /continue` - Continue from a previous message in history

## Configuration

### Backend Configuration

Edit `backend/app.py` to configure the model:

```python
LLM = Llama(
    model_path="../llm/Llama-3.2-3B-Instruct-Q4_K_M.gguf",
    n_ctx=4096,        # Context window size
    n_gpu_layers=32,   # Number of layers to offload to GPU
    verbose=False
)
```

### Frontend Configuration

Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Development

### Backend Development

The backend uses FastAPI with hot reload enabled by default:

```bash
cd backend
uvicorn app:app --reload --port 8080
```

### Frontend Development

The frontend uses Next.js 15 with TypeScript and Tailwind CSS:

```bash
cd frontend
npm run dev
```

### Building for Production

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

## KV Cache Management

The application intelligently manages KV cache slots to optimize inference:

1. **Initial Chat**: Creates a new KV cache slot for the conversation
2. **Branching**: Copies parent slot's KV cache for efficient follow-ups
3. **Slot Tracking**: Each conversation tracks its slot ID for branching

### Branch Modes

- `reuse_kv`: Copy parent's KV cache for context-aware responses
- `fresh`: Start with fresh context (no KV cache reuse)

## Technologies

### Backend
- **FastAPI** - Modern Python web framework
- **llama-cpp-python** - Python bindings for llama.cpp
- **uvicorn** - ASGI server

### Frontend
- **Next.js 15** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework

## Troubleshooting

### Backend Issues

**Model not found:**
```bash
# Ensure model is in the correct path
ls llm/Llama-3.2-3B-Instruct-Q4_K_M.gguf
```

**GPU not detected:**
- macOS: Ensure Metal is available
- Linux/Windows: Install CUDA-enabled llama-cpp-python

### Frontend Issues

**Connection refused:**
- Ensure backend is running on port 8080
- Check CORS settings in backend

**Dependencies issues:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## License

See [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- [llama.cpp](https://github.com/ggerganov/llama.cpp) - Efficient LLM inference
- [llama-cpp-python](https://github.com/abetlen/llama-cpp-python) - Python bindings
- [Next.js](https://nextjs.org/) - React framework
