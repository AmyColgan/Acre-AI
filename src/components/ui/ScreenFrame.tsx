import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PlotMarks } from "@/components/ui/PlotMarks";

interface ScreenFrameProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ScreenFrame({ title, subtitle, actions, children, className }: ScreenFrameProps) {
  return (
    <div
      className={cn(
        "grain relative overflow-hidden rounded-3xl border border-hairline-strong bg-ink-2 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.7)]",
        className
      )}
    >
      <PlotMarks />
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline px-6 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-bright opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-bright" />
          </span>
          <div>
            <h3 className="font-display text-lg font-medium text-parchment">{title}</h3>
            {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
          </div>
        </div>
        {actions}
      </div>
      <div className="p-6 sm:p-8">{children}</div>
    </div>
  );
}
