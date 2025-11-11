'use client';

import ChatInterface from './components/ChatInterface';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#1c1c1c] text-white">
      <ChatInterface
        modelName="Llama-3.2-3B-Instruct"
        ctx={8192}
      />
    </main>
  );
}
