"use client";

import { motion } from "framer-motion";

interface Props {
  source?: string;
  headline?: string;
  timeAgo?: string;
}

export function NewsAlert({ source = "News", headline = "", timeAgo = "" }: Props) {
  return (
    <motion.div
      className="bg-[#1c1c1e] rounded-2xl p-3.5 max-w-sm w-full font-sans border border-[#38383a]"
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-md bg-red-600 flex items-center justify-center">
          <span className="text-white text-[10px] font-black">N</span>
        </div>
        <span className="text-[12px] text-[#8e8e93] uppercase font-semibold tracking-wide">{source}</span>
        <span className="text-[12px] text-[#8e8e93]">· {timeAgo}</span>
      </div>
      <p className="text-[16px] font-bold text-[#e3e3e3] leading-tight">{headline}</p>
    </motion.div>
  );
}
