# Context Control KV Cache

R&D Project for KV caching with llama.cpp - A modern chat interface with advanced KV cache management for efficient conversation branching.

## Features

- **Fast Inference**: Powered by native llama.cpp C++ implementation
- **Real-time Streaming**: Stream responses as they're generated
- **Advanced KV Cache Branching**: Create conversation branches with intelligent KV cache reuse
- **Graph-Based Conversations**: Node-based architecture with interactive tree visualization
- **Smart Context Management**: Two branching modes for optimal context control
  - **Reuse KV**: Copy parent's KV cache for efficient context inheritance
- **Visual Graph Interface**: Interactive pan/zoom graph view with animated branching
- **Slot Management**: Per-node KV cache slot tracking and management
- **Modern UI**: Dark-themed Next.js frontend with Tailwind CSS and smooth animations
- **High Performance**: Optimized for local LLM inference with GPU acceleration

## Architecture

```
context-control-kv-cache/
├── backend/              # Native llama.cpp C++ server
│   ├── src/             # llama.cpp source code
│   │   ├── llama-kv-cache.cpp      # KV cache implementation
│   │   ├── llama-kv-cache-iswa.cpp # Sliding window attention
│   │   └── llama-context.cpp       # Context management
│   ├── tools/server/    # Built-in web server & UI
│   ├── CMakeLists.txt   # Build configuration
│   ├── build/           # Compiled binaries (generated)
│   └── start_backend.sh # Backend startup script
├── frontend/            # Next.js frontend with graph-based architecture
│   ├── app/
│   │   ├── components/
│   │   │   ├── ChatInterface.tsx   # Main orchestrator
│   │   │   ├── FocusedView.tsx     # Traditional chat UI
│   │   │   ├── GraphView.tsx       # Interactive graph visualization
│   │   │   ├── ChatNode.tsx        # Graph node component
│   │   │   └── ModelSelector.tsx   # Model/context selector
│   │   ├── hooks/
│   │   │   ├── useGraphState.ts        # Graph state & layout
│   │   │   ├── useBranchAnimation.ts   # 5-stage animations
│   │   │   └── useTextSelection.ts     # Selection handling
│   │   ├── types/
│   │   │   └── graph.ts            # Graph data structures
│   │   └── utils/
│   │       ├── api.ts              # API client (includes streamBranch)
│   │       └── graphLayout.ts      # Reingold-Tilford algorithm
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

This guide will walk you through setting up the application from scratch. Expected setup time: **15-30 minutes** (depending on your machine and internet speed).

### 1. Install Prerequisites

Before starting, ensure you have the required tools installed:

<details>
<summary><b>macOS</b></summary>

```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install required tools
brew install cmake node python3

# Verify installations
cmake --version    # Should be 3.14 or higher
node --version     # Should be 18 or higher
python3 --version  # Should be 3.7 or higher
```

Xcode Command Line Tools (for C++ compiler):
```bash
xcode-select --install
```

</details>

<details>
<summary><b>Linux (Ubuntu/Debian)</b></summary>

```bash
# Update package list
sudo apt update

# Install required tools
sudo apt install -y build-essential cmake curl
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs python3 python3-pip

# Verify installations
cmake --version    # Should be 3.14 or higher
node --version     # Should be 18 or higher
python3 --version  # Should be 3.7 or higher
gcc --version      # Should show GCC compiler info
```

**Optional - CUDA for NVIDIA GPU acceleration:**
```bash
# Install CUDA toolkit (if you have an NVIDIA GPU)
# Visit: https://developer.nvidia.com/cuda-downloads
```

</details>

<details>
<summary><b>Windows</b></summary>

1. **Install Visual Studio 2022 Community Edition**
   - Download from: https://visualstudio.microsoft.com/
   - Select "Desktop development with C++"

2. **Install CMake**
   - Download from: https://cmake.org/download/
   - Add to PATH during installation

3. **Install Node.js**
   - Download LTS version from: https://nodejs.org/
   - Version 18 or higher

4. **Install Python**
   - Download from: https://www.python.org/downloads/
   - Check "Add Python to PATH" during installation

5. **Verify installations** (in PowerShell):
```powershell
cmake --version
node --version
python --version
```

</details>

### 2. Clone the Repository

```bash
git clone https://github.com/yourusername/context-control-kv-cache.git
cd context-control-kv-cache
```

**✓ Verify:** You should now be in the project root directory.

```bash
ls -la
# Should show: backend/, frontend/, llm/, README.md, etc.
```

### 3. Download a Language Model

You need a GGUF-format language model. We recommend starting with Llama 3.2 3B (Q4 quantization) for good performance and modest hardware requirements.

**Option A: Using the download script (Recommended)**

```bash
# Create the llm directory if it doesn't exist
mkdir -p llm

