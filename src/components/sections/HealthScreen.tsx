"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScreenFrame } from "@/components/ui/ScreenFrame";
import { Reveal } from "@/components/ui/Reveal";
import { Gauge } from "@/components/charts/Gauge";
import { dashboardStats, healthActions, healthBreakdown } from "@/lib/data";
import { cn } from "@/lib/utils";

export function HealthScreen() {
  const [openAction, setOpenAction] = useState<number | null>(0);
  const [applied, setApplied] = useState<Set<number>>(new Set());

  function apply(i: number) {
    setApplied((prev) => new Set(prev).add(i));
  }

  return (
    <section id="health" className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <SectionHeading
          eyebrow="06 · Health"
          title="One score, built from the five things that actually predict trouble."
          description="Reserve coverage, debt load, how consistently you save, how spread out your investments are, and whether you're actually insured for the life you have now. Each has a specific next step attached, not just a color."
        />

        <Reveal delay={0.1} className="mt-14">
          <ScreenFrame title="Health score" subtitle="Recalculated daily">
            <div className="grid gap-10 lg:grid-cols-[auto_1fr]">
              <div className="flex flex-col items-center justify-center border-hairline lg:border-r lg:pr-10">
                <Gauge value={dashboardStats.healthScore} />
              </div>

              <div>
                <div className="flex flex-col gap-4">
                  {healthBreakdown.map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-parchment-dim">{item.label}</span>
                        <span className="font-tabular text-parchment">{item.score}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ink">
                        <motion.div
                          className={cn(
                            "h-full rounded-full",
                            item.score >= 80
                              ? "bg-emerald-bright"
                              : item.score >= 60
                                ? "bg-brass-bright"
                                : "bg-rust-bright"
                          )}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${item.score}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-muted">{item.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-10 border-t border-hairline pt-8">
              <span className="coord-label text-muted">
                Recommended actions
              </span>
              <div className="mt-4 flex flex-col gap-3">
                {healthActions.map((action, i) => {
                  const isApplied = applied.has(i);
                  const isOpen = openAction === i;
                  return (
                    <div
                      key={action.title}
                      className={cn(
                        "rounded-xl border border-hairline bg-ink transition-opacity duration-300",
                        isApplied && "opacity-50"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenAction(isOpen ? null : i)}
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px]",
                              isApplied
                                ? "border-emerald-bright bg-emerald-bright text-ink"
                                : "border-hairline-strong text-transparent"
                            )}
                          >
                            ✓
                          </span>
                          <span
                            className={cn(
                              "text-sm text-parchment",
                              isApplied && "line-through"
                            )}
                          >
                            {action.title}
                          </span>
                        </div>
                        <span className="shrink-0 text-xs font-medium text-emerald-bright">
                          {action.impact}
                        </span>
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && !isApplied && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="flex flex-col gap-3 px-5 pb-5 pl-[3.25rem]">
                              <p className="text-xs leading-relaxed text-parchment-dim">
                                {action.detail}
                              </p>
                              <button
                                type="button"
                                onClick={() => apply(i)}
                                className="w-fit rounded-full bg-brass px-4 py-1.5 text-xs font-medium text-ink transition-colors duration-200 hover:bg-brass-bright"
                              >
                                Apply recommendation
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          </ScreenFrame>
        </Reveal>
      </div>
    </section>
  );
}
