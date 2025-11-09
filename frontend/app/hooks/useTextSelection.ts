'use client';

import { useState, useEffect } from 'react';

interface SelectionPosition {
  x: number;
  y: number;
}

type BranchState = 'idle' | 'selecting' | 'ready_to_branch';

export function useTextSelection(branchState: BranchState) {
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionPosition, setSelectionPosition] = useState<SelectionPosition | null>(null);

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

  // Event listener
  useEffect(() => {
    document.addEventListener('mouseup', handleTextSelection);
    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchState]);

  return {
    selectedText,
    setSelectedText,
    selectionPosition,
    setSelectionPosition,
  };
}