# Run the download script
python3 downloadModel.py
```

The script will download `Llama-3.2-3B-Instruct-Q4_K_M.gguf` (~2.0 GB) to the `llm/` directory.

**✓ Verify download:**
```bash
ls -lh llm/
# Should show: Llama-3.2-3B-Instruct-Q4_K_M.gguf (~2.0 GB)
```

**Option B: Manual download**

Visit [Hugging Face](https://huggingface.co/models?search=gguf) and download any GGUF model you prefer, then:

```bash
# Place it in the llm/ directory
mv /path/to/your/model.gguf llm/
```

**Note:** If you use a different model, update the `MODEL_PATH` in `backend/start_backend.sh`.

### 4. Build the Backend

The backend compiles llama.cpp from source with optimizations for your hardware.

```bash
cd backend
mkdir -p build
cd build
```

**Run CMake configuration:**

<details>
<summary><b>macOS (Metal GPU acceleration)</b></summary>

```bash
cmake .. -DGGML_METAL=ON
```

This enables Metal acceleration for Apple Silicon and Intel Macs.

</details>

<details>
<summary><b>Linux (CPU only)</b></summary>

```bash
cmake ..
```

</details>

<details>
<summary><b>Linux (with NVIDIA CUDA)</b></summary>

```bash
cmake .. -DGGML_CUDA=ON
```

</details>

<details>
<summary><b>Windows (Visual Studio)</b></summary>

```bash
cmake .. -G "Visual Studio 17 2022" -A x64
```

</details>

**Compile the backend:**

```bash
# Linux/macOS
make -j8

# Windows (PowerShell)
cmake --build . --config Release
```

This will take **5-15 minutes** depending on your system. You'll see compilation progress for hundreds of files.

**✓ Verify build:**

```bash
# Check if llama-server binary was created
ls bin/llama-server

# Test the server
./bin/llama-server --version
```

**Expected output:** Should display version information and build details.

```bash
# Return to project root
cd ../..
```

**Troubleshooting:**
- **"CMake not found"**: Install CMake (see Prerequisites)
- **"No C++ compiler found"**: Install build tools (see Prerequisites)
- **"Metal not found"**: Update to macOS 13+ or disable Metal with `cmake ..`
- **Build errors**: Try cleaning the build directory: `rm -rf backend/build && mkdir backend/build`

### 5. Install Frontend Dependencies

```bash
cd frontend
npm install
```

This will install all Node.js dependencies (~2-5 minutes).

**✓ Verify installation:**

```bash
npm list --depth=0
# Should show: next, react, tailwindcss, typescript, etc.
```

```bash
# Return to project root
cd ..
```

**Troubleshooting:**
- **"npm not found"**: Install Node.js (see Prerequisites)
- **"Permission denied"**: Don't use `sudo`. If needed, fix npm permissions
- **"ERESOLVE" errors**: Try `npm install --legacy-peer-deps`

### 6. Start the Application

You have two options to start the application:

**Option A: Start everything with one command (Recommended)**

```bash
chmod +x start.sh
./start.sh
```

This script will:
1. Start the backend server on port 8080
2. Start the frontend development server on port 3000
3. Run both in the background

**Option B: Start backend and frontend separately (for debugging)**

**Terminal 1 - Backend:**
```bash
cd backend
chmod +x start_backend.sh
./start_backend.sh
```

**Expected output:**
```
Loading model from ../llm/Llama-3.2-3B-Instruct-Q4_K_M.gguf
llama_model_loader: loaded meta data with 21 key-value pairs
llama_model_loader: - kv   0: general.architecture str = llama
...
llm_load_tensors: total size = 1960.00 MiB
HTTP server listening on 0.0.0.0:8080
```

**✓ Backend is ready when you see:** `HTTP server listening on 0.0.0.0:8080`

**Test backend health:**
```bash
# In a new terminal
curl http://localhost:8080/health
# Should return: {"status":"ok"}
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Expected output:**
```
  ▲ Next.js 15.0.0
  - Local:        http://localhost:3000
  - Network:      http://192.168.1.x:3000

✓ Ready in 2.3s
```

**✓ Frontend is ready when you see:** `✓ Ready in X.Xs`

### 7. Open the Application

**Open your browser and navigate to:**

```
http://localhost:3000
```

**✓ Success indicators:**
- You should see a modern dark-themed chat interface
- The model selector should show your loaded model
- No console errors in browser DevTools (F12)
- The page title should be "Context Control KV Cache"

### 8. Test the System

**First message test:**

1. Type a message in the input box: `"Hello! Can you help me understand quantum physics?"`
2. Press **Enter**
3. You should see:
   - Your message appears in the chat
   - A "thinking" indicator briefly
   - The AI response streams in word-by-word
   - The response completes without errors

**Branching test:**

