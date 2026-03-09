"use client";

import { motion } from "framer-motion";

interface Props {
  prompt?: string;
  optionA?: string;
  optionB?: string;
  onChoice?: (choice: string) => void;
  disabled?: boolean;
  selected?: string;
}

export function Choice({ prompt, optionA, optionB, onChoice, disabled, selected }: Props) {
  const safeA = optionA || "Option A";
  const safeB = optionB || "Option B";
  const isA = selected === safeA;
  const isB = selected === safeB;
  const hasSelected = !!selected;

  return (
    <motion.div
      className="my-12 py-8 border-t border-b border-white/10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
        <span className="text-[11px] uppercase tracking-[0.2em] text-white/30 font-semibold">
          {hasSelected ? "Path chosen" : "Choose your path"}
        </span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
      </div>

      {prompt && (
        <p className={`text-base mb-6 text-center max-w-lg mx-auto leading-relaxed ${hasSelected ? "text-white/30" : "text-white/60"}`}>
          {prompt}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
        {/* Path A */}
        <button
          onClick={() => !hasSelected && onChoice?.(safeA)}
          disabled={disabled || hasSelected}
          className={`flex-1 group relative overflow-hidden rounded-xl border px-6 py-5 text-left transition-all duration-300 ${
            isA
              ? "border-cyan-400/40 bg-cyan-400/[0.08]"
              : hasSelected
                ? "border-white/5 bg-white/[0.01] opacity-40"
                : "border-white/10 bg-white/[0.03] hover:border-cyan-400/30 hover:bg-cyan-400/[0.05] cursor-pointer"
          } ${hasSelected ? "cursor-default" : "disabled:opacity-30 disabled:cursor-not-allowed"}`}
        >
          {!hasSelected && (
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 to-cyan-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[11px] uppercase tracking-wider font-semibold ${isA ? "text-cyan-400" : "text-cyan-400/50"}`}>
              Path A
            </span>
            {isA && (
              <motion.span
                className="text-[10px] uppercase tracking-wider text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full font-semibold"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                Selected
              </motion.span>
            )}
          </div>
          <span className={`text-[15px] font-medium leading-snug relative z-10 ${isA ? "text-white/90" : hasSelected ? "text-white/40" : "text-white/85"}`}>
            {safeA}
          </span>
        </button>

        {/* Path B */}
        <button
          onClick={() => !hasSelected && onChoice?.(safeB)}
          disabled={disabled || hasSelected}
          className={`flex-1 group relative overflow-hidden rounded-xl border px-6 py-5 text-left transition-all duration-300 ${
            isB
              ? "border-purple-400/40 bg-purple-400/[0.08]"
              : hasSelected
                ? "border-white/5 bg-white/[0.01] opacity-40"
                : "border-white/10 bg-white/[0.03] hover:border-purple-400/30 hover:bg-purple-400/[0.05] cursor-pointer"
          } ${hasSelected ? "cursor-default" : "disabled:opacity-30 disabled:cursor-not-allowed"}`}
        >
          {!hasSelected && (
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/0 to-purple-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[11px] uppercase tracking-wider font-semibold ${isB ? "text-purple-400" : "text-purple-400/50"}`}>
              Path B
            </span>
            {isB && (
              <motion.span
                className="text-[10px] uppercase tracking-wider text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded-full font-semibold"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                Selected
              </motion.span>
            )}
          </div>
          <span className={`text-[15px] font-medium leading-snug relative z-10 ${isB ? "text-white/90" : hasSelected ? "text-white/40" : "text-white/85"}`}>
            {safeB}
          </span>
        </button>
      </div>
    </motion.div>
  );
}
