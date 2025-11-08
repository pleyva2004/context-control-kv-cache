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
      }}
      onClick={onClick}
      whileHover={{ scale: scale * 1.05 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className={`w-full h-full rounded-xl px-4 py-3 border-2 transition-all duration-300 ${
          isActive
            ? 'bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/50'
            : node.isFrozen
            ? 'bg-[#2f2f2f]/60 border-[#3f3f3f] opacity-60'
            : 'bg-[#2f2f2f] border-[#3f3f3f] hover:border-[#4f4f4f]'
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

