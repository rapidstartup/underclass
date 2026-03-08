"use client";

import { motion } from "framer-motion";

interface NotificationProps {
  app: string;
  sender: string;
  message: string;
  timeAgo: string;
}

// ── X / Twitter ──────────────────────────────────────────────
function XPost({ sender, message, timeAgo }: Omit<NotificationProps, "app">) {
  const handle = sender.toLowerCase().replace(/\s+/g, "");
  return (
    <div className="bg-black border border-[#2f3336] rounded-2xl p-4 max-w-sm w-full font-sans">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-[15px] font-bold text-[#e7e9ea]">{sender}</span>
            <svg className="w-[18px] h-[18px] text-[#1d9bf0] shrink-0" viewBox="0 0 22 22" fill="currentColor">
              <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.69-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.636.433 1.221.878 1.69.47.446 1.055.752 1.69.883.635.13 1.294.083 1.902-.144.271.587.702 1.086 1.24 1.44.54.354 1.167.551 1.813.568.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.223 1.26.272 1.893.143.634-.131 1.22-.434 1.69-.88.445-.47.749-1.055.88-1.69.13-.634.08-1.29-.143-1.897.587-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
            </svg>
            <span className="text-[15px] text-[#71767b]">@{handle}</span>
            <span className="text-[15px] text-[#71767b]">· {timeAgo}</span>
          </div>
          <p className="text-[15px] text-[#e7e9ea] leading-5 mt-1 whitespace-pre-wrap">{message}</p>
          {/* Action bar */}
          <div className="flex items-center justify-between mt-3 max-w-[300px]">
            {/* Reply */}
            <button className="flex items-center gap-1 text-[#71767b] hover:text-[#1d9bf0] group">
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor"><path d="M1.751 10c.027-4.424 3.625-8 8.076-8 4.45 0 8.076 3.576 8.076 8h.023c-.012 4.424-3.599 8.018-8.049 8.018-1.392 0-2.775-.353-4.013-1.025l-.088-.05-2.94.826.768-2.898-.063-.1A7.939 7.939 0 011.751 10zm8.076-6c-3.326 0-6.042 2.709-6.064 6.05.003 1.163.348 2.36 1.01 3.392l.1.16-.591 2.23 2.283-.638.152.086c1.03.578 2.2.892 3.36.892 3.35-.007 6.072-2.735 6.072-6.122 0-3.3-2.722-6.05-6.072-6.05h-.25z" /></svg>
              <span className="text-[13px]">42</span>
            </button>
            {/* Repost */}
            <button className="flex items-center gap-1 text-[#71767b] hover:text-[#00ba7c] group">
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor"><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z" /></svg>
              <span className="text-[13px]">18</span>
            </button>
            {/* Like */}
            <button className="flex items-center gap-1 text-[#71767b] hover:text-[#f91880] group">
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor"><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.56-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z" /></svg>
              <span className="text-[13px]">847</span>
            </button>
            {/* Views */}
            <button className="flex items-center gap-1 text-[#71767b]">
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor"><path d="M8.75 21V3h2v18h-2zM18.25 21V8.5h2V21h-2zM13.5 21V13h2v8h-2zM3.25 21v-6h2v6h-2z" /></svg>
              <span className="text-[13px]">12.4K</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── iMessage ─────────────────────────────────────────────────
function IMessageBubble({ sender, message, timeAgo }: Omit<NotificationProps, "app">) {
  return (
    <div className="max-w-xs w-full">
      <div className="text-[11px] text-white/40 text-center mb-1">{timeAgo}</div>
      <div className="bg-[#007aff] rounded-2xl rounded-br-md px-4 py-2.5 ml-auto max-w-[85%] w-fit">
        <p className="text-[15px] text-white leading-snug">{message}</p>
      </div>
      <div className="text-[11px] text-white/40 text-right mt-0.5 mr-1">{sender}</div>
    </div>
  );
}

// ── Slack ─────────────────────────────────────────────────────
function SlackMessage({ sender, message, timeAgo }: Omit<NotificationProps, "app">) {
  return (
    <div className="bg-[#1a1d21] border border-[#35373b] rounded-lg p-3 max-w-sm w-full font-sans">
      <div className="flex gap-2">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#4a154b] to-[#611f69] shrink-0 flex items-center justify-center text-white text-xs font-bold">
          {(sender || "?").charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-[15px] font-bold text-[#d1d2d3]">{sender}</span>
            <span className="text-[12px] text-[#616061]">{timeAgo}</span>
          </div>
          <p className="text-[15px] text-[#d1d2d3] leading-snug mt-0.5">{message}</p>
        </div>
      </div>
    </div>
  );
}

// ── LinkedIn ─────────────────────────────────────────────────
function LinkedInNotification({ sender, message, timeAgo }: Omit<NotificationProps, "app">) {
  return (
    <div className="bg-[#1b1f23] border border-[#38434f] rounded-lg p-3 max-w-sm w-full font-sans">
      <div className="flex gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0077b5] to-[#004e89] shrink-0 flex items-center justify-center text-white text-sm font-bold">
          {(sender || "?")
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] text-[#e8e8e8] leading-snug">
            <span className="font-semibold">{sender}</span>{" "}
            <span className="text-[#b0b0b0]">{message}</span>
          </p>
          <p className="text-[12px] text-[#717579] mt-1">{timeAgo}</p>
        </div>
      </div>
    </div>
  );
}

// ── WhatsApp ─────────────────────────────────────────────────
function WhatsAppMessage({ sender, message, timeAgo }: Omit<NotificationProps, "app">) {
  return (
    <div className="max-w-xs w-full">
      <div className="bg-[#005c4b] rounded-lg rounded-tr-none px-3 py-2 ml-auto max-w-[85%] w-fit relative">
        <p className="text-[13px] text-[#53bdeb] font-medium mb-0.5">{sender}</p>
        <p className="text-[14.2px] text-[#e9edef] leading-snug">{message}</p>
        <div className="flex items-center justify-end gap-1 mt-0.5">
          <span className="text-[11px] text-[#ffffff99]">{timeAgo}</span>
          {/* Double check */}
          <svg className="w-4 h-3 text-[#53bdeb]" viewBox="0 0 16 11" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M1 5.5L4.5 9L11 2" />
            <path d="M5 5.5L8.5 9L15 2" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ── Email ────────────────────────────────────────────────────
function EmailCard({ sender, message, timeAgo }: Omit<NotificationProps, "app">) {
  const subject = message.split(".")[0] || message;
  const preview = message.length > subject.length ? message.slice(subject.length + 1).trim() : "";
  return (
    <div className="bg-[#1f1f1f] border border-[#333] rounded-xl p-3.5 max-w-sm w-full font-sans">
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
    </div>
  );
}

// ── News ─────────────────────────────────────────────────────
function NewsAlert({ sender, message, timeAgo }: Omit<NotificationProps, "app">) {
  return (
    <div className="bg-[#1c1c1e] rounded-2xl p-3.5 max-w-sm w-full font-sans border border-[#38383a]">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-md bg-red-600 flex items-center justify-center">
          <span className="text-white text-[10px] font-black">N</span>
        </div>
        <span className="text-[12px] text-[#8e8e93] uppercase font-semibold tracking-wide">{sender}</span>
        <span className="text-[12px] text-[#8e8e93]">· {timeAgo}</span>
      </div>
      <p className="text-[16px] font-bold text-[#e3e3e3] leading-tight">{message}</p>
    </div>
  );
}

// ── ChatGPT ──────────────────────────────────────────────────
function ChatGPTMessage({ message, timeAgo }: Omit<NotificationProps, "app">) {
  return (
    <div className="bg-[#212121] border border-[#2f2f2f] rounded-2xl p-4 max-w-sm w-full font-sans">
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-[#10a37f] shrink-0 flex items-center justify-center">
          <span className="text-white text-sm font-bold">✦</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[14px] font-semibold text-[#ececec]">ChatGPT</span>
            <span className="text-[12px] text-[#8e8e93]">{timeAgo}</span>
          </div>
          <p className="text-[14px] text-[#d1d5db] leading-relaxed">{message}</p>
        </div>
      </div>
    </div>
  );
}

// ── Claude ────────────────────────────────────────────────────
function ClaudeMessage({ message, timeAgo }: Omit<NotificationProps, "app">) {
  return (
    <div className="bg-[#2b2117] border border-[#3d2e1e] rounded-2xl p-4 max-w-sm w-full font-sans">
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-[#d97706] shrink-0 flex items-center justify-center">
          <span className="text-white text-sm font-bold">◎</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[14px] font-semibold text-[#f5e6d3]">Claude</span>
            <span className="text-[12px] text-[#a08060]">{timeAgo}</span>
          </div>
          <p className="text-[14px] text-[#e0cdb8] leading-relaxed">{message}</p>
        </div>
      </div>
    </div>
  );
}

// ── Instagram ────────────────────────────────────────────────
function InstagramNotification({ sender, message, timeAgo }: Omit<NotificationProps, "app">) {
  return (
    <div className="bg-[#000000] border border-[#262626] rounded-xl p-3 max-w-sm w-full font-sans">
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
    </div>
  );
}

// ── Generic fallback (iOS notification style) ────────────────
function GenericNotification({ app, sender, message, timeAgo }: NotificationProps) {
  return (
    <div className="bg-[#1c1c1e]/95 backdrop-blur-xl rounded-2xl p-3.5 max-w-sm w-full font-sans border border-white/5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-gray-500 to-gray-700 shrink-0 flex items-center justify-center text-white text-xs font-bold">
          {app.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className="text-[12px] text-[#8e8e93] uppercase font-semibold">{app}</span>
            <span className="text-[12px] text-[#8e8e93]">{timeAgo}</span>
          </div>
          <p className="text-[15px] font-semibold text-[#e3e3e3] leading-tight">{sender}</p>
          <p className="text-[14px] text-[#a1a1a6] leading-snug mt-0.5 line-clamp-2">{message}</p>
        </div>
      </div>
    </div>
  );
}

// ── Main Router ──────────────────────────────────────────────
export function Notification({ app, sender, message, timeAgo }: NotificationProps) {
  const props = { sender: sender || "Unknown", message: message || "", timeAgo: timeAgo || "" };

  const inner = (() => {
    switch (app) {
      case "twitter":
        return <XPost {...props} />;
      case "imessage":
        return <IMessageBubble {...props} />;
      case "slack":
        return <SlackMessage {...props} />;
      case "linkedin":
        return <LinkedInNotification {...props} />;
      case "whatsapp":
        return <WhatsAppMessage {...props} />;
      case "email":
        return <EmailCard {...props} />;
      case "news":
        return <NewsAlert {...props} />;
      case "chatgpt":
        return <ChatGPTMessage {...props} />;
      case "claude":
        return <ClaudeMessage {...props} />;
      case "instagram":
        return <InstagramNotification {...props} />;
      default:
        return <GenericNotification app={app || "notification"} {...props} />;
    }
  })();

  return (
    <motion.div
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {inner}
    </motion.div>
  );
}
