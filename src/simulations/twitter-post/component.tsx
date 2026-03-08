"use client";

import { motion } from "framer-motion";

interface Props {
  authorName?: string;
  handle?: string;
  content?: string;
  verified?: boolean;
  timeAgo?: string;
}

export function TwitterPost({ authorName = "Unknown", handle, content = "", timeAgo = "" }: Props) {
  const safeHandle = handle || authorName.toLowerCase().replace(/\s+/g, "");

  return (
    <motion.div
      className="bg-black border border-[#2f3336] rounded-2xl p-4 max-w-sm w-full font-sans"
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[15px] font-bold text-[#e7e9ea]">{authorName}</span>
            <svg className="w-[18px] h-[18px] text-[#1d9bf0] shrink-0" viewBox="0 0 22 22" fill="currentColor">
              <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.69-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.636.433 1.221.878 1.69.47.446 1.055.752 1.69.883.635.13 1.294.083 1.902-.144.271.587.702 1.086 1.24 1.44.54.354 1.167.551 1.813.568.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.223 1.26.272 1.893.143.634-.131 1.22-.434 1.69-.88.445-.47.749-1.055.88-1.69.13-.634.08-1.29-.143-1.897.587-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
            </svg>
            <span className="text-[15px] text-[#71767b]">@{safeHandle}</span>
            <span className="text-[15px] text-[#71767b]">· {timeAgo}</span>
          </div>
          <p className="text-[15px] text-[#e7e9ea] leading-5 mt-1 whitespace-pre-wrap">{content}</p>
          <div className="flex items-center justify-between mt-3 max-w-[300px]">
            <button className="flex items-center gap-1 text-[#71767b]">
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor"><path d="M1.751 10c.027-4.424 3.625-8 8.076-8 4.45 0 8.076 3.576 8.076 8h.023c-.012 4.424-3.599 8.018-8.049 8.018-1.392 0-2.775-.353-4.013-1.025l-.088-.05-2.94.826.768-2.898-.063-.1A7.939 7.939 0 011.751 10zm8.076-6c-3.326 0-6.042 2.709-6.064 6.05.003 1.163.348 2.36 1.01 3.392l.1.16-.591 2.23 2.283-.638.152.086c1.03.578 2.2.892 3.36.892 3.35-.007 6.072-2.735 6.072-6.122 0-3.3-2.722-6.05-6.072-6.05h-.25z" /></svg>
              <span className="text-[13px]">42</span>
            </button>
            <button className="flex items-center gap-1 text-[#71767b]">
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor"><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z" /></svg>
              <span className="text-[13px]">18</span>
            </button>
            <button className="flex items-center gap-1 text-[#71767b]">
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor"><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.56-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z" /></svg>
              <span className="text-[13px]">847</span>
            </button>
            <button className="flex items-center gap-1 text-[#71767b]">
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor"><path d="M8.75 21V3h2v18h-2zM18.25 21V8.5h2V21h-2zM13.5 21V13h2v8h-2zM3.25 21v-6h2v6h-2z" /></svg>
              <span className="text-[13px]">12.4K</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
