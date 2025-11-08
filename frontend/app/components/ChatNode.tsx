'use client';

import { motion } from 'framer-motion';
import { ChatNode as ChatNodeType } from '../types/graph';

interface ChatNodeProps {
  node: ChatNodeType;
  isActive: boolean;
  onClick: () => void;
  scale?: number;
}

export default function ChatNode({ node, isActive, onClick, scale = 1 }: ChatNodeProps) {
  const nodeWidth = 220;
  const nodeHeight = 80;
  
  // Truncate long questions
  const truncateText = (text: string, maxLength: number = 60) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <motion.div
      className={`absolute cursor-pointer select-none`}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: nodeWidth,
        height: nodeHeight,
        transform: `translate(-50%, -50%) scale(${scale})`,
        pointerEvents: 'auto',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      whileHover={{ scale: scale * 1.05 }}
      transition={{ duration: 0.2 }}
    >
      {/* Connection dots */}
      {node.parentId && (
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 bg-[#1c1c1c]"
          style={{
            borderColor: isActive ? '#3b82f6' : '#5f5f5f',
          }}
        />
      )}
      {node.children.length > 0 && (
        <div 
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 rounded-full border-2 bg-[#1c1c1c]"
          style={{
            borderColor: isActive ? '#3b82f6' : '#5f5f5f',
          }}
        />
      )}
      
      <div
        className={`w-full h-full rounded-lg px-4 py-3 border-2 transition-all duration-300 shadow-md ${
          isActive
            ? 'bg-blue-600/30 border-blue-400 shadow-lg shadow-blue-500/50'
            : node.isFrozen
            ? 'bg-[#3a3a3a]/80 border-[#505050] opacity-70'
            : 'bg-[#3a3a3a] border-[#5f5f5f] hover:border-[#7f7f7f] hover:shadow-lg'
        }`}
      >
        {/* Node header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isActive ? 'bg-blue-500' : node.isFrozen ? 'bg-gray-600' : 'bg-green-500'
              }`}
            />
            <span className="text-xs text-gray-400">
              {node.isFrozen ? 'Frozen' : isActive ? 'Active' : 'Branch'}
            </span>
          </div>
          {node.children.length > 0 && (
            <span className="text-xs text-gray-500">
              {node.children.length} {node.children.length === 1 ? 'branch' : 'branches'}
            </span>
          )}
        </div>

        {/* User question */}
        <div className="text-sm text-gray-200 leading-snug line-clamp-2">
          {node.userQuestion || 'Start conversation'}
        </div>

        {/* Message count */}
        {node.messages.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            {node.messages.length} {node.messages.length === 1 ? 'message' : 'messages'}
          </div>
        )}
      </div>
    </motion.div>
  );
}

