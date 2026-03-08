"use client";

import { motion } from "framer-motion";

interface Props {
  sender?: string;
  message?: string;
  timeAgo?: string;
}

export function Instagram({ sender = "", message = "", timeAgo = "" }: Props) {
  return (
    <motion.div
      className="bg-[#000000] border border-[#262626] rounded-xl p-3 max-w-sm w-full font-sans"
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full shrink-0 p-[2px] bg-gradient-to-tr from-[#feda75] via-[#fa7e1e] via-[#d62976] via-[#962fbf] to-[#4f5bd5]">
          <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
            <span className="text-white text-xs font-bold">{(sender || "?").charAt(0)}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] text-[#f5f5f5] leading-snug">
            <span className="font-semibold">{sender}</span>{" "}
            <span className="text-[#a8a8a8]">{message}</span>
          </p>
          <p className="text-[12px] text-[#a8a8a8] mt-0.5">{timeAgo}</p>
        </div>
      </div>
    </motion.div>
  );
}
