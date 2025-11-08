import { ChatNode, NodePosition } from '../types/graph';

// Configuration for layout
const HORIZONTAL_SPACING = 300; // Distance between levels (x-axis)
const VERTICAL_SPACING = 150; // Minimum distance between siblings (y-axis)
const NODE_HEIGHT = 80; // Height of each node for spacing calculations

interface TreeNode {
  id: string;
  children: TreeNode[];
  node: ChatNode;
  y: number; // Final y position
  prelim: number; // Preliminary x position
  mod: number; // Modifier value
  thread?: TreeNode | null; // Thread for contour
  ancestor: TreeNode; // Ancestor for apportion
  change: number; // Change value
  shift: number; // Shift value
  number: number; // Child number
}

/**
 * Calculate positions for all nodes in a horizontal tree layout
 * Root is on the left, branches grow to the right
 */
export function calculateTreeLayout(
  nodes: Map<string, ChatNode>,
  rootId: string
): Map<string, NodePosition> {
  const positions = new Map<string, NodePosition>();
  
  if (!rootId || !nodes.has(rootId)) {
    return positions;
  }

  // Build tree structure
  const treeRoot = buildTree(rootId, nodes);
  
  if (!treeRoot) {
    return positions;
  }

  // Calculate layout using modified Reingold-Tilford algorithm
  // This algorithm ensures no overlaps and centered positioning
  firstWalk(treeRoot);
  secondWalk(treeRoot, 0, 0);
  
  // Convert tree positions to map
  flattenPositions(treeRoot, positions);
  
  return positions;
}

/**
 * Build a tree structure from the graph nodes
 */
function buildTree(
  nodeId: string,
  nodes: Map<string, ChatNode>,
  childNumber: number = 0
): TreeNode | null {
  const node = nodes.get(nodeId);
  
  if (!node) {
    return null;
  }

  const treeNode: TreeNode = {
    id: nodeId,
    children: [],
    node,
    y: 0,
    prelim: 0,
    mod: 0,
    ancestor: null as any, // Will be set to self
    change: 0,
    shift: 0,
    number: childNumber,
  };
  
  treeNode.ancestor = treeNode;

  // Recursively build children
  node.children.forEach((childId, index) => {
    const child = buildTree(childId, nodes, index);
    if (child) {
      treeNode.children.push(child);
    }
  });

  return treeNode;
}

/**
 * First walk of the tree - calculate preliminary positions
 */
function firstWalk(node: TreeNode, distance: number = 1): void {
  if (node.children.length === 0) {
    // Leaf node
    if (node.number === 0) {
      node.prelim = 0;
    } else {
      const leftSibling = getLeftSibling(node);
      if (leftSibling) {
        node.prelim = leftSibling.prelim + distance;
      }
    }
  } else {
    // Internal node
    let defaultAncestor = node.children[0];
    
    node.children.forEach((child) => {
      firstWalk(child, distance);
      defaultAncestor = apportion(child, defaultAncestor, distance);
    });
    
    executeShifts(node);
    
    const midpoint =
      (node.children[0].prelim + node.children[node.children.length - 1].prelim) / 2;
    
    const leftSibling = getLeftSibling(node);
    if (leftSibling) {
      node.prelim = leftSibling.prelim + distance;
      node.mod = node.prelim - midpoint;
    } else {
      node.prelim = midpoint;
    }
  }
}

/**
 * Second walk - finalize positions with modifiers
 */
function secondWalk(node: TreeNode, m: number, depth: number): void {
  node.y = node.prelim + m;
  
  // For horizontal layout: x is depth-based, y is the calculated position
  // Swap x and y since we want horizontal tree (root on left)
  
  node.children.forEach((child) => {
    secondWalk(child, m + node.mod, depth + 1);
  });
}

/**
 * Apportion - distribute space between subtrees
 */
