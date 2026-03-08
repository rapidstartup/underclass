"use client";

import { motion } from "framer-motion";

interface Props {
  sender?: string;
  message?: string;
  timeAgo?: string;
  isFromMe?: boolean;
}

export function IMessage({ sender = "", message = "", timeAgo = "", isFromMe = false }: Props) {
  return (
    <motion.div
      className="max-w-xs w-full"
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="text-[11px] text-white/40 text-center mb-1">{timeAgo}</div>
      <div
        className={`rounded-2xl px-4 py-2.5 max-w-[85%] w-fit ${
          isFromMe
            ? "bg-[#007aff] rounded-br-md ml-auto"
            : "bg-[#3a3a3c] rounded-bl-md"
        }`}
      >
        <p className="text-[15px] text-white leading-snug">{message}</p>
      </div>
      <div className={`text-[11px] text-white/40 mt-0.5 ${isFromMe ? "text-right mr-1" : "text-left ml-1"}`}>
        {sender}
      </div>
    </motion.div>
  );
}
