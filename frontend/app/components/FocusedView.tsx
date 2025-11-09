'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChatNode } from '../types/graph';
import ModelSelector from './ModelSelector';

interface FocusedViewProps {
  activeNode: ChatNode | null;
  modelName: string;
  ctx: number;
  input: string;
  setInput: (value: string) => void;
  isStreaming: boolean;
  selectedText: string;
  selectionPosition: { x: number; y: number } | null;
  branchState: 'idle' | 'selecting' | 'ready_to_branch';
  onSubmit: (e: React.FormEvent) => void;
  onInitiateBranch: () => void;
  onCancelBranch: () => void;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export default function FocusedView({
  activeNode,
  modelName,
  ctx,
  input,
  setInput,
  isStreaming,
  selectedText,
  selectionPosition,
  branchState,
  onSubmit,
  onInitiateBranch,
  onCancelBranch,
  inputRef,
  messagesEndRef,
}: FocusedViewProps) {
  // Scroll to bottom effect
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNode?.messages]);

  return (
    <motion.div
      key="focused-view"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="w-full flex flex-col items-center"
    >
      {/* Messages */}
      {activeNode && activeNode.messages.length > 0 ? (
        <div className="w-full max-w-[700px] flex-1 mb-8 space-y-6 overflow-y-auto pt-20 pb-4 custom-scrollbar max-h-[calc(100vh-300px)]">
          {activeNode.messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-5 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#2f2f2f] text-gray-100 border border-[#3f3f3f]'
                }`}
              >
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      ) : (
        /* Header - Only show when no messages */
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-[700px] -mt-[60px]">
          <h1 className="text-[48px] font-normal mb-[16px] text-white tracking-tight leading-none">
            llama.cpp
          </h1>
          <p className="text-[17px] text-[#9ca3af] mb-[48px] font-normal">
            How can I help you today?
          </p>

          {/* Model and CTX badges */}
          <div className="mb-[85px]">
            <ModelSelector currentModel={modelName} ctx={ctx} />
          </div>
        </div>
      )}

      {/* Branch Button */}
      {selectionPosition && selectedText && branchState === 'idle' && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={onInitiateBranch}
          className="fixed z-50 flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors border border-purple-500"
          style={{
            left: `${selectionPosition.x}px`,
            top: `${selectionPosition.y}px`,
            transform: 'translateY(-100%)',
          }}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
            />
          </svg>
          Branch
        </motion.button>
      )}

      {/* Input Form */}
      <div className="w-full max-w-[700px] pb-[50px]">
        <form onSubmit={onSubmit} className="relative">
          <div
            className={`bg-[#353535] border-0 rounded-[22px] shadow-none transition-all duration-300 ${
              branchState === 'ready_to_branch'
                ? 'ring-2 ring-purple-500 ring-opacity-60'
                : ''
            }`}
          >
            <div className="flex items-center px-[16px] py-[12px] gap-[10px]">
              <button
                type="button"
                className="text-[#9ca3af] hover:text-[#d1d5db] transition-colors flex-shrink-0"
              >
                <svg
                  className="w-[20px] h-[20px]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"
                  />
                </svg>
              </button>

              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onSubmit(e);
                  }
                  if (e.key === 'Escape' && branchState === 'ready_to_branch') {
                    onCancelBranch();
                  }
                }}
                placeholder={
                  branchState === 'ready_to_branch'
                    ? 'Ask a question about the selected text...'
                    : 'Ask anything...'
                }
                disabled={isStreaming}
                rows={1}
                className="flex-1 bg-transparent border-none outline-none text-white placeholder-[#6b7280] text-[15px] resize-none leading-[1.4] max-h-[200px]"
                style={{
                  minHeight: '22px',
                  overflow: 'hidden',
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 200) + 'px';
                }}
              />

              <div className="flex items-center gap-[10px] flex-shrink-0">
                <button
                  type="button"
                  className="text-[#9ca3af] hover:text-[#d1d5db] transition-colors"
                >
                  <svg
                    className="w-[20px] h-[20px]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                    />
                  </svg>
                </button>

                <button
                  type="submit"
                  disabled={isStreaming || !input.trim()}
                  className="bg-[#5a5a5a] hover:bg-[#6a6a6a] disabled:bg-[#404040] disabled:cursor-not-allowed text-white rounded-full p-[8px] transition-colors"
                >
                  <svg
                    className="w-[16px] h-[16px]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </form>

        {branchState === 'ready_to_branch' && selectedText && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-3 bg-[#2f2f2f] border border-purple-500/30 rounded-lg"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-xs text-purple-400 mb-1 font-medium">
                  Branching from:
                </p>
                <p className="text-sm text-gray-300 italic line-clamp-3">
                  &ldquo;{selectedText}&rdquo;
                </p>
              </div>
              <button
                onClick={onCancelBranch}
                className="text-gray-400 hover:text-gray-200 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </motion.div>
        )}

        <p className="text-center text-[11.5px] text-[#6b7280] mt-[14px] font-normal">
          Press{' '}
          <kbd className="px-[5px] py-[1px] bg-[#404040] border-0 rounded-[3px] text-[#9ca3af] font-mono text-[10.5px]">
            Enter
          </kbd>{' '}
          to send,{' '}
          <kbd className="px-[5px] py-[1px] bg-[#404040] border-0 rounded-[3px] text-[#9ca3af] font-mono text-[10.5px]">
            Shift + Enter
          </kbd>{' '}
          for new line
        </p>
      </div>
    </motion.div>
  );
}

