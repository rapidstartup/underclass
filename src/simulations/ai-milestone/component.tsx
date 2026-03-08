"use client";

import { motion } from "framer-motion";

interface Props {
  year: number;
  headline: string;
}

export function AiMilestone({ year, headline }: Props) {
  return (
    <motion.div
      className="my-6"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
      </div>
      <div className="glass-dark rounded-xl px-4 py-3 flex items-start gap-2.5 max-w-2xl mx-auto">
        <span className="text-cyan-400 text-sm shrink-0">⚡</span>
        <span className="text-sm text-cyan-300/80 font-mono shrink-0">{year || ""}</span>
        <span className="text-sm text-white/60 leading-snug">{headline || ""}</span>
      </div>
      <div className="flex items-center gap-3 mt-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
      </div>
    </motion.div>
  );
}
