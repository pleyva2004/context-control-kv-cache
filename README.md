# Context Control KV Cache

R&D Project for KV caching with llama.cpp - A modern chat interface with advanced KV cache management for efficient conversation branching.

## Features

- **Fast Inference**: Powered by native llama.cpp C++ implementation
- **Real-time Streaming**: Stream responses as they're generated
- **Advanced KV Cache Branching**: Create conversation branches with intelligent KV cache reuse
- **Graph-Based Conversations**: Node-based architecture with interactive tree visualization
- **Smart Context Management**: Two branching modes for optimal context control
  - **Reuse KV**: Copy parent's KV cache for efficient context inheritance
  - **Fresh Context**: Start branches without cache dependencies
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
