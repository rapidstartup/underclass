"use client";

import { memo, type ElementType } from "react";
import { motion } from "framer-motion";

interface ShimmerProps {
  children: string;
  as?: ElementType;
  duration?: number;
  spread?: number;
  className?: string;
}

const MOTION_TAGS = {
  p: motion.p,
  span: motion.span,
  div: motion.div,
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
} as const;

export const Shimmer = memo(function Shimmer({
  children,
  as: Component = "p",
  className = "",
  duration = 2,
  spread = 2,
}: ShimmerProps) {
  const charLength = children.length;
  const spreadCalc = charLength * spread;
  const MotionComponent =
    typeof Component === "string" && Component in MOTION_TAGS
      ? MOTION_TAGS[Component as keyof typeof MOTION_TAGS]
      : motion.p;

  return (
    <MotionComponent
      className={`inline-block bg-clip-text text-transparent bg-[length:250%_100%] ${className}`}
      style={{
        backgroundImage: `linear-gradient(
          90deg,
          var(--shimmer-base, rgba(255,255,255,0.25)) 0%,
          var(--shimmer-base, rgba(255,255,255,0.25)) ${50 - spreadCalc}%,
          var(--shimmer-highlight, rgba(255,255,255,0.7)) 50%,
          var(--shimmer-base, rgba(255,255,255,0.25)) ${50 + spreadCalc}%,
          var(--shimmer-base, rgba(255,255,255,0.25)) 100%
        )`,
      }}
      animate={{
        backgroundPosition: ["150% center", "-50% center"],
      }}
      transition={{
        duration,
        ease: "linear",
        repeat: Infinity,
      }}
    >
      {children}
    </MotionComponent>
  );
});
