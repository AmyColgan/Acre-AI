"use client";

import { type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: Variant;
  children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brass text-ink hover:bg-brass-bright shadow-[0_1px_0_0_rgba(0,0,0,0.2)]",
  secondary:
    "bg-transparent text-parchment border border-hairline-strong hover:border-brass hover:text-brass-bright",
  ghost:
    "bg-transparent text-parchment-dim hover:text-parchment",
};

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ y: 0, scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium tracking-wide transition-colors duration-300 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
