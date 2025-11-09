'use client';

import { useState, useEffect } from 'react';

type ViewMode = 'focused' | 'graph';

interface BranchAnimationState {
  isAnimating: boolean;
  stage: 'idle' | 'switching_to_graph' | 'drawing_branch' | 'flowing_context' | 'expanding_node' | 'returning_to_focus';
  newNodeId: string | null;
  parentNodeId: string | null;
}

export function useBranchAnimation() {
  const [viewMode, setViewMode] = useState<ViewMode>('focused');
  const [branchAnimation, setBranchAnimation] = useState<BranchAnimationState>({
    isAnimating: false,
    stage: 'idle',
    newNodeId: null,
    parentNodeId: null,
  });

  // Animation orchestration effect
  useEffect(() => {
    if (!branchAnimation.isAnimating) return;

    let timeoutId: NodeJS.Timeout;

    switch (branchAnimation.stage) {
      case 'switching_to_graph':
        // Switch to graph view (300ms fade)
        setViewMode('graph');
        timeoutId = setTimeout(() => {
          setBranchAnimation(prev => ({ ...prev, stage: 'drawing_branch' }));
        }, 300);
        break;

      case 'drawing_branch':
        // Branch line drawing (500ms) + context flowing starts after 200ms
        timeoutId = setTimeout(() => {
          setBranchAnimation(prev => ({ ...prev, stage: 'flowing_context' }));
        }, 500);
        break;

      case 'flowing_context':
        // Context particles flow (1.5s duration + 1.0s max delay = 2.5s total)
        timeoutId = setTimeout(() => {
          setBranchAnimation(prev => ({ ...prev, stage: 'expanding_node' }));
        }, 2000);
        break;

      case 'expanding_node':
        // Node expansion (400ms) + brief pause (200ms)
        timeoutId = setTimeout(() => {
          setBranchAnimation(prev => ({ ...prev, stage: 'returning_to_focus' }));
        }, 600);
        break;

      case 'returning_to_focus':
        // Return to focused view
        setViewMode('focused');
        timeoutId = setTimeout(() => {
          setBranchAnimation({
            isAnimating: false,
            stage: 'idle',
            newNodeId: null,
            parentNodeId: null,
          });
        }, 300);
        break;
    }

    return () => clearTimeout(timeoutId);
  }, [branchAnimation]);

  // Helper to toggle view mode manually
  const toggleViewMode = () => {
    setViewMode((prev) => (prev === 'focused' ? 'graph' : 'focused'));
  };

  return {
    viewMode,
    setViewMode,
    branchAnimation,
    setBranchAnimation,
    toggleViewMode,
  };
}

