'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { streamChatCompletion, streamBranch } from '../utils/api';
import ModelSelector from './ModelSelector';
import GraphView from './GraphView';
import {
  ChatNode,
  GraphState,
  Message,
  createNode,
} from '../types/graph';
import { calculateTreeLayout, centerTree } from '../utils/graphLayout';

interface ChatInterfaceProps {
  modelName: string;
  ctx: number;
}

interface SelectionPosition {
  x: number;
  y: number;
}

type ViewMode = 'focused' | 'graph';
type BranchState = 'idle' | 'selecting' | 'ready_to_branch';

export default function ChatInterface({ modelName, ctx }: ChatInterfaceProps) {
  // Graph state
  const [graphState, setGraphState] = useState<GraphState>({
    nodes: new Map(),
    activeNodeId: null,
    rootNodeId: null,
  });

  // UI state
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('focused');
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionPosition, setSelectionPosition] = useState<SelectionPosition | null>(null);
  const [branchState, setBranchState] = useState<BranchState>('idle');
  
  // Animation state
  const [isBranchingAnimation, setIsBranchingAnimation] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Get active node
  const activeNode = graphState.activeNodeId
    ? graphState.nodes.get(graphState.activeNodeId)
    : null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (viewMode === 'focused') {
      scrollToBottom();
    }
  }, [activeNode?.messages, viewMode]);

  // Initialize root node if empty
  useEffect(() => {
    if (graphState.nodes.size === 0) {
      const rootNode = createNode('root', null, 'Start conversation');
      const newNodes = new Map([[rootNode.id, rootNode]]);
      
      setGraphState({
        nodes: newNodes,
        activeNodeId: rootNode.id,
        rootNodeId: rootNode.id,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update layout when nodes change
  useEffect(() => {
    if (graphState.rootNodeId && graphState.nodes.size > 0) {
      const positions = calculateTreeLayout(graphState.nodes, graphState.rootNodeId);
      centerTree(positions);
      
      const updatedNodes = new Map(graphState.nodes);
      positions.forEach((position, nodeId) => {
        const node = updatedNodes.get(nodeId);
        if (node) {
          updatedNodes.set(nodeId, { ...node, position });
        }
      });
      
      setGraphState((prev) => ({
        ...prev,
        nodes: updatedNodes,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphState.nodes.size, graphState.rootNodeId]);

  // Handle text selection
  const handleTextSelection = () => {
    if (branchState !== 'idle') return;
    
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    
    if (text && text.length > 0) {
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();
      
      if (rect) {
        setSelectedText(text);
        setSelectionPosition({
          x: rect.right,
          y: rect.top - 10,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchState]);

  // Handle branch initiation
  const handleInitiateBranch = () => {
    setBranchState('ready_to_branch');
    setSelectionPosition(null);
    inputRef.current?.focus();
    inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Handle cancel branch
  const handleCancelBranch = () => {
    setBranchState('idle');
    setSelectedText('');
    setInput('');
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming || !activeNode) return;

    const userMessage: Message = { role: 'user', content: input };
    const userInput = input;
    const isBranching = branchState === 'ready_to_branch' && selectedText;

    if (isBranching) {
      // Branching flow - create new node
      await handleBranchSubmit(userInput);
    } else {
      // Regular message flow - continue in current node
      await handleRegularSubmit(userMessage, userInput);
    }
  };

  // Handle regular submit (no branching)
  const handleRegularSubmit = async (userMessage: Message, userInput: string) => {
    if (!activeNode) return;

    // Add user message to current node
    const updatedNodes = new Map(graphState.nodes);
    const updatedNode = {
      ...activeNode,
      messages: [...activeNode.messages, userMessage],
    };
    updatedNodes.set(activeNode.id, updatedNode);
    
    setGraphState((prev) => ({ ...prev, nodes: updatedNodes }));
    setInput('');
    setIsStreaming(true);

    let assistantMessage = '';

    await streamChatCompletion(
      [{ role: 'user', content: userInput }],
      (chunk) => {
        const content = chunk.choices[0]?.delta?.content || '';
        assistantMessage += content;
        
        setGraphState((prev) => {
          const nodes = new Map(prev.nodes);
          const node = nodes.get(activeNode.id);
          if (!node) return prev;
          
          const messages = [...node.messages];
          if (messages[messages.length - 1]?.role === 'assistant') {
            messages[messages.length - 1] = {
              role: 'assistant',
              content: assistantMessage,
            };
          } else {
            messages.push({ role: 'assistant', content: assistantMessage });
          }
          
          nodes.set(activeNode.id, {
            ...node,
            messages,
            slotId: chunk.slot_id ?? node.slotId,
          });
          
          return { ...prev, nodes };
        });
      },
      () => {
        setIsStreaming(false);
      },
      (error) => {
        console.error('Error:', error);
        setGraphState((prev) => {
          const nodes = new Map(prev.nodes);
          const node = nodes.get(activeNode.id);
          if (!node) return prev;
          
          nodes.set(activeNode.id, {
            ...node,
            messages: [
              ...node.messages,
              { role: 'assistant', content: `Error: ${error}` },
            ],
          });
          
          return { ...prev, nodes };
        });
        setIsStreaming(false);
      }
    );
  };

  // Handle branch submit
  const handleBranchSubmit = async (userInput: string) => {
    if (!activeNode || activeNode.slotId === null) {
      console.error('Cannot branch: no active node or slot ID');
      return;
    }

    // Start branching animation
    setIsBranchingAnimation(true);
    
    // Wait for minimize animation
    await new Promise((resolve) => setTimeout(resolve, 400));

    // Create new node
    const newNodeId = `node-${Date.now()}`;
    const newNode = createNode(newNodeId, activeNode.id, userInput);
    
    // Freeze parent node
    const updatedNodes = new Map(graphState.nodes);
    updatedNodes.set(activeNode.id, {
      ...activeNode,
      isFrozen: true,
      children: [...activeNode.children, newNodeId],
    });
    updatedNodes.set(newNodeId, newNode);

    // Update graph state
    setGraphState({
      ...graphState,
      nodes: updatedNodes,
      activeNodeId: newNodeId,
    });

    // Wait for branch line animation
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Reset UI state
    setInput('');
    setBranchState('idle');
    setSelectedText('');
    setIsBranchingAnimation(false);
    setIsStreaming(true);

    // Add user message to new node
    const userMessage: Message = { role: 'user', content: userInput };
    const nodesWithUserMsg = new Map(updatedNodes);
    nodesWithUserMsg.set(newNodeId, {
      ...newNode,
      messages: [userMessage],
    });
    setGraphState((prev) => ({ ...prev, nodes: nodesWithUserMsg }));

    // Stream branch response
    let assistantMessage = '';

    await streamBranch(
      activeNode.slotId,
      'reuse_kv',
      selectedText,
      20,
      userInput,
      (chunk) => {
        const content = chunk.choices[0]?.delta?.content || '';
        assistantMessage += content;
        
        setGraphState((prev) => {
          const nodes = new Map(prev.nodes);
          const node = nodes.get(newNodeId);
          if (!node) return prev;
          
          const messages = [...node.messages];
          if (messages[messages.length - 1]?.role === 'assistant') {
            messages[messages.length - 1] = {
              role: 'assistant',
              content: assistantMessage,
            };
          } else {
            messages.push({ role: 'assistant', content: assistantMessage });
          }
          
          nodes.set(newNodeId, {
            ...node,
            messages,
            slotId: chunk.slot_id ?? node.slotId,
          });
          
          return { ...prev, nodes };
        });
      },
      () => {
        setIsStreaming(false);
      },
      (error) => {
        console.error('Error:', error);
        setGraphState((prev) => {
          const nodes = new Map(prev.nodes);
          const node = nodes.get(newNodeId);
          if (!node) return prev;
          
          nodes.set(newNodeId, {
            ...node,
            messages: [
              ...node.messages,
              { role: 'assistant', content: `Error: ${error}` },
            ],
          });
          
          return { ...prev, nodes };
        });
        setIsStreaming(false);
      }
    );
  };

  // Handle node click in graph view
  const handleNodeClick = (nodeId: string) => {
    setGraphState((prev) => ({ ...prev, activeNodeId: nodeId }));
    setViewMode('focused');
  };

  // Toggle view mode
  const toggleViewMode = () => {
    setViewMode((prev) => (prev === 'focused' ? 'graph' : 'focused'));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-0">
      {/* View Toggle Button */}
      <button
        onClick={toggleViewMode}
        className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-[#2f2f2f] hover:bg-[#3f3f3f] border border-[#4f4f4f] text-white px-4 py-2 rounded-lg transition-colors"
      >
        {viewMode === 'focused' ? (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
            Graph View
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            Focus View
          </>
        )}
      </button>

      <AnimatePresence mode="wait">
        {viewMode === 'graph' ? (
          <motion.div
            key="graph-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full h-screen"
          >
            <GraphView
              nodes={graphState.nodes}
              activeNodeId={graphState.activeNodeId}
              onNodeClick={handleNodeClick}
            />
          </motion.div>
        ) : (
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
              <div className="w-full max-w-[700px] flex-1 mb-8 space-y-6 overflow-y-auto pt-20 custom-scrollbar">
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
                onClick={handleInitiateBranch}
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
              <form onSubmit={handleSubmit} className="relative">
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
                          handleSubmit(e);
                        }
                        if (e.key === 'Escape' && branchState === 'ready_to_branch') {
                          handleCancelBranch();
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
                      onClick={handleCancelBranch}
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

            {/* Slot ID Display */}
            {activeNode && activeNode.slotId !== null && (
              <div className="fixed top-6 left-6 bg-purple-900/50 border border-purple-700 rounded-lg px-4 py-2 backdrop-blur-sm">
                <p className="text-xs text-purple-200">
                  Slot ID: {activeNode.slotId} | Node: {activeNode.id.substring(0, 8)}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
