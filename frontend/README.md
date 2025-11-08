# llama.cpp Frontend

A modern Next.js frontend for interacting with llama.cpp models.

## Features

- 🎨 Dark theme UI matching llama.cpp style
- 💬 Real-time streaming chat interface
- 🔄 KV cache slot tracking
- 📱 Responsive design
- ⚡ Built with Next.js 15, React 18, and Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend server running on `http://localhost:8080`

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Configuration

The frontend connects to the backend API at `http://localhost:8080` by default. You can change this by creating a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Build

```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── app/
│   ├── components/
│   │   └── ChatInterface.tsx    # Main chat UI component
│   ├── utils/
│   │   └── api.ts                # API utilities for backend communication
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── public/                        # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## Features in Detail

### Chat Interface

- Clean, modern UI with dark theme
- Model name and context window (ctx) display
- Real-time message streaming
- Slot ID tracking for KV cache management

### API Integration

- Streaming chat completions
- Branch conversations with KV cache reuse
- Error handling and retry logic

## Technologies

- **Next.js 15** - React framework
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Server-Sent Events (SSE)** - Real-time streaming

