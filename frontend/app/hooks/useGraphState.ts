'use client';

import { useState, useEffect } from 'react';
import { GraphState, ChatNode, createNode } from '../types/graph';
import { calculateTreeLayout, centerTree } from '../utils/graphLayout';

export function useGraphState() {
  const [graphState, setGraphState] = useState<GraphState>({
    nodes: new Map(),
    activeNodeId: null,
    rootNodeId: null,
  });

  // Initialize root node if empty
  useEffect(() => {
    if (graphState.nodes.size === 0) {
      const rootNode = createNode('root', null, 'Start conversation', [], null, false);
      const newNodes = new Map([[rootNode.id, rootNode]]);
      
      setGraphState({
        nodes: newNodes,
        activeNodeId: rootNode.id,
        rootNodeId: rootNode.id,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update layout when graph structure changes
  useEffect(() => {
    if (graphState.rootNodeId && graphState.nodes.size > 0) {
      // Always recalculate layout when graph structure changes
      const positions = calculateTreeLayout(graphState.nodes, graphState.rootNodeId);
      centerTree(positions);
      
      const updatedNodes = new Map(graphState.nodes);
      let hasChanges = false;
      
      positions.forEach((position, nodeId) => {
        const node = updatedNodes.get(nodeId);
        if (node && (node.position.x !== position.x || node.position.y !== position.y)) {
          updatedNodes.set(nodeId, { ...node, position });
          hasChanges = true;
        }
      });
      
      if (hasChanges) {
        setGraphState((prev) => ({
          ...prev,
          nodes: updatedNodes,
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphState.nodes.size, graphState.rootNodeId]);

  // Get active node
  const activeNode = graphState.activeNodeId
    ? graphState.nodes.get(graphState.activeNodeId)
    : null;

  return {
    graphState,
    setGraphState,
    activeNode,
  };
}

