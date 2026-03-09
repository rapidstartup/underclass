"use client";

import { motion } from "framer-motion";

interface Props {
  score?: number;
  delta?: number;
  reason?: string;
}

function getScoreColor(score: number): string {
  if (score <= 20) return "#22c55e";
  if (score <= 40) return "#84cc16";
  if (score <= 55) return "#eab308";
  if (score <= 75) return "#f97316";
  return "#ef4444";
}

function getScoreLabel(score: number): string {
  if (score <= 15) return "ELITE TRACK";
  if (score <= 30) return "ADAPTING WELL";
  if (score <= 50) return "AT RISK";
  if (score <= 70) return "DANGER ZONE";
  if (score <= 85) return "CRITICAL";
  return "PERMANENT UNDERCLASS";
}

function getScoreEmoji(score: number): string {
  if (score <= 20) return "🛡️";
  if (score <= 40) return "📈";
  if (score <= 55) return "⚠️";
  if (score <= 75) return "🔥";
  return "💀";
}

export function PULUpdate({ score = 50, delta = 0, reason = "" }: Props) {
  const safeScore = Math.max(0, Math.min(100, score || 50));
  const safeDelta = delta || 0;
  const color = getScoreColor(safeScore);
  const label = getScoreLabel(safeScore);
  const emoji = getScoreEmoji(safeScore);
  const isImproved = safeDelta < 0;

  return (
    <motion.div
      className="w-full max-w-2xl mx-auto my-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="relative rounded-2xl overflow-hidden">
        {/* Background glow */}
        <motion.div
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(ellipse at center, ${color}33 0%, transparent 70%)`,
          }}
          animate={{ opacity: [0.1, 0.25, 0.1] }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        <div className="relative bg-black/50 backdrop-blur-xl border border-white/[0.06] rounded-2xl px-5 py-4">
          {/* Top row — label + score */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">{emoji}</span>
              <div>
                <span
                  className="text-[11px] uppercase tracking-[0.12em] font-bold block"
                  style={{ color }}
                >
                  {label}
                </span>
                <span className="text-[10px] text-white/25 uppercase tracking-wider">
                  Permanent Underclass Likelihood
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Delta badge */}
              {safeDelta !== 0 && (
                <motion.div
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-mono font-bold ${
                    isImproved
                      ? "bg-green-500/10 border border-green-500/20 text-green-400"
                      : "bg-red-500/10 border border-red-500/20 text-red-400"
                  }`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  {isImproved ? "↓" : "↑"} {Math.abs(safeDelta)}
                </motion.div>
              )}

              {/* Score */}
              <motion.div
                className="text-right"
                key={safeScore}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <span
                  className="text-3xl font-mono font-black tabular-nums"
                  style={{ color }}
                >
                  {safeScore}
                </span>
                <span className="text-sm text-white/30 ml-0.5">%</span>
              </motion.div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className="h-full rounded-full relative"
              style={{ backgroundColor: color }}
              initial={{ width: "0%" }}
              animate={{ width: `${safeScore}%` }}
              transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {/* Shimmer on the bar */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              />
            </motion.div>
          </div>

          {/* Scale markers */}
          <div className="flex justify-between mt-1.5 px-0.5">
            <span className="text-[9px] text-green-400/30">ELITE</span>
            <span className="text-[9px] text-yellow-400/30">AT RISK</span>
            <span className="text-[9px] text-red-400/30">UNDERCLASS</span>
          </div>

          {/* Reason */}
          {reason && (
            <motion.p
              className="text-[12px] text-white/35 mt-3 italic leading-snug border-t border-white/5 pt-2.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {reason}
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
