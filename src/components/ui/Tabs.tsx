"use client";

import { useId } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TabsProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function Tabs<T extends string>({
  options,
  value,
  onChange,
  className,
}: TabsProps<T>) {
  const id = useId();
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-hairline bg-ink-2 p-1",
        className
      )}
    >
      {options.map((option) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              "relative rounded-full px-3.5 py-1.5 text-xs font-medium tracking-wide transition-colors duration-300 cursor-pointer",
              active ? "text-ink" : "text-parchment-dim hover:text-parchment"
            )}
          >
            {active && (
              <motion.span
                layoutId={`tab-pill-${id}`}
                className="absolute inset-0 rounded-full bg-brass"
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              />
            )}
            <span className="relative z-10">{option}</span>
          </button>
        );
      })}
    </div>
  );
}