1. **Select text** in the AI's response (e.g., highlight "quantum physics")
2. A purple **"Branch"** button should appear
3. Click the **"Branch"** button
4. The input field should highlight with a purple ring
5. Type a follow-up: `"Tell me more about this"`
6. Press **Enter**
7. Watch the animation:
   - Interface switches to graph view
   - A connecting line animates between nodes
   - New conversation node appears
   - Returns to focused view with the new branch

**✓ Everything is working if:**
- Messages send and receive successfully
- Responses stream in real-time
- Branching creates new conversation nodes
- Graph view shows the conversation tree
- You can click nodes to switch between conversations

### 9. Troubleshooting Quick Checklist

If something isn't working:

**Backend not starting:**
```bash
# Check if port 8080 is already in use
lsof -i :8080           # macOS/Linux
netstat -ano | findstr :8080  # Windows

# Kill the process if needed
kill -9 $(lsof -t -i:8080)  # macOS/Linux
```

**Frontend not connecting to backend:**
```bash
# Test backend health
curl http://localhost:8080/health

# Check environment variables
cat frontend/.env.local
# Should have: NEXT_PUBLIC_API_URL=http://localhost:8080
```

**Model not loading:**
```bash
# Verify model file exists and is a valid GGUF file
ls -lh llm/
file llm/*.gguf

# Check model path in backend script
grep MODEL_PATH backend/start_backend.sh
```

**Out of memory errors:**
```bash
# Reduce context size in backend/start_backend.sh
# Edit the file and add: -c 1024
# (Default is 2048, reducing to 1024 uses less RAM)
```

