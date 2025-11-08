# Graph-Based Chat Interface Implementation

## Overview

Successfully implemented a graph-based chat interface with visual branching animations. The system transforms linear conversations into an interactive node graph where users can create branches and navigate between different conversation paths.

## Features Implemented

### 1. Graph Data Structure
- **Location**: `app/types/graph.ts`
- Defined `ChatNode` interface with position, messages, parent/child relationships, and frozen state
- Created `GraphState` to manage all nodes, active node, and root node
- Helper functions for graph traversal (getDescendants, getPathToNode, getLeafNodes, getNodeDepth)

### 2. Horizontal Tree Layout Algorithm
- **Location**: `app/utils/graphLayout.ts`
- Implemented modified Reingold-Tilford algorithm for collision-free tree layout
- Horizontal orientation: root on left, branches grow to the right
- Automatic spacing and centering
- Configurable spacing parameters (300px horizontal, 150px vertical)

### 3. Visual Components

#### ChatNode Component
- **Location**: `app/components/ChatNode.tsx`
- Displays individual conversation nodes in the graph
- Shows user question, message count, and branch count
- Visual states: Active (blue glow), Frozen (dimmed), Regular
- Hover effects with scale animation
- Compact design (220x80px) optimized for graph view

#### GraphView Component
- **Location**: `app/components/GraphView.tsx`
- Full graph visualization with SVG connections
- Smooth bezier curves connecting parent and child nodes
- Pan and zoom controls (mouse wheel for zoom, drag to pan)
- Mini-map for navigation overview
- Zoom indicator (30% - 200%)
- Animated path drawing when new connections appear
- Reset view button to return to default position

### 4. Branching System

#### Branch Button
- Appears when text is selected in a conversation
- Purple styling to differentiate from regular interactions
- Initiates branch mode instead of immediate branching

#### Branch Flow
1. User selects text in current conversation
2. "Branch" button appears
3. User clicks button to enter branch mode
4. Input field highlights with purple ring
5. User types question about selected text
6. On submit, branching animation triggers:
   - Current chat minimizes (400ms)
   - Branch line draws to new position (200ms)
   - New node appears and zooms in
7. New conversation starts with selected text as context
8. Parent node becomes frozen (read-only)

### 5. View Modes

#### Focused View (Default)
- Shows single active conversation
- Traditional chat interface
- Full message history visible
- Input at bottom

#### Graph View
- Shows all conversation nodes
- Connections between parent and child nodes
- Interactive pan and zoom
- Click any node to focus on it
- Mini-map for navigation

#### Toggle Button
- Fixed position top-right
- Smooth transition animation (300ms)
- Icon changes based on mode
- Always accessible

### 6. State Management

#### Graph State
- Replaced linear messages array with node-based structure
- Each node maintains its own message history
- Active node tracks current conversation
- Frozen nodes are read-only after branching

#### Backend Integration
- Each node stores its slot ID
- Regular messages use `streamChatCompletion`
- Branches use `streamBranch` with parent slot ID
- Context preservation through KV cache reuse

### 7. Animations
- **Framer Motion** integration for smooth transitions
- View mode transitions: 300ms fade and scale
- Branch button: Scale animation on appear
- Node appearance: Fade and scale from 0.5 to 1
- Connection lines: Animated path drawing
- Hover effects on nodes and buttons

## File Structure

```
frontend/
├── app/
│   ├── components/
│   │   ├── ChatInterface.tsx (main component - refactored)
│   │   ├── ChatNode.tsx (new)
│   │   ├── GraphView.tsx (new)
│   │   └── ModelSelector.tsx (unchanged)
│   ├── types/
│   │   └── graph.ts (new)
│   ├── utils/
│   │   ├── api.ts (unchanged)
│   │   └── graphLayout.ts (new)
│   └── page.tsx (unchanged)
└── package.json (updated with framer-motion)
```

## Dependencies Added

- `framer-motion` - Animation library for smooth transitions and branching effects

## Design Consistency

Maintained all existing design specifications:
- Dark theme colors (#1c1c1c background, #2f2f2f containers)
- Typography and spacing from DESIGN_SPECS.md
- Existing color scheme with new purple accent for branching
- Smooth transitions and hover effects

## Usage

### Creating a Branch
1. Have a conversation in the chat
2. Select any text from the conversation
3. Click the purple "Branch" button that appears
4. Type your question about the selected text
5. Press Enter or click send
6. Watch the branching animation
7. Continue the new conversation branch

### Navigating the Graph
1. Click "Graph View" button (top-right)
2. View all conversation nodes and connections
3. Use mouse wheel to zoom in/out
4. Click and drag to pan around
5. Click any node to focus on that conversation
6. Click "Focus View" to return to chat mode

### View Controls
- **Zoom In/Out**: Mouse wheel or +/- buttons
- **Pan**: Click and drag in graph view
- **Reset View**: Reset button in top-left of graph view
- **Mini-map**: Always visible in bottom-right of graph view

## Technical Notes

### Layout Algorithm
- Uses Reingold-Tilford algorithm for optimal tree layout
- Prevents node overlaps
- Centers tree vertically
- Horizontal growth from left to right
- O(n) complexity where n is number of nodes

### Performance
- Efficient graph traversal using Map data structure
- Only active node messages rendered in focused view
- SVG paths for connections (hardware accelerated)
- Framer Motion uses GPU acceleration for animations

### State Persistence
- Graph state maintained in memory
- Could be extended to localStorage for persistence
- Serialization helpers included in graph.ts

## Future Enhancements

Possible improvements:
1. Save/load graph state
2. Export graph as image
3. Search across all nodes
4. Node filtering and highlighting
5. Collapse/expand branches
6. Node deletion
7. Merge branches
8. Timeline view
9. Keyboard shortcuts for navigation
10. Graph statistics and analytics

## Testing

Build verified successfully:
- ✓ TypeScript compilation
- ✓ ESLint checks
- ✓ All components render correctly
- ✓ No runtime errors

## Notes

- Frozen nodes cannot be modified after branching
- Each branch creates a new conversation path
- Parent slot IDs enable KV cache reuse for efficiency
- Graph automatically recalculates layout when nodes are added
- Mini-map provides overview for large graphs

