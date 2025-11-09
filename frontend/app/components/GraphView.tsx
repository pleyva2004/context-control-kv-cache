'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatNode from './ChatNode';
import { ChatNode as ChatNodeType, NodePosition } from '../types/graph';

interface BranchAnimationState {
  isAnimating: boolean;
  stage: 'idle' | 'switching_to_graph' | 'drawing_branch' | 'flowing_context' | 'expanding_node' | 'returning_to_focus';
  newNodeId: string | null;
  parentNodeId: string | null;
}

interface GraphViewProps {
  nodes: Map<string, ChatNodeType>;
  activeNodeId: string | null;
  onNodeClick: (nodeId: string) => void;
  branchAnimation: BranchAnimationState;
}

export default function GraphView({ nodes, activeNodeId, onNodeClick, branchAnimation }: GraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 400, y: 400 });
  const [zoom, setZoom] = useState(1);
  const [activatingNodeId, setActivatingNodeId] = useState<string | null>(null);
  
  // Save the initial pan and zoom for reset button
  const initialPanRef = useRef<{ x: number; y: number } | null>(null);
  const initialZoomRef = useRef<number>(1);
  const hasInitializedRef = useRef(false);

  // Simple centering logic - only runs once on initial load
  useEffect(() => {
    if (!hasInitializedRef.current && nodes.size > 0 && containerRef.current) {
      // Wait for container to be fully sized
      requestAnimationFrame(() => {
        if (!containerRef.current) return;
        
        const container = containerRef.current;
        const newPan = {
          x: container.clientWidth / 3,
          y: container.clientHeight / 2,
        };
        
        setPan(newPan);
        initialPanRef.current = newPan;
        initialZoomRef.current = zoom;
        hasInitializedRef.current = true;
      });
    }
  }, [nodes.size, zoom]);

  // Handle node activation click
  const handleNodeActivationClick = (nodeId: string) => {
    const node = nodes.get(nodeId);
    if (!node) return;
    
    // If node is not activated, trigger activation animation first
    if (!node.isActivated) {
      setActivatingNodeId(nodeId);
      // After animation completes (400ms), call the actual click handler
      setTimeout(() => {
        setActivatingNodeId(null);
        onNodeClick(nodeId);
      }, 400);
    } else {
      // Node is already activated, proceed normally
      onNodeClick(nodeId);
    }
  };

  // Handle mouse wheel for zooming
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    const newZoom = Math.min(Math.max(0.3, zoom + delta), 2);
    setZoom(newZoom);
  };

  // Generate SVG paths for connections - tree-style with right angles
  const generatePath = (from: NodePosition, to: NodePosition): string => {
    // Node dimensions from ChatNode.tsx
    const nodeWidth = 220;
    const connectionGap = 15; // Gap between line and node edge
    const horizontalExtension = 80; // How far the line extends horizontally from parent
    
    // Calculate start and end points with proper spacing
    const startX = from.x + (nodeWidth / 2) + connectionGap; // Right edge of parent + gap
    const endX = to.x - (nodeWidth / 2) - connectionGap;     // Left edge of child - gap
    const startY = from.y;
    const endY = to.y;
    
    // Create a balanced stepped path: horizontal from parent, vertical drop, horizontal to child
    const firstCornerX = startX + horizontalExtension;
    const secondCornerX = endX - horizontalExtension;
    
    return `M ${startX} ${startY} L ${firstCornerX} ${startY} L ${firstCornerX} ${endY} L ${endX} ${endY}`;
  };

  // Calculate view box dimensions
  const calculateViewBox = (): { minX: number; minY: number; width: number; height: number } => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach((node) => {
      minX = Math.min(minX, node.position.x - 150);
      minY = Math.min(minY, node.position.y - 100);
      maxX = Math.max(maxX, node.position.x + 150);
      maxY = Math.max(maxY, node.position.y + 100);
    });

    return {
      minX: minX || 0,
      minY: minY || 0,
      width: (maxX - minX) || 1000,
      height: (maxY - minY) || 800,
    };
  };

  const viewBox = calculateViewBox();

  return (
    <motion.div
      key="graph-view"
      initial={{ 
        opacity: 0, 
        rotateX: 25,
        y: 100,
        filter: 'blur(10px)'
      }}
      animate={{ 
        opacity: 1, 
        rotateX: 0,
        y: 0,
        filter: 'blur(0px)'
      }}
      exit={{ 
        opacity: 0, 
        rotateX: -15,
        y: -50,
        filter: 'blur(8px)'
      }}
      transition={{ 
        duration: 0.6, 
        ease: [0.16, 1, 0.3, 1],
        opacity: { duration: 0.5 },
        filter: { duration: 0.4 }
      }}
      style={{ 
        transformOrigin: 'center top',
        perspective: '1200px',
        transformStyle: 'preserve-3d'
      }}
      className="w-full h-screen"
    >
      <div
        ref={containerRef}
        className="relative w-full h-full overflow-auto bg-[#1c1c1c] custom-scrollbar"
        onWheel={handleWheel}
      >
      {/* SVG for connections */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#4f4f4f" />
          </marker>
        </defs>
        
        {/* Draw connections */}
        {Array.from(nodes.values()).map((node) =>
          node.children.map((childId, childIndex) => {
            const childNode = nodes.get(childId);
            if (!childNode) return null;

            const isActiveConnection =
              node.id === activeNodeId || childId === activeNodeId;

            // Check if this is the animating branch
            const isAnimatingBranch = 
              branchAnimation.isAnimating &&
              node.id === branchAnimation.parentNodeId &&
              childId === branchAnimation.newNodeId;

            // Calculate midpoint for label
            const midX = node.position.x + (childNode.position.x - node.position.x) / 2;
            const midY = node.position.y + (childNode.position.y - node.position.y) / 2;

            // Determine animation state for this connection
            const shouldAnimate = isAnimatingBranch && 
              (branchAnimation.stage === 'drawing_branch' || branchAnimation.stage === 'flowing_context' || branchAnimation.stage === 'expanding_node');
            
            const pathLength = shouldAnimate && branchAnimation.stage === 'drawing_branch' ? 0 : 1;
            const animatePathLength = shouldAnimate ? 1 : pathLength;

            return (
              <g key={`${node.id}-${childId}`}>
                <motion.path
                  d={generatePath(node.position, childNode.position)}
                  stroke={isActiveConnection || isAnimatingBranch ? '#3b82f6' : '#5f5f5f'}
                  strokeWidth={isActiveConnection || isAnimatingBranch ? 3 : 2}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: isAnimatingBranch ? 0 : 0, opacity: isAnimatingBranch ? 1 : 0 }}
                  animate={{ 
                    pathLength: animatePathLength, 
                    opacity: 1 
                  }}
                  transition={{ 
                    pathLength: { duration: isAnimatingBranch && branchAnimation.stage === 'drawing_branch' ? 0.5 : 0.5, ease: 'easeInOut' },
                    opacity: { duration: 0.3 }
                  }}
                />
                {/* Add a circle at connection point */}
                <circle
                  cx={childNode.position.x - 110 - 15}
                  cy={childNode.position.y}
                  r="4"
                  fill={isActiveConnection || isAnimatingBranch ? '#3b82f6' : '#5f5f5f'}
                />
                {/* Branch label */}
                <text
                  x={midX}
                  y={midY - 10}
                  fill={isActiveConnection || isAnimatingBranch ? '#60a5fa' : '#8b8b8b'}
                  fontSize="11"
                  fontWeight="500"
                  textAnchor="middle"
                  className="select-none"
                  style={{ pointerEvents: 'none' }}
                >
                  Branch {childIndex + 1}
                </text>

                {/* Flowing context particles animation */}
                {isAnimatingBranch && branchAnimation.stage === 'flowing_context' && (
                  <>
                    {[0, 0.25, 0.5, 0.75, 1.0].map((delay, idx) => {
                      // Use same spacing calculations as generatePath
                      const nodeWidth = 220;
                      const connectionGap = 15;
                      const horizontalExtension = 80;
                      
                      const startX = node.position.x + (nodeWidth / 2) + connectionGap;
                      const endX = childNode.position.x - (nodeWidth / 2) - connectionGap;
                      const startY = node.position.y;
                      const endY = childNode.position.y;
                      const firstCornerX = startX + horizontalExtension;

                      return (
                        <motion.circle
                          key={`particle-${idx}`}
                          r="6"
                          fill="url(#particleGradient)"
                          filter="url(#glow)"
                          initial={{
                            cx: startX,
                            cy: startY,
                            opacity: 0,
                          }}
                          animate={{
                            cx: [startX, firstCornerX, firstCornerX, endX],
                            cy: [startY, startY, endY, endY],
                            opacity: [0, 1, 1, 0],
                          }}
                          transition={{
                            duration: 1.5,
                            delay: delay,
                            ease: 'easeInOut',
                          }}
                        />
                      );
                    })}
                  </>
                )}
              </g>
            );
          })
        )}

        {/* Gradient and filter definitions for particles */}
        <defs>
          <radialGradient id="particleGradient">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="1" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.3" />
          </radialGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* Nodes */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <AnimatePresence>
          {Array.from(nodes.values()).map((node) => {
            const isNewAnimatingNode = 
              branchAnimation.isAnimating &&
              node.id === branchAnimation.newNodeId;

            const shouldExpand = isNewAnimatingNode && branchAnimation.stage === 'expanding_node';
            const isActivating = activatingNodeId === node.id;

            return (
              <motion.div
                key={node.id}
                className="graph-node"
                initial={{ 
                  opacity: isNewAnimatingNode ? 0 : 1, 
                  scale: isNewAnimatingNode ? 0 : 1 
                }}
                animate={{ 
                  opacity: 1, 
                  scale: isActivating ? [1, 1.2, 1] : shouldExpand ? [0, 1.15, 1] : 1,
                  filter: shouldExpand ? [
                    'drop-shadow(0 0 0px rgba(59, 130, 246, 0))',
                    'drop-shadow(0 0 20px rgba(59, 130, 246, 0.8))',
                    'drop-shadow(0 0 10px rgba(59, 130, 246, 0.4))',
                  ] : 'drop-shadow(0 0 0px rgba(59, 130, 246, 0))',
                }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ 
                  duration: isActivating ? 0.4 : shouldExpand ? 0.4 : 0.3,
                  ease: isActivating ? 'easeInOut' : shouldExpand ? 'easeOut' : 'easeInOut',
                }}
              >
                <ChatNode
                  node={node}
                  isActive={node.id === activeNodeId}
                  onClick={() => handleNodeActivationClick(node.id)}
                  scale={1}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Mini-map */}
      <div 
        className="absolute bottom-6 right-6 bg-[#2f2f2f]/90 border border-[#3f3f3f] rounded-lg p-3 backdrop-blur-sm pointer-events-auto"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="text-xs text-gray-400 mb-2">Graph Overview</div>
        <svg width="150" height="100" className="border border-[#4f4f4f] rounded">
          <g transform={`translate(75, 50)`}>
            {/* Draw mini connections */}
            {Array.from(nodes.values()).map((node) =>
              node.children.map((childId) => {
                const childNode = nodes.get(childId);
                if (!childNode) return null;

                const fromX = node.position.x / 30;
                const fromY = node.position.y / 30;
                const toX = childNode.position.x / 30;
                const toY = childNode.position.y / 30;
                const midX = fromX + (toX - fromX) / 2;

                return (
                  <path
                    key={`mini-${node.id}-${childId}`}
                    d={`M ${fromX} ${fromY} L ${midX} ${fromY} L ${midX} ${toY} L ${toX} ${toY}`}
                    stroke="#5f5f5f"
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                );
              })
            )}
            
            {/* Draw mini nodes */}
            {Array.from(nodes.values()).map((node) => (
              <circle
                key={`mini-${node.id}`}
                cx={node.position.x / 30}
                cy={node.position.y / 30}
                r={node.id === activeNodeId ? 4 : 3}
                fill={node.id === activeNodeId ? '#3b82f6' : '#6b7280'}
              />
            ))}
          </g>
        </svg>
      </div>

      {/* Controls */}
      <div 
        className="absolute top-6 left-6 flex flex-col gap-2 pointer-events-auto"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setZoom(Math.min(zoom + 0.1, 2))}
          className="bg-[#2f2f2f] hover:bg-[#3f3f3f] border border-[#4f4f4f] text-white p-2 rounded-lg transition-colors"
          title="Zoom In"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          onClick={() => setZoom(Math.max(zoom - 0.1, 0.3))}
          className="bg-[#2f2f2f] hover:bg-[#3f3f3f] border border-[#4f4f4f] text-white p-2 rounded-lg transition-colors"
          title="Zoom Out"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button
          onClick={() => {
            // Reset to initial view
            if (initialPanRef.current) {
              setPan(initialPanRef.current);
              setZoom(initialZoomRef.current);
            }
          }}
          className="bg-[#2f2f2f] hover:bg-[#3f3f3f] border border-[#4f4f4f] text-white p-2 rounded-lg transition-colors"
          title="Reset View"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* Zoom indicator */}
      <div 
        className="absolute bottom-6 left-6 bg-[#2f2f2f]/90 border border-[#3f3f3f] rounded-lg px-3 py-2 backdrop-blur-sm pointer-events-auto"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <span className="text-xs text-gray-400">Zoom: {Math.round(zoom * 100)}%</span>
      </div>
    </div>
    </motion.div>
  );
}