function apportion(
  node: TreeNode,
  defaultAncestor: TreeNode,
  distance: number
): TreeNode {
  const leftSibling = getLeftSibling(node);
  
  if (leftSibling) {
    let vInnerRight = node;
    let vOuterRight = node;
    let vInnerLeft = leftSibling;
    let vOuterLeft = vInnerRight; // First sibling
    
    let sInnerRight = vInnerRight.mod;
    let sOuterRight = vOuterRight.mod;
    let sInnerLeft = vInnerLeft.mod;
    let sOuterLeft = vOuterLeft.mod;
    
    while (nextRight(vInnerLeft) && nextLeft(vInnerRight)) {
      vInnerLeft = nextRight(vInnerLeft)!;
      vInnerRight = nextLeft(vInnerRight)!;
      vOuterLeft = nextLeft(vOuterLeft)!;
      vOuterRight = nextRight(vOuterRight)!;
      
      vOuterRight.ancestor = node;
      
      const shift =
        vInnerLeft.prelim +
        sInnerLeft -
        (vInnerRight.prelim + sInnerRight) +
        distance;
      
      if (shift > 0) {
        moveSubtree(ancestor(vInnerLeft, node, defaultAncestor), node, shift);
        sInnerRight += shift;
        sOuterRight += shift;
      }
      
      sInnerLeft += vInnerLeft.mod;
      sInnerRight += vInnerRight.mod;
      sOuterLeft += vOuterLeft.mod;
      sOuterRight += vOuterRight.mod;
    }
    
    if (nextRight(vInnerLeft) && !nextRight(vOuterRight)) {
      vOuterRight.thread = nextRight(vInnerLeft);
      vOuterRight.mod += sInnerLeft - sOuterRight;
    }
    
    if (nextLeft(vInnerRight) && !nextLeft(vOuterLeft)) {
      vOuterLeft.thread = nextLeft(vInnerRight);
      vOuterLeft.mod += sInnerRight - sOuterLeft;
      defaultAncestor = node;
    }
  }
  
  return defaultAncestor;
}

/**
 * Move a subtree
 */
function moveSubtree(wLeft: TreeNode, wRight: TreeNode, shift: number): void {
  const subtrees = wRight.number - wLeft.number;
  wRight.change -= shift / subtrees;
  wRight.shift += shift;
  wLeft.change += shift / subtrees;
  wRight.prelim += shift;
  wRight.mod += shift;
}

/**
 * Execute shifts
 */
function executeShifts(node: TreeNode): void {
  let shift = 0;
  let change = 0;
  
  for (let i = node.children.length - 1; i >= 0; i--) {
    const child = node.children[i];
    child.prelim += shift;
    child.mod += shift;
    change += child.change;
    shift += child.shift + change;
  }
}

/**
 * Get ancestor
 */
function ancestor(
  vInnerLeft: TreeNode,
  node: TreeNode,
  defaultAncestor: TreeNode
): TreeNode {
  // Check if vInnerLeft.ancestor is a sibling of node
  const parent = getParent(node);
  if (parent && parent.children.includes(vInnerLeft.ancestor)) {
    return vInnerLeft.ancestor;
  }
  return defaultAncestor;
}

/**
 * Get next right contour node
 */
function nextRight(node: TreeNode): TreeNode | null {
  if (node.children.length > 0) {
    return node.children[node.children.length - 1];
  }
  return node.thread || null;
}

/**
 * Get next left contour node
 */
function nextLeft(node: TreeNode): TreeNode | null {
  if (node.children.length > 0) {
    return node.children[0];
  }
  return node.thread || null;
}

/**
 * Get left sibling
 */
function getLeftSibling(node: TreeNode): TreeNode | null {
  const parent = getParent(node);
  if (!parent) return null;
  
  const index = parent.children.indexOf(node);
  if (index > 0) {
    return parent.children[index - 1];
  }
  return null;
}

/**
 * Get parent (helper - stores reference during tree building)
 */
let parentMap = new Map<TreeNode, TreeNode>();

function getParent(node: TreeNode): TreeNode | null {
  return parentMap.get(node) || null;
}

/**
 * Flatten tree positions into a map
 */
function flattenPositions(
  node: TreeNode,
  positions: Map<string, NodePosition>,
  depth: number = 0,
  parent: TreeNode | null = null
): void {
  if (parent) {
    parentMap.set(node, parent);
  }
  
  // For horizontal layout: x increases with depth, y is the calculated position
  positions.set(node.id, {
    x: depth * HORIZONTAL_SPACING,
    y: node.y * VERTICAL_SPACING,
  });
  
  node.children.forEach((child) => {
    flattenPositions(child, positions, depth + 1, node);
  });
}

/**
 * Calculate bounding box of all nodes
 */
export function calculateBoundingBox(
  positions: Map<string, NodePosition>
): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  positions.forEach((pos) => {
    minX = Math.min(minX, pos.x);
    minY = Math.min(minY, pos.y);
    maxX = Math.max(maxX, pos.x);
    maxY = Math.max(maxY, pos.y);
  });
  
  return { minX, minY, maxX, maxY };
}

/**
 * Center the tree around (0, 0)
 */
export function centerTree(positions: Map<string, NodePosition>): void {
  const bbox = calculateBoundingBox(positions);
  const centerY = (bbox.minY + bbox.maxY) / 2;
  
  positions.forEach((pos, id) => {
    positions.set(id, {
      x: pos.x,
      y: pos.y - centerY,
    });
  });
}

