"use client";

import { motion } from "framer-motion";

interface Props {
  score?: number;
  delta?: number;
  reason?: string;
}

function getScoreColor(score: number): string {
  if (score <= 20) return "#22c55e"; // green — elite track
  if (score <= 40) return "#84cc16"; // lime — doing well
  if (score <= 55) return "#eab308"; // yellow — danger zone
  if (score <= 75) return "#f97316"; // orange — high risk
  return "#ef4444"; // red — underclass imminent
}

function getScoreLabel(score: number): string {
  if (score <= 15) return "ELITE TRACK";
  if (score <= 30) return "ADAPTING";
  if (score <= 50) return "AT RISK";
  if (score <= 70) return "DANGER ZONE";
  if (score <= 85) return "CRITICAL";
  return "PERMANENT UNDERCLASS";
}

export function PULUpdate({ score = 50, delta = 0, reason = "" }: Props) {
  const safeScore = Math.max(0, Math.min(100, score || 50));
  const safeDelta = delta || 0;
  const color = getScoreColor(safeScore);
  const label = getScoreLabel(safeScore);
  const isImproved = safeDelta < 0;
  const isWorsened = safeDelta > 0;

  return (
    <motion.div
      className="w-full max-w-2xl mx-auto my-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="rounded-xl bg-black/60 backdrop-blur-sm border border-white/5 px-4 py-3">
        {/* Header row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-semibold">
              Permanent Underclass Likelihood
            </span>
          </div>
          <div className="flex items-center gap-2">
            {safeDelta !== 0 && (
              <motion.span
                className={`text-[12px] font-mono font-bold ${isImproved ? "text-green-400" : "text-red-400"}`}
                initial={{ opacity: 0, x: isImproved ? 10 : -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {isImproved ? "▼" : "▲"} {Math.abs(safeDelta)}%
              </motion.span>
            )}
            <span className="text-[24px] font-mono font-bold" style={{ color }}>
              {safeScore}%
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full bg-white/5 overflow-hidden mb-2">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
            initial={{ width: "0%" }}
            animate={{ width: `${safeScore}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span
            className="text-[10px] uppercase tracking-widest font-bold"
            style={{ color }}
          >
            {label}
          </span>
          {reason && (
            <span className="text-[11px] text-white/30 italic max-w-[60%] text-right truncate">
              {reason}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
