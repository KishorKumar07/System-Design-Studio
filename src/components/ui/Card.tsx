"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

interface CardProps extends HTMLMotionProps<"div"> {
  hoverable?: boolean;
}

export function Card({ hoverable = false, className = "", children, ...props }: CardProps) {
  return (
    <motion.div
      whileHover={hoverable ? { y: -3, borderColor: "var(--border-strong)" } : undefined}
      transition={{ duration: 0.18 }}
      className={`rounded-xl border border-border bg-surface ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}
