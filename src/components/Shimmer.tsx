"use client";

import { memo, type ElementType, type HTMLAttributes } from "react";
import { motion } from "framer-motion";

interface ShimmerProps extends HTMLAttributes<HTMLElement> {
  children: string;
  as?: ElementType;
  duration?: number;
  spread?: number;
}

export const Shimmer = memo(function Shimmer({
  children,
  as: Component = "p",
  className = "",
  duration = 2,
  spread = 2,
  ...props
}: ShimmerProps) {
  const MotionComponent = motion.create(Component);
  const charLength = children.length;
  const spreadCalc = charLength * spread;

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
      {...props}
    >
      {children}
    </MotionComponent>
  );
});
