'use client';

import { useState } from 'react';

interface ModelSelectorProps {
  currentModel: string;
  ctx: number;
  onModelChange?: (model: string) => void;
  onCtxChange?: (ctx: number) => void;
}

export default function ModelSelector({ currentModel, ctx, onModelChange, onCtxChange }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Model and CTX badges */}
      <div className="flex items-center justify-center gap-[10px]">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-[8px] bg-[#353535] border-0 rounded-full pl-[14px] pr-[16px] py-[8px] hover:bg-[#404040] transition-colors cursor-pointer"
        >
          <svg className="w-[14px] h-[14px] text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <span className="text-[13px] text-white font-normal">{currentModel}</span>
        </button>
        <div className="bg-[#353535] border-0 rounded-full px-[16px] py-[8px]">
          <span className="text-[13px] text-white font-normal">ctx: {ctx.toLocaleString()}</span>
        </div>
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-full mt-[14px] left-1/2 transform -translate-x-1/2 bg-[#2d2d2d] border-0 rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)] p-[20px] z-50 w-[420px]">
          <h3 className="text-[13px] font-semibold text-white mb-[16px] tracking-tight">Model Settings</h3>
          
          <div className="space-y-[14px]">
            <div>
              <label className="text-[11px] text-[#888888] block mb-[8px] font-medium tracking-wide">MODEL</label>
              <div className="bg-[#232323] border-0 rounded-[10px] px-[14px] py-[12px] shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
                <p className="text-[13px] text-[#d0d0d0] break-all leading-relaxed">{currentModel}</p>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-[#888888] block mb-[8px] font-medium tracking-wide">CONTEXT WINDOW</label>
              <div className="bg-[#232323] border-0 rounded-[10px] px-[14px] py-[12px] shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
                <p className="text-[13px] text-[#d0d0d0]">{ctx.toLocaleString()} tokens</p>
              </div>
            </div>

            <div className="pt-[14px] border-t border-[#3d3d3d]">
              <p className="text-[11px] text-[#6b6b6b] leading-[1.6] tracking-wide">
                Model settings are configured in the backend. To change models or context window, 
                modify the backend configuration.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="mt-[16px] w-full bg-[#3d3d3d] hover:bg-[#4a4a4a] text-white text-[13px] py-[10px] rounded-[10px] transition-colors font-medium"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

