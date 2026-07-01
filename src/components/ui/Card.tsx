import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-hairline bg-ink-2/80 backdrop-blur-sm",
        className
      )}
      {...props}
    />
  );
}
