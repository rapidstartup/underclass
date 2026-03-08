"use client";

import { motion } from "framer-motion";

interface Props {
  year: number;
  headline: string;
}

export function AiMilestone({ year, headline }: Props) {
  return (
    <motion.div
      className="my-6 flex items-center gap-3"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
      <div className="glass-dark rounded-full px-4 py-2 flex items-center gap-2 shrink-0">
        <span className="text-cyan-400 text-xs">⚡</span>
        <span className="text-xs text-cyan-300/80 font-mono">{year || ""}</span>
        <span className="text-xs text-white/60">{headline || ""}</span>
      </div>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
    </motion.div>
  );
}
