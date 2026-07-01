import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "positive" | "negative" | "neutral";
  icon?: ReactNode;
  className?: string;
}

const toneClasses = {
  positive: "text-emerald-bright",
  negative: "text-rust-bright",
  neutral: "text-muted",
};

export function StatTile({ label, value, delta, deltaTone = "neutral", className }: StatTileProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-hairline bg-ink px-5 py-4",
        className
      )}
    >
      <span className="block text-xs uppercase tracking-wide text-muted">{label}</span>
      <span className="mt-1.5 block font-tabular text-2xl font-semibold text-parchment">
        {value}
      </span>
      {delta && (
        <span className={cn("mt-1 block text-xs font-medium", toneClasses[deltaTone])}>
          {delta}
        </span>
      )}
    </div>
  );
}