**Still having issues?** See the [Troubleshooting](#troubleshooting) section below for detailed solutions.

---

**🎉 Congratulations!** You now have a working KV cache-enabled chat system with conversation branching.

## Using the Branching Feature

### Creating Your First Branch

1. **Start a Conversation**
   - Type a message and press Enter
   - Wait for the AI response

2. **Select Text to Branch From**
   - Highlight any text in the conversation
   - A purple "Branch" button will appear

3. **Create the Branch**
   - Click the "Branch" button
   - The input field will highlight with a purple ring
   - Type your follow-up question about the selected text
   - Press Enter

4. **Watch the Animation**
   - The interface switches to graph view
   - A connection line animates from parent to child
   - The new conversation node appears
   - Automatically returns to focused view

5. **Navigate Between Branches**
   - Click the "Graph View" button (top-right) to see all branches
   - Click any node to switch to that conversation
   - Use mouse wheel to zoom, drag to pan
   - Each branch maintains its own conversation history

### Branching Strategies

**Exploring Alternatives**
```
Main conversation about Python
├─ Branch: "How does this work in JavaScript?" (reuse_kv)
├─ Branch: "Show me a real-world example" (reuse_kv)
└─ Branch: "Start from scratch and explain differently" (fresh)
```

**Deep Dives**
```
Overview of quantum mechanics
└─ Branch on "wave-particle duality"
    ├─ Branch on "double-slit experiment"
    └─ Branch on "quantum superposition"
```

**Comparison Testing**
```
"Explain sorting algorithms"
├─ Branch: "Focus on time complexity" (reuse_kv)
├─ Branch: "Focus on space complexity" (reuse_kv)
└─ Branch: "Show practical examples" (fresh)
```

## API Endpoints

The llama-server provides OpenAI-compatible endpoints plus custom branching endpoints:

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

### Chat Branch (Custom Endpoint)
`POST /v1/chat/branch`

**Custom endpoint for conversation branching with KV cache control.**

Create a new conversation branch that can optionally reuse the parent's KV cache for efficient context preservation.

**Request:**
```json
{
  "parent_slot_id": 0,
  "branch_mode": "reuse_kv",
  "text_excerpt": "relevant text from parent conversation",
  "context_window": 512,
  "prompt": "Follow-up question about the excerpt",
  "stream": true
}
```

**Parameters:**
- `parent_slot_id` (number): KV cache slot ID of the parent conversation
- `branch_mode` (string): Either `"reuse_kv"` or `"fresh"`
  - `reuse_kv`: Copy parent's KV cache (faster, maintains context)
  - `fresh`: Start with clean context
- `text_excerpt` (string): Selected text from parent for context
- `context_window` (number): Number of tokens for context window
- `prompt` (string): User's question for the branch
- `stream` (boolean): Enable streaming responses

**Response:** SSE stream with slot_id tracking:
```json
{
  "choices": [{"delta": {"content": "Response text..."}}],
  "slot_id": 1
}
```

### Completions
`POST /completion`

Direct completion endpoint for text generation.

### Other Endpoints

- `GET /health` - Server health check
- `GET /props` - Get server properties
- `GET /slots` - View KV cache slot status (includes branch relationships)
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

## Custom KV Cache Control

This project implements advanced KV cache management for efficient conversation branching - a key innovation for exploring different conversation paths without recomputing context.

### Conversation Branching System

The interface uses a **graph-based architecture** where conversations are represented as a tree of nodes. Each node maintains:

- Its own message history
- A unique KV cache slot ID
- Parent/child relationships
- Position in the conversation graph

### How Branching Works

1. **Text Selection**: Select any text from the current conversation
2. **Branch Creation**: Click the "Branch" button to create a new conversation path
3. **Context Preservation**: The system can reuse the parent's KV cache for efficient context inheritance
4. **Independent Paths**: Each branch evolves independently without affecting other branches

### Branch Modes

When creating a branch, you can choose between two modes:

#### Reuse KV Mode (Default)
```typescript
// Copies parent's KV cache to the new branch
{
  branch_mode: "reuse_kv",
  parent_slot_id: 3,
  text_excerpt: "selected text for context"
}
```

**Benefits:**
- ⚡ Faster inference (no context recomputation)
- 💾 Memory efficient (reuses cached key-value pairs)
- 🎯 Maintains conversation context automatically

#### Fresh Context Mode
```typescript
// Starts with clean slate
{
  branch_mode: "fresh",
  text_excerpt: "selected text as new context"
}
```

**Benefits:**
- 🆕 Clean context without parent influence
- 🔬 Useful for testing alternative approaches
- 🎨 More creative freedom from the model

### Visual Graph Interface

Switch between two view modes:

**Focused View** (Default)
- Traditional chat interface
- Shows active conversation only
- Optimized for reading and writing

**Graph View**
- Interactive tree visualization
- Pan and zoom controls
- Click any node to switch conversations
- Animated branching with particle effects
- Mini-map for navigation

### Implementation Details

#### Frontend Components

```typescript
// Graph-based state management
interface ChatNode {
  id: string;
  messages: Message[];
  slotId?: number;        // KV cache slot ID
  parentId: string | null;
  childrenIds: string[];
  position: { x: number; y: number };
  frozen: boolean;        // Read-only after branching
}
```

#### Custom Hooks

- **`useGraphState`**: Manages node graph and layout algorithm
- **`useBranchAnimation`**: 5-stage animation orchestration
- **`useTextSelection`**: Handles text selection for branching

#### API Integration

The system uses a custom branching endpoint:

```typescript
POST /v1/chat/branch
{
  "parent_slot_id": 3,
  "branch_mode": "reuse_kv",
  "text_excerpt": "selected text",
  "context_window": 512,
  "prompt": "user's question",
  "stream": true
}
```

### Layout Algorithm

Uses a modified **Reingold-Tilford algorithm** for optimal tree layout:
- Horizontal orientation (root on left, branches grow right)
- Collision-free node placement
- Automatic spacing and centering
- O(n) complexity

### Performance Benefits

Branching with KV cache reuse provides significant advantages:

| Operation | Without Cache Reuse | With Cache Reuse |
|-----------|-------------------|------------------|
| Context Processing | Full recomputation | Instant copy |
| Memory Usage | Duplicate storage | Shared until divergence |
| First Token Latency | High (proportional to context) | Low (starts immediately) |

### Usage Example

```typescript
// 1. Start initial conversation
const response1 = await streamChatCompletion([
  { role: "user", content: "Explain quantum physics" }
]);
// Slot ID: 0

// 2. Branch from a point in the conversation
const response2 = await streamBranch({
  parent_slot_id: 0,
  branch_mode: "reuse_kv",
  text_excerpt: "wave-particle duality",
  prompt: "Tell me more about this concept"
});
// Slot ID: 1 (inherits cached context from slot 0)

// 3. Create another branch from the same parent
const response3 = await streamBranch({
  parent_slot_id: 0,
  branch_mode: "reuse_kv",
  text_excerpt: "quantum entanglement",
  prompt: "How does this work?"
});
// Slot ID: 2 (also inherits from slot 0)
```

## KV Cache Management

The llama-server intelligently manages KV cache slots to optimize inference:

1. **Slot Allocation**: Automatic allocation of KV cache slots for parallel requests
2. **Cache Reuse**: Efficient cache management for multi-turn conversations
3. **Slot Monitoring**: Real-time slot status via `/slots` endpoint
4. **Per-Node Tracking**: Each conversation node tracks its own slot ID

You can monitor active slots and their status:

```bash
curl http://localhost:8080/slots
```

## Technologies

### Backend
- **llama.cpp** - Efficient C++ LLM inference engine
- **CMake** - Build system
- **Metal/CUDA** - GPU acceleration backends
- **Custom KV Cache Extensions** - Branching and slot management

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library for smooth transitions
- **Custom Graph Layout Algorithm** - Modified Reingold-Tilford for tree visualization

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
