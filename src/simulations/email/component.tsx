"use client";

import { motion } from "framer-motion";

interface Props {
  sender?: string;
  subject?: string;
  preview?: string;
  timeAgo?: string;
}

export function Email({ sender = "", subject = "", preview = "", timeAgo = "" }: Props) {
  return (
    <motion.div
      className="bg-[#1f1f1f] border border-[#333] rounded-xl p-3.5 max-w-sm w-full font-sans"
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 shrink-0 flex items-center justify-center text-white text-sm font-bold">
          {(sender || "?").charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[14px] font-semibold text-[#e3e3e3]">{sender}</span>
            <span className="text-[12px] text-[#8e8e93]">{timeAgo}</span>
          </div>
          <p className="text-[14px] font-medium text-[#e3e3e3] mt-0.5 truncate">{subject}</p>
          {preview && (
            <p className="text-[13px] text-[#8e8e93] mt-0.5 line-clamp-2">{preview}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
