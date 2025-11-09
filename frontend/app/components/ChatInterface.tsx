'use client';

import { useState, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { streamChatCompletion, streamBranch } from '../utils/api';
import GraphView from './GraphView';
import FocusedView from './FocusedView';
import {
  Message,
  createNode,
} from '../types/graph';
import { useGraphState } from '../hooks/useGraphState';
import { useBranchAnimation } from '../hooks/useBranchAnimation';
import { useTextSelection } from '../hooks/useTextSelection';

interface ChatInterfaceProps {
  modelName: string;
  ctx: number;
}

type BranchState = 'idle' | 'selecting' | 'ready_to_branch';

export default function ChatInterface({ modelName, ctx }: ChatInterfaceProps) {
  // Custom hooks for extracted logic
  const { graphState, setGraphState, activeNode } = useGraphState();
  const { viewMode, branchAnimation, setBranchAnimation, toggleViewMode } = useBranchAnimation();

  // UI state
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [branchState, setBranchState] = useState<BranchState>('idle');
  
  // Text selection hook
  const { selectedText, setSelectedText, selectionPosition, setSelectionPosition } = useTextSelection(branchState);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

    // Add user message to current node and mark as activated
    const updatedNodes = new Map(graphState.nodes);
    const updatedNode = {
      ...activeNode,
      messages: [...activeNode.messages, userMessage],
      isActivated: true, // Ensure node is activated when messages are added
    };
    updatedNodes.set(activeNode.id, updatedNode);
    
    setGraphState((prev) => ({ ...prev, nodes: updatedNodes }));
    setInput('');
    setIsStreaming(true);

    let assistantMessage = '';

    // Send full conversation history to API
    const conversationHistory = [...activeNode.messages, userMessage];
    await streamChatCompletion(
      conversationHistory,
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

    // Start branching animation
    setBranchAnimation({
      isAnimating: true,
      stage: 'switching_to_graph',
      newNodeId,
      parentNodeId: activeNode.id,
    });

    // Reset UI state
    setInput('');
    setBranchState('idle');
    setSelectedText('');
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
    const node = graphState.nodes.get(nodeId);
    
    // If node is not activated yet, mark it as activated
    if (node && !node.isActivated) {
      const updatedNodes = new Map(graphState.nodes);
      updatedNodes.set(nodeId, { ...node, isActivated: true });
      setGraphState((prev) => ({ ...prev, nodes: updatedNodes, activeNodeId: nodeId }));
    } else {
      setGraphState((prev) => ({ ...prev, activeNodeId: nodeId }));
    }
    
    toggleViewMode();
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
            <GraphView
              nodes={graphState.nodes}
              activeNodeId={graphState.activeNodeId}
              onNodeClick={handleNodeClick}
              branchAnimation={branchAnimation}
            />
        ) : (
          <FocusedView
            key="focused-view"
            activeNode={activeNode ?? null}
            modelName={modelName}
            ctx={ctx}
            input={input}
            setInput={setInput}
            isStreaming={isStreaming}
            selectedText={selectedText}
            selectionPosition={selectionPosition}
            branchState={branchState}
            onSubmit={handleSubmit}
            onInitiateBranch={handleInitiateBranch}
            onCancelBranch={handleCancelBranch}
            inputRef={inputRef}
            messagesEndRef={messagesEndRef}
          />
        )}
      </AnimatePresence>

            {/* Slot ID Display */}
            {activeNode && activeNode.slotId !== null && (
              <div className="fixed top-6 left-6 bg-purple-900/50 border border-purple-700 rounded-lg px-4 py-2 backdrop-blur-sm">
                <p className="text-xs text-purple-200">
                  Slot ID: {activeNode.slotId} | Node: {activeNode.id.substring(0, 8)}
                </p>
              </div>
            )}
    </div>
  );
}
