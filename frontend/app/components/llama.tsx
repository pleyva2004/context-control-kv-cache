import React, { useState } from 'react';
import { Paperclip, Mic, ArrowUp, Menu, Settings } from 'lucide-react';

interface LlamaCppInterfaceProps {
  modelName?: string;
  ctx?: number;
}

export default function LlamaCppInterface({ 
  modelName = 'Llama-3.2-3B-Instruct-Q4_K_M.gguf',
  ctx = 4096
}: LlamaCppInterfaceProps) {
  const [input, setInput] = useState('');

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Top Navigation */}
      <div className="flex items-center justify-between p-4">
        <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <Menu size={20} className="text-gray-400" />
        </button>
        <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <Settings size={20} className="text-gray-400" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {/* Title */}
        <h1 className="text-4xl font-semibold mb-4 text-white">
          llama.cpp
        </h1>
        
        {/* Subtitle */}
        <p className="text-gray-400 text-lg mb-8">
          How can I help you today?
        </p>

        {/* Model Info */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center gap-2 bg-gray-800 rounded-full px-4 py-2">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-400">
                <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <rect x="5" y="5" width="6" height="6" rx="1" fill="currentColor"/>
              </svg>
              <span className="text-sm text-gray-300">{modelName}</span>
            </div>
          </div>
          <div className="bg-gray-800 rounded-full px-4 py-2">
            <span className="text-sm text-gray-300">ctx: {ctx.toLocaleString()}</span>
          </div>
        </div>

        {/* Input Container */}
        <div className="w-full max-w-3xl">
          <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="w-full bg-transparent text-white placeholder-gray-500 resize-none outline-none text-base"
              rows={1}
              style={{ minHeight: '24px' }}
            />
            
            {/* Input Controls */}
            <div className="flex items-center justify-between mt-3">
              <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <Paperclip size={18} className="text-gray-500" />
              </button>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                  <Mic size={18} className="text-gray-500" />
                </button>
                <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                  <ArrowUp size={18} className="text-gray-300" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Helper Text */}
          <div className="text-center mt-3">
            <span className="text-gray-600 text-sm">
              Press <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-xs">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-xs">Shift + Enter</kbd> for new line
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}