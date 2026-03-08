"use client";

import { motion } from "framer-motion";
import { OpenAILogo } from "@/components/logos";

interface Props {
  message?: string;
  userQuery?: string;
  timeAgo?: string;
}

export function ChatGPT({ message = "", userQuery, timeAgo = "" }: Props) {
  return (
    <motion.div
      className="bg-[#212121] border border-[#2f2f2f] rounded-2xl max-w-sm w-full font-sans overflow-hidden"
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {userQuery && (
        <div className="bg-[#2f2f2f] px-4 py-2.5">
          <p className="text-[13px] text-[#ababab]">{userQuery}</p>
        </div>
      )}
      <div className="p-4">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-[#10a37f] shrink-0 flex items-center justify-center">
            <OpenAILogo className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[13px] font-semibold text-[#ececec]">ChatGPT</span>
              <span className="text-[11px] text-[#8e8e93]">{timeAgo}</span>
            </div>
            <p className="text-[14px] text-[#d1d5db] leading-relaxed">{message}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
