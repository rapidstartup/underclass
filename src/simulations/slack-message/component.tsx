"use client";

import { motion } from "framer-motion";

interface Props {
  sender?: string;
  message?: string;
  channel?: string;
  timeAgo?: string;
}

export function SlackMessage({ sender = "Unknown", message = "", channel, timeAgo = "" }: Props) {
  return (
    <motion.div
      className="bg-[#1a1d21] border border-[#35373b] rounded-lg p-3 max-w-sm w-full font-sans"
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {channel && (
        <div className="text-[11px] text-[#b5b5b5] mb-1.5 font-medium">{channel}</div>
      )}
      <div className="flex gap-2">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#4a154b] to-[#611f69] shrink-0 flex items-center justify-center text-white text-xs font-bold">
          {sender.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-[15px] font-bold text-[#d1d2d3]">{sender}</span>
            <span className="text-[12px] text-[#616061]">{timeAgo}</span>
          </div>
          <p className="text-[15px] text-[#d1d2d3] leading-snug mt-0.5">{message}</p>
        </div>
      </div>
    </motion.div>
  );
}
