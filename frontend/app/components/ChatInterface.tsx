'use client';

import { useState, useRef, useEffect } from 'react';
import { streamChatCompletion, streamBranch } from '../utils/api';
import ModelSelector from './ModelSelector';

interface ChatInterfaceProps {
  modelName: string;
  ctx: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  slot_id?: number;
}

interface SelectionPosition {
  x: number;
  y: number;
}

export default function ChatInterface({ modelName, ctx }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentSlotId, setCurrentSlotId] = useState<number | null>(null);
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionPosition, setSelectionPosition] = useState<SelectionPosition | null>(null);
  const [isFollowUpMode, setIsFollowUpMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle text selection
  const handleTextSelection = () => {
    // Don't clear selection if we're in follow-up mode
    if (isFollowUpMode) return;
    
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    
    if (text && text.length > 0) {
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();
      
      if (rect) {
        setSelectedText(text);
        setSelectionPosition({
          x: rect.right,
          y: rect.top - 10
        });
      }
    } else {
      setSelectedText('');
      setSelectionPosition(null);
    }
  };

  useEffect(() => {
    document.addEventListener('mouseup', handleTextSelection);
    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
    };
  }, [isFollowUpMode]);

  const handleFollowUp = () => {
    setIsFollowUpMode(true);
    setSelectionPosition(null);
    // Focus the input and scroll to it
    inputRef.current?.focus();
    inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = { role: 'user', content: input };
    const userInput = input;
    const excerpt = isFollowUpMode ? selectedText : '';
    const parentSlot = isFollowUpMode ? currentSlotId : null;
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);
    setIsFollowUpMode(false);
    setSelectedText('');

    let assistantMessage = '';

    // If we're in follow-up mode with selected text, use branch API
    if (excerpt && parentSlot !== null) {
      await streamBranch(
        parentSlot,
        'reuse_kv',
        excerpt,
        20,
        userInput,
        (chunk) => {
          const content = chunk.choices[0]?.delta?.content || '';
          assistantMessage += content;
          
          setMessages(prev => {
            const newMessages = [...prev];
            if (newMessages[newMessages.length - 1]?.role === 'assistant') {
              newMessages[newMessages.length - 1].content = assistantMessage;
            } else {
              newMessages.push({ role: 'assistant', content: assistantMessage });
            }
            return newMessages;
          });
          
          if (chunk.slot_id !== undefined) {
            setCurrentSlotId(chunk.slot_id);
          }
        },
        () => {
          setIsStreaming(false);
        },
        (error) => {
          console.error('Error:', error);
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: `Error: ${error}` 
          }]);
          setIsStreaming(false);
        }
      );
    } else {
      // Regular chat completion
      await streamChatCompletion(
        [{ role: 'user', content: userInput }],
        (chunk) => {
          const content = chunk.choices[0]?.delta?.content || '';
          assistantMessage += content;
          
          setMessages(prev => {
            const newMessages = [...prev];
            if (newMessages[newMessages.length - 1]?.role === 'assistant') {
              newMessages[newMessages.length - 1].content = assistantMessage;
            } else {
              newMessages.push({ role: 'assistant', content: assistantMessage });
            }
            return newMessages;
          });
          
          if (chunk.slot_id !== undefined) {
            setCurrentSlotId(chunk.slot_id);
          }
        },
        () => {
          setIsStreaming(false);
        },
        (error) => {
          console.error('Error:', error);
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: `Error: ${error}` 
          }]);
          setIsStreaming(false);
        }
      );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-0">
      {/* Messages */}
      {messages.length > 0 ? (
        <div className="w-full max-w-[700px] flex-1 mb-8 space-y-6 overflow-y-auto pt-20">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-5 py-3 ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-[#2f2f2f] text-gray-100 border border-[#3f3f3f]'
              }`}>
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      ) : (
        /* Header - Only show when no messages */
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-[700px] -mt-[60px]">
          <h1 className="text-[48px] font-normal mb-[16px] text-white tracking-tight leading-none">llama.cpp</h1>
          <p className="text-[17px] text-[#9ca3af] mb-[48px] font-normal">How can I help you today?</p>
          
          {/* Model and CTX badges */}
          <div className="mb-[85px]">
            <ModelSelector currentModel={modelName} ctx={ctx} />
          </div>
        </div>
      )}

      {/* Follow Up Button */}
      {selectionPosition && selectedText && (
        <button
          onClick={handleFollowUp}
          className="fixed z-50 flex items-center gap-2 bg-[#4a5568] hover:bg-[#5a6678] text-white px-4 py-2 rounded-lg shadow-lg transition-colors border border-[#6b7280]"
          style={{
            left: `${selectionPosition.x}px`,
            top: `${selectionPosition.y}px`,
            transform: 'translateY(-100%)'
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
          Follow Up
        </button>
      )}

      {/* Input Form - Fixed positioning */}
      <div className="w-full max-w-[700px] pb-[50px]">
        <form onSubmit={handleSubmit} className="relative">
          <div className={`bg-[#353535] border-0 rounded-[22px] shadow-none transition-all duration-300 ${
            isFollowUpMode ? 'ring-2 ring-yellow-500 ring-opacity-60' : ''
          }`}>
            <div className="flex items-center px-[16px] py-[12px] gap-[10px]">
              <button 
                type="button" 
                className="text-[#9ca3af] hover:text-[#d1d5db] transition-colors flex-shrink-0"
              >
                <svg className="w-[20px] h-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                </svg>
              </button>
              
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder={isFollowUpMode ? "Ask a follow-up question about the selected text..." : "Ask anything..."}
                disabled={isStreaming}
                rows={1}
                className="flex-1 bg-transparent border-none outline-none text-white placeholder-[#6b7280] text-[15px] resize-none leading-[1.4] max-h-[200px]"
                style={{ 
                  minHeight: '22px',
                  overflow: 'hidden'
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
                  <svg className="w-[20px] h-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
                </button>
                
                <button 
                  type="submit" 
                  disabled={isStreaming || !input.trim()}
                  className="bg-[#5a5a5a] hover:bg-[#6a6a6a] disabled:bg-[#404040] disabled:cursor-not-allowed text-white rounded-full p-[8px] transition-colors"
                >
                  <svg className="w-[16px] h-[16px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </form>
        
        {isFollowUpMode && selectedText && (
          <div className="mt-3 p-3 bg-[#2f2f2f] border border-yellow-500/30 rounded-lg">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-xs text-yellow-500 mb-1 font-medium">Following up on:</p>
                <p className="text-sm text-gray-300 italic line-clamp-3">&ldquo;{selectedText}&rdquo;</p>
              </div>
              <button
                onClick={() => {
                  setIsFollowUpMode(false);
                  setSelectedText('');
                }}
                className="text-gray-400 hover:text-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
        
        <p className="text-center text-[11.5px] text-[#6b7280] mt-[14px] font-normal">
          Press <kbd className="px-[5px] py-[1px] bg-[#404040] border-0 rounded-[3px] text-[#9ca3af] font-mono text-[10.5px]">Enter</kbd> to send, <kbd className="px-[5px] py-[1px] bg-[#404040] border-0 rounded-[3px] text-[#9ca3af] font-mono text-[10.5px]">Shift + Enter</kbd> for new line
        </p>
      </div>

      {/* Slot ID Display */}
      {currentSlotId !== null && (
        <div className="fixed top-6 right-6 bg-purple-900/50 border border-purple-700 rounded-lg px-4 py-2 backdrop-blur-sm">
          <p className="text-xs text-purple-200">Slot ID: {currentSlotId}</p>
        </div>
      )}
    </div>
  );
}

