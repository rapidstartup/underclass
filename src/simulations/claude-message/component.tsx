"use client";

import { motion } from "framer-motion";

interface Props {
  message?: string;
  userQuery?: string;
  timeAgo?: string;
}

export function ClaudeMessage({ message = "", userQuery, timeAgo = "" }: Props) {
  return (
    <motion.div
      className="bg-[#2b2117] border border-[#3d2e1e] rounded-2xl max-w-sm w-full font-sans overflow-hidden"
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {userQuery && (
        <div className="bg-[#3d2e1e] px-4 py-2.5">
          <p className="text-[13px] text-[#c0a080]">{userQuery}</p>
        </div>
      )}
      <div className="p-4">
        <div className="flex gap-3">
          <div className="w-7 h-7 rounded-full bg-[#d97706] shrink-0 flex items-center justify-center">
            <span className="text-white text-xs font-bold">◎</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[13px] font-semibold text-[#f5e6d3]">Claude</span>
              <span className="text-[11px] text-[#a08060]">{timeAgo}</span>
            </div>
            <p className="text-[14px] text-[#e0cdb8] leading-relaxed">{message}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
