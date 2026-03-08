"use client";

import { motion } from "framer-motion";

interface Props {
  sender?: string;
  message?: string;
  timeAgo?: string;
}

export function WhatsApp({ sender = "", message = "", timeAgo = "" }: Props) {
  return (
    <motion.div
      className="max-w-xs w-full"
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="bg-[#005c4b] rounded-lg rounded-tr-none px-3 py-2 ml-auto max-w-[85%] w-fit relative">
        <p className="text-[13px] text-[#53bdeb] font-medium mb-0.5">{sender}</p>
        <p className="text-[14.2px] text-[#e9edef] leading-snug">{message}</p>
        <div className="flex items-center justify-end gap-1 mt-0.5">
          <span className="text-[11px] text-[#ffffff99]">{timeAgo}</span>
          <svg className="w-4 h-3 text-[#53bdeb]" viewBox="0 0 16 11" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M1 5.5L4.5 9L11 2" />
            <path d="M5 5.5L8.5 9L15 2" />
          </svg>
        </div>
      </div>
    </motion.div>
  );
}
