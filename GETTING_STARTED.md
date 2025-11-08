# Getting Started Guide

This guide will help you get the Context Control KV Cache application up and running quickly.

## What You Have

✅ **Next.js Frontend** - Modern, dark-themed chat interface  
✅ **FastAPI Backend** - Python backend with llama.cpp integration  
✅ **Streaming Support** - Real-time message streaming  
✅ **KV Cache Management** - Efficient conversation branching  
✅ **Model Selector** - Dynamic model and context display  

## File Structure

```
frontend/
├── app/
│   ├── components/
│   │   ├── ChatInterface.tsx    # Main chat UI
│   │   └── ModelSelector.tsx    # Model info display with dropdown
│   ├── utils/
│   │   └── api.ts               # Backend API communication
│   ├── globals.css              # Global styles (dark theme)
│   ├── layout.tsx               # App layout
│   └── page.tsx                 # Home page
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
├── tailwind.config.ts           # Tailwind CSS config
└── next.config.js               # Next.js config
```

## Quick Start (3 Steps)

### 1. Install Dependencies (First Time Only)

```bash
# In the project root
pip install -r requirements.txt

# In the frontend directory
cd frontend
npm install
cd ..
```

### 2. Start the Application

Option A - Use the convenience script (recommended):
```bash
chmod +x start.sh
./start.sh
```

Option B - Start services manually:
```bash
# Terminal 1 - Backend
cd backend
uvicorn app:app --reload --port 8080

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 3. Open Your Browser

Navigate to: **http://localhost:3000**

You should see:
- Dark-themed interface
- "llama.cpp" title
- Model name badge: `Llama-3.2-3B-Instruct-Q4_K_M.gguf`
- Context window badge: `ctx: 4,096`
- Input box with placeholder: "Ask anything..."

## Features Walkthrough

### Basic Chat
1. Type a message in the input box
2. Press Enter or click the send button (↑ arrow)
3. Watch the response stream in real-time
4. Notice the slot ID displayed in the top-right corner

### Model Information
1. Click on the model name badge to open settings
2. View current model and context window settings
3. These are configured in the backend (`backend/app.py`)

### Conversation Branching (Advanced)
The backend supports branching conversations:
- Each conversation gets a unique slot ID
- You can branch from any previous response
- The KV cache is reused for efficiency

## Configuration

### Change Model
Edit `backend/app.py`:
```python
LLM = Llama(
    model_path="../models/YOUR_MODEL.gguf",  # Change this
    n_ctx=4096,        # Change context window
    n_gpu_layers=32,   # Adjust for your GPU
    verbose=False
)
```

### Change Backend URL
Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://your-backend-url:8080
```

## Troubleshooting

### Frontend won't start
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Backend issues
```bash
# Check if model exists
ls models/Llama-3.2-3B-Instruct-Q4_K_M.gguf

# Check Python dependencies
pip install -r requirements.txt

# Start with verbose logging
cd backend
uvicorn app:app --reload --port 8080 --log-level debug
```

### Can't connect to backend
1. Ensure backend is running on port 8080
2. Check CORS settings in `backend/app.py`
3. Verify `NEXT_PUBLIC_API_URL` in `.env.local`

## Next Steps

1. **Try different prompts** - Test the chat interface
2. **Monitor slot IDs** - Watch how KV cache slots are assigned
3. **Explore the code** - Check out the components in `frontend/app/components/`
4. **Customize styling** - Edit `frontend/app/globals.css` or component styles
5. **Add features** - Implement conversation history, export chats, etc.

## Development Tips

### Hot Reload
Both backend and frontend support hot reload:
- **Backend**: Changes to `backend/app.py` reload automatically
- **Frontend**: Changes to any `.tsx` or `.css` file reload the browser

### TypeScript
The frontend is fully typed. Your IDE should provide:
- Autocomplete for API functions
- Type checking for component props
- Error detection before runtime

### Styling
Uses Tailwind CSS utility classes:
```tsx
<div className="bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2">
  {/* Your content */}
</div>
```

## API Endpoints Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/chat/completions` | POST | Standard chat completion (streaming) |
| `/v1/chat/branch` | POST | Branch conversation from parent slot |
| `/generate` | POST | Generate new message |
| `/focus` | POST | Focus on text excerpt |
| `/continue` | POST | Continue conversation |

## Support

Having issues? Check:
1. Backend logs in the terminal
2. Browser console (F12) for frontend errors
3. Network tab (F12) to see API requests
4. README.md for detailed documentation

## What's Different from `index2.html`?

The new Next.js frontend offers:
- ✅ Modern React components
- ✅ TypeScript for type safety
- ✅ Better code organization
- ✅ Tailwind CSS for styling
- ✅ Hot module replacement
- ✅ Production build optimization
- ✅ API utilities for cleaner code
- ✅ Reusable components

Enjoy your new llama.cpp interface! 🦙

