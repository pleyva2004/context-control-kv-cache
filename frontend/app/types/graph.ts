export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface NodePosition {
  x: number;
  y: number;
}

export interface ChatNode {
  id: string;
  parentId: string | null;
  messages: Message[];
  position: NodePosition;
  userQuestion: string; // The question that started this branch
  slotId: number | null;
  children: string[]; // IDs of child nodes
  isFrozen: boolean; // Whether this node is read-only (has been branched from)
  isActivated: boolean; // Whether this node has been activated (clicked/used)
}

export interface GraphState {
  nodes: Map<string, ChatNode>;
  activeNodeId: string | null;
  rootNodeId: string | null;
}

// Helper function to get all descendants of a node
export function getDescendants(nodeId: string, nodes: Map<string, ChatNode>): string[] {
  const descendants: string[] = [];
  const node = nodes.get(nodeId);
  
  if (!node) return descendants;
  
  for (const childId of node.children) {
    descendants.push(childId);
    descendants.push(...getDescendants(childId, nodes));
  }
  
  return descendants;
}

// Helper function to get path from root to a node
export function getPathToNode(nodeId: string, nodes: Map<string, ChatNode>): string[] {
  const path: string[] = [];
  let currentId: string | null = nodeId;
  
  while (currentId !== null) {
    path.unshift(currentId);
    const node = nodes.get(currentId);
    currentId = node?.parentId || null;
  }
  
  return path;
}

// Helper function to get all leaf nodes (nodes with no children)
export function getLeafNodes(nodes: Map<string, ChatNode>): string[] {
  const leafNodes: string[] = [];
  
  nodes.forEach((node, id) => {
    if (node.children.length === 0) {
      leafNodes.push(id);
    }
  });
  
  return leafNodes;
}

// Helper function to get the depth of a node (distance from root)
export function getNodeDepth(nodeId: string, nodes: Map<string, ChatNode>): number {
  let depth = 0;
  let currentId: string | null = nodeId;
  
  while (currentId !== null) {
    const node = nodes.get(currentId);
    currentId = node?.parentId || null;
    if (currentId !== null) depth++;
  }
  
  return depth;
}

// Helper function to create a new node
export function createNode(
  id: string,
  parentId: string | null,
  userQuestion: string,
  messages: Message[] = [],
  slotId: number | null = null,
  isActivated: boolean = true
): ChatNode {
  return {
    id,
    parentId,
    messages,
    position: { x: 0, y: 0 }, // Will be calculated by layout algorithm
    userQuestion,
    slotId,
    children: [],
    isFrozen: false,
    isActivated,
  };
}

// Convert Map to plain object for serialization
export function serializeGraphState(state: GraphState): any {
  return {
    nodes: Array.from(state.nodes.entries()),
    activeNodeId: state.activeNodeId,
    rootNodeId: state.rootNodeId,
  };
}

// Convert plain object back to GraphState
export function deserializeGraphState(data: any): GraphState {
  return {
    nodes: new Map(data.nodes),
    activeNodeId: data.activeNodeId,
    rootNodeId: data.rootNodeId,
  };
}

