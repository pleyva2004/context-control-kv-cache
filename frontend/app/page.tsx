'use client';

import { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import LlamaCppInterface from './components/llama';

export default function Home() {
  const [modelName, setModelName] = useState<string>('Llama-3.2-3B-Instruct-Q4_K_M.gguf');
  const [ctx, setCtx] = useState<number>(4096);
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  // In a real implementation, you would fetch this from the backend
  // For now, we'll use the model from the backend/app.py
  useEffect(() => {
    // This could be fetched from an API endpoint that lists available models
    // For now, we'll use the hardcoded model from the backend
    const models = ['Llama-3.2-3B-Instruct-Q4_K_M.gguf'];
    setAvailableModels(models);
  }, []);

  return (
    <main className="min-h-screen bg-[#1c1c1c] text-white">
      <ChatInterface modelName={modelName} ctx={ctx} />
    </main>
  );
}
