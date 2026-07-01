import { type ReactNode } from "react";
import { Reveal } from "./Reveal";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      <Reveal>
        <span className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.2em] text-brass-bright">
          <span className="h-px w-8 bg-brass-bright/60" />
          {eyebrow}
        </span>
      </Reveal>
      <Reveal delay={0.08}>
        <h2 className="mt-5 font-display text-4xl font-light leading-[1.1] text-parchment text-balance sm:text-5xl">
          {title}
        </h2>
      </Reveal>
      {description && (
        <Reveal delay={0.16}>
          <p className="mt-5 text-base leading-relaxed text-parchment-dim sm:text-lg">
            {description}
          </p>
        </Reveal>
      )}
    </div>
  );
}
