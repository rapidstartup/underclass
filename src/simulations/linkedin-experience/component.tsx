"use client";

import { motion } from "framer-motion";

interface ExperienceEntry {
  title: string;
  company: string;
  type: string;
  startDate: string;
  endDate: string;
  duration: string;
  location: string;
  description: string;
}

interface ExperienceCardProps {
  entries: ExperienceEntry[];
}

export function ExperienceCard({ entries }: ExperienceCardProps) {
  const safeEntries = Array.isArray(entries) ? entries : [];

  if (safeEntries.length === 0) return null;

  return (
    <motion.div
      className="bg-[#1b1f23] border border-[#38434f] rounded-lg max-w-sm w-full font-sans overflow-hidden"
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="p-4">
        <h4 className="text-[16px] font-semibold text-[#e8e8e8] mb-4">Experience</h4>

        <div className="space-y-4">
          {safeEntries.map((entry, i) => {
            const company = entry?.company || "Unknown";
            const initials = company
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <div key={i} className="flex gap-3">
                <div className="w-12 h-12 rounded bg-[#38434f] flex items-center justify-center text-[#b0b0b0] text-xs font-bold shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-[#e8e8e8]">{entry?.title || "Role"}</p>
                  <p className="text-[12px] text-[#b0b0b0]">
                    {company}{entry?.type ? ` · ${entry.type}` : ""}
                  </p>
                  <p className="text-[12px] text-[#717579]">
                    {entry?.startDate || "?"} – {entry?.endDate || "Present"}
                    {entry?.duration ? ` · ${entry.duration}` : ""}
                  </p>
                  {entry?.location && (
                    <p className="text-[12px] text-[#717579]">{entry.location}</p>
                  )}
                  {entry?.description && (
                    <p className="text-[13px] text-[#b0b0b0] mt-1.5 leading-snug">{entry.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
