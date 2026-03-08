"use client";

import { motion } from "framer-motion";

interface Props {
  year: number;
  title: string;
  narrative: string;
  personName: string;
  aiEra?: string;
}

export function Chapter({ year, title, narrative, personName, aiEra }: Props) {
  return (
    <motion.div
      className="mb-2"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-sm text-white/40 font-mono">{year || "????"}</span>
          {aiEra && (
            <span className="text-[10px] uppercase tracking-widest text-cyan-400/60 font-semibold px-2 py-0.5 rounded-full border border-cyan-400/20 bg-cyan-400/5">
              {aiEra}
            </span>
          )}
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-white/90">
          {personName || "Your"}&apos;s future
        </h2>
      </div>

      <h3 className="text-xl md:text-2xl font-bold italic text-white/80 mb-4">
        &lsquo;{title || "Untitled"}&rsquo;
      </h3>

      <p className="text-base md:text-lg text-white/65 leading-relaxed max-w-xl">
        {narrative || ""}
      </p>
    </motion.div>
  );
}
