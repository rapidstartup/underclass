"use client";

import { motion } from "framer-motion";

interface Props {
  prompt: string;
  optionA: string;
  optionB: string;
  onChoice?: (choice: string) => void;
  disabled?: boolean;
}

export function Choice({ prompt, optionA, optionB, onChoice, disabled }: Props) {
  return (
    <motion.div
      className="my-12 py-8 border-t border-b border-white/10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
        <span className="text-[11px] uppercase tracking-[0.2em] text-white/30 font-semibold">Choose your path</span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
      </div>

      {prompt && (
        <p className="text-base text-white/60 mb-6 text-center max-w-lg mx-auto leading-relaxed">{prompt}</p>
      )}

      <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
        <button
          onClick={() => onChoice?.(optionA)}
          disabled={disabled}
          className="flex-1 group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] px-6 py-5 text-left transition-all duration-300 hover:border-cyan-400/30 hover:bg-cyan-400/[0.05] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 to-cyan-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="text-[11px] uppercase tracking-wider text-cyan-400/50 font-semibold mb-2 block">Path A</span>
          <span className="text-[15px] text-white/85 font-medium leading-snug relative z-10">{optionA || "Option A"}</span>
        </button>
        <button
          onClick={() => onChoice?.(optionB)}
          disabled={disabled}
          className="flex-1 group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] px-6 py-5 text-left transition-all duration-300 hover:border-purple-400/30 hover:bg-purple-400/[0.05] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/0 to-purple-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="text-[11px] uppercase tracking-wider text-purple-400/50 font-semibold mb-2 block">Path B</span>
          <span className="text-[15px] text-white/85 font-medium leading-snug relative z-10">{optionB || "Option B"}</span>
        </button>
      </div>
    </motion.div>
  );
}
