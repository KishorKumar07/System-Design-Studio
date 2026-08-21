"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANT_CLASS: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-foreground hover:bg-accent-hover shadow-[0_0_0_1px_rgba(0,0,0,0)] shadow-accent/20",
  secondary: "bg-surface-strong text-foreground hover:bg-surface-hover border border-border",
  outline: "bg-transparent text-foreground border border-border hover:border-border-strong hover:bg-surface",
  ghost: "bg-transparent text-foreground-muted hover:text-foreground hover:bg-surface",
  danger: "bg-danger text-white hover:brightness-110",
};

const SIZE_CLASS: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, disabled, className = "", children, ...props },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      transition={{ duration: 0.12 }}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </motion.button>
  );
});
