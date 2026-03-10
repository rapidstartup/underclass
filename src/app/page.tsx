"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LinkedInLogo, XLogo } from "@/components/logos";

interface RecentSession {
  id: string;
  personName: string;
  finalPul: number | null;
}

type InputPlatform = "linkedin" | "x" | null;

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function sanitizeLinkedInHandle(value: string): string {
  return safeDecode(value).trim().replace(/^@/, "").split(/[/?#]/)[0] || "";
}

function sanitizeXHandle(value: string): string {
  return safeDecode(value).trim().replace(/^@/, "").split(/[/?#]/)[0] || "";
}

function parseProfileInput(raw: string, currentPlatform: InputPlatform = null): { platform: InputPlatform; value: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { platform: null, value: "" };

  const linkedInMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([^/?#\s]+)/i);
  if (linkedInMatch) {
    return { platform: "linkedin", value: sanitizeLinkedInHandle(linkedInMatch[1]) };
  }

  const xMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?(?:x|twitter)\.com\/([^/?#\s]+)/i);
  if (xMatch) {
    return { platform: "x", value: sanitizeXHandle(xMatch[1]) };
  }

  const keepsCurrentPlatform =
    currentPlatform &&
    !trimmed.includes("://") &&
    !trimmed.includes(".com") &&
    !/\s/.test(trimmed);
  if (keepsCurrentPlatform) {
    if (currentPlatform === "linkedin") {
      return { platform: "linkedin", value: sanitizeLinkedInHandle(trimmed) };
    }
    return { platform: "x", value: sanitizeXHandle(trimmed) };
  }

  return { platform: null, value: raw };
}

function getOutcomeInfo(pul: number | null) {
  if (pul === null) return { label: "simulating...", color: "text-white/30", bg: "bg-white/5 border-white/10" };
  if (pul <= 20) return { label: "REPLACE-PROOF", color: "text-green-400", bg: "bg-green-400/5 border-green-400/15" };
  if (pul <= 60) return { label: "TRANSITIONING", color: "text-yellow-400", bg: "bg-yellow-400/5 border-yellow-400/15" };
  return { label: "HIGH RISK", color: "text-red-400", bg: "bg-red-400/5 border-red-400/15" };
}

function Marquee({ sessions }: { sessions: RecentSession[] }) {
  if (sessions.length === 0) return null;

  // Repeat list enough to fill viewport, then double for seamless scroll
  const minItems = Math.max(2, Math.ceil(20 / sessions.length));
  const baseItems: RecentSession[] = [];
  for (let i = 0; i < minItems; i++) baseItems.push(...sessions);
  // Double for seamless loop (scroll first half, then reset)
  const items = [...baseItems, ...baseItems];

  return (
    <div className="w-full overflow-hidden mt-10 max-w-4xl mx-auto mask-fade">
      <motion.div
        className="flex gap-3 w-max"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          duration: baseItems.length * 2.5,
          ease: "linear",
          repeat: Infinity,
        }}
      >
        {items.map((session, i) => {
          const info = getOutcomeInfo(session.finalPul);
          return (
            <a
              key={`${session.id}-${i}`}
              href={`/s/${session.id}`}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-full border text-nowrap transition-all hover:scale-105 ${info.bg}`}
            >
              <span className="text-[13px] text-white/60">{session.personName}</span>
              {session.finalPul !== null && (
                <>
                  <span className={`text-[11px] font-mono font-bold ${info.color}`}>
                    {session.finalPul}%
                  </span>
                  <span className={`text-[9px] uppercase tracking-wider font-bold ${info.color}`}>
                    {info.label}
                  </span>
                </>
              )}
            </a>
          );
        })}
      </motion.div>
    </div>
  );
}

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [inputPlatform, setInputPlatform] = useState<InputPlatform>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const router = useRouter();

  // Fetch recent sessions
  useEffect(() => {
    fetch("/api/recent")
      .then((r) => r.json())
      .then((data) => setRecentSessions(data.sessions || []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = inputValue.trim();
    if (!input) return;

    setIsLoading(true);

    if (inputPlatform === "linkedin") {
      const handle = sanitizeLinkedInHandle(input);
      if (handle) {
        router.push(`/simulate?url=${encodeURIComponent(`https://www.linkedin.com/in/${handle}`)}`);
        return;
      }
    }

    if (inputPlatform === "x") {
      const handle = sanitizeXHandle(input);
      if (handle) {
        router.push(`/simulate?handle=${encodeURIComponent(handle)}`);
        return;
      }
    }

    const parsedInput = parseProfileInput(input);
    if (parsedInput.platform === "linkedin") {
      router.push(`/simulate?url=${encodeURIComponent(`https://www.linkedin.com/in/${parsedInput.value}`)}`);
      return;
    }

    if (parsedInput.platform === "x") {
      router.push(`/simulate?handle=${encodeURIComponent(parsedInput.value)}`);
      return;
    }

    // Name or handle — search via Exa
    router.push(`/simulate?handle=${encodeURIComponent(input)}`);
  };

  const handleInputChange = (value: string) => {
    const parsed = parseProfileInput(value, inputPlatform);
    setInputPlatform(parsed.platform);
    setInputValue(parsed.value);
  };

  const handleInputPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData("text");
    const parsed = parseProfileInput(pastedText, inputPlatform);
    if (!parsed.platform) return;

    e.preventDefault();
    setInputPlatform(parsed.platform);
    setInputValue(parsed.value);
  };

  const canSubmit = Boolean(inputValue.trim());
  const submitButtonClass = `w-10 h-10 rounded-full border disabled:opacity-30 flex items-center justify-center transition-all duration-200 shrink-0 ${
    !isLoading && canSubmit && inputPlatform === "linkedin"
      ? "submit-pulse-linkedin"
      : !isLoading && canSubmit && inputPlatform === "x"
        ? "submit-pulse-x"
        : "border-[#e53535]/35 bg-[#e53535]/23 hover:bg-[#e53535]/38"
  }`;

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/hero-bg.jpg)" }}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
      {/* Subtle brand tint */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(circle at 50% 22%, rgba(229,53,53,0.18), rgba(229,53,53,0.04) 32%, transparent 62%)" }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-6 -mt-10">
        <motion.div
          className="mb-5 px-3 py-1 rounded-full border border-[#e53535]/35 bg-[#e53535]/10 text-[#ffd8d8] text-[11px] uppercase tracking-[0.14em] font-semibold"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          ReplaceProof Framework
        </motion.div>

        <motion.h1
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-4 tracking-tight bg-gradient-to-b from-white via-white to-[#ff8e8e] text-transparent bg-clip-text"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          ReplaceProof
        </motion.h1>

        <motion.p
          className="text-lg md:text-xl text-white/70 text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
        >
          will you survive the age of AI? <br/> assess risk, then build your{" "}
          <span className="text-[#ff9d9d]">90-day transition path</span>
        </motion.p>

        <motion.form
          onSubmit={handleSubmit}
          className="w-full max-w-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
        >
          <div className="glass rounded-full flex items-center p-1.5 pl-2 transition-all duration-300 focus-within:border-[#e53535]/45 focus-within:shadow-[0_0_0_1px_rgba(229,53,53,0.25),0_0_28px_rgba(229,53,53,0.23)]">
            {inputPlatform && (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium shrink-0 ${
                  inputPlatform === "linkedin"
                    ? "bg-[#0A66C2]/20 border-[#0A66C2]/60 text-[#79B8FF]"
                    : "bg-black/80 border-white/25 text-white"
                }`}
              >
                {inputPlatform === "linkedin" ? (
                  <LinkedInLogo className="w-3.5 h-3.5" />
                ) : (
                  <XLogo className="w-3.5 h-3.5" />
                )}
                <span>{inputPlatform === "linkedin" ? "LinkedIn:" : "X.com:"}</span>
              </span>
            )}
            <input
              type="text"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onPaste={handleInputPaste}
              placeholder={inputPlatform ? "profile handle" : "paste linkedin url, x.com profile, or name to start your assessment"}
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30 py-3"
              autoFocus
            />
            <button
              type="submit"
              disabled={isLoading || !canSubmit}
              className={submitButtonClass}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-[#ffd6d6] rounded-full animate-spin" />
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="text-[#ffe2e2]"
                >
                  <path
                    d="M3 8H13M13 8L8.5 3.5M13 8L8.5 12.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          </div>
        </motion.form>

        {/* Recent sessions marquee */}
        <motion.div
          className="w-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
        >
          <Marquee sessions={recentSessions} />
        </motion.div>
      </div>
    </main>
  );
}
