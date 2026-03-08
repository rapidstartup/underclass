"use client";

import { motion } from "framer-motion";

interface LinkedInPostProps {
  authorName: string;
  authorTitle: string;
  timeAgo: string;
  content: string;
  likes: number;
  comments: number;
}

export function LinkedInPost({
  authorName = "Unknown",
  authorTitle = "",
  timeAgo = "",
  content = "",
  likes = 0,
  comments = 0,
}: LinkedInPostProps) {
  const initials = (authorName || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const safeLikes = typeof likes === "number" ? likes : 0;
  const safeComments = typeof comments === "number" ? comments : 0;

  return (
    <motion.div
      className="bg-[#1b1f23] border border-[#38434f] rounded-lg max-w-sm w-full font-sans overflow-hidden"
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Header */}
      <div className="p-3 pb-0">
        <div className="flex items-start gap-2">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0077b5] to-[#004e89] flex items-center justify-center text-white text-sm font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-[#e8e8e8] leading-tight">{authorName}</p>
            <p className="text-[12px] text-[#b0b0b0] leading-tight mt-0.5 line-clamp-1">{authorTitle}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[12px] text-[#717579]">{timeAgo}</span>
              <span className="text-[12px] text-[#717579]">·</span>
              <svg className="w-3 h-3 text-[#717579]" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a7 7 0 107 7 7.008 7.008 0 00-7-7zM3 8a5 5 0 015-5 4.92 4.92 0 012.348.591L4.591 10.348A4.92 4.92 0 013 8zm5 5a4.92 4.92 0 01-2.348-.591l5.757-5.757A4.92 4.92 0 0113 8a5 5 0 01-5 5z" />
              </svg>
            </div>
          </div>
          {/* Three dots */}
          <button className="text-[#b0b0b0] p-1">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 py-3">
        <p className="text-[14px] text-[#e8e8e8] leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>

      {/* Engagement counts */}
      <div className="px-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-0.5">
          {/* Reaction emojis stacked */}
          <div className="flex -space-x-1">
            <div className="w-[18px] h-[18px] rounded-full bg-[#378fe9] flex items-center justify-center z-30 border border-[#1b1f23]">
              <span className="text-[10px]">👍</span>
            </div>
            <div className="w-[18px] h-[18px] rounded-full bg-[#e16745] flex items-center justify-center z-20 border border-[#1b1f23]">
              <span className="text-[10px]">❤️</span>
            </div>
            <div className="w-[18px] h-[18px] rounded-full bg-[#f5bb5c] flex items-center justify-center z-10 border border-[#1b1f23]">
              <span className="text-[10px]">💡</span>
            </div>
          </div>
          <span className="text-[12px] text-[#b0b0b0] ml-1">{safeLikes.toLocaleString()}</span>
        </div>
        <span className="text-[12px] text-[#b0b0b0]">{safeComments} comments</span>
      </div>

      {/* Divider */}
      <div className="h-px bg-[#38434f] mx-3" />

      {/* Action bar */}
      <div className="flex items-center justify-between px-1 py-1">
        {[
          { icon: "👍", label: "Like" },
          { icon: "💬", label: "Comment" },
          { icon: "🔄", label: "Repost" },
          { icon: "📤", label: "Send" },
        ].map((action) => (
          <button
            key={action.label}
            className="flex items-center gap-1.5 px-3 py-2 rounded hover:bg-[#ffffff0a] text-[#b0b0b0]"
          >
            <span className="text-[14px]">{action.icon}</span>
            <span className="text-[12px] font-medium">{action.label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
