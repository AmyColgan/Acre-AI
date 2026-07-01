"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Topography } from "@/components/graphics/Topography";
import { netWorthNow, netWorthDeltaYear } from "@/lib/data";
import { formatCurrency, formatSigned } from "@/lib/utils";

export function Hero() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const controls = { value: 0 };
    const duration = 1600;
    const start = performance.now();
    let raf: number;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      controls.value = eased * netWorthNow;
      setCount(controls.value);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section
      id="top"
      className="grain relative flex min-h-[100svh] flex-col justify-between overflow-hidden pt-32"
    >
      <Topography
        seed={4}
        peakCount={3}
        ringsPerPeak={10}
        width={1400}
        height={800}
        strokeOpacity={0.16}
        className="pointer-events-none absolute inset-0 h-full w-full text-brass-bright"
      />

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-6 sm:px-10">
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.25em] text-brass-bright"
        >
          <span className="h-px w-8 bg-brass-bright/60" />
          Surveyed, not guessed
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 max-w-4xl font-display text-5xl font-light leading-[1.05] text-parchment text-balance sm:text-6xl lg:text-7xl"
        >
          You&rsquo;d never buy land without a survey. Most people run their
          finances without one.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="mt-7 max-w-xl text-base leading-relaxed text-parchment-dim sm:text-lg"
        >
          Acre pulls every account, bill, and holding into one plot,
          re-surveyed every night. Ask it something and it shows its
          math, not just a number.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex flex-col gap-8 sm:flex-row sm:items-end"
        >
          <div>
            <span className="coord-label block text-muted">
              Net worth, live
            </span>
            <span className="mt-1 block font-tabular text-4xl font-semibold text-parchment">
              {formatCurrency(count)}
            </span>
            <span className="mt-1 block text-sm text-emerald-bright">
              {formatSigned(netWorthDeltaYear, { percent: true })} since last year
            </span>
          </div>

          <a
            href="#dashboard"
            className="inline-flex w-fit items-center gap-2 rounded-full bg-brass px-6 py-3 text-sm font-medium text-ink transition-colors duration-300 hover:bg-brass-bright"
          >
            Walk through it
          </a>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="coord-label mx-auto mb-10 flex items-center gap-3 text-muted"
      >
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="h-8 w-px bg-hairline-strong"
        />
        Keep going
      </motion.div>
    </section>
  );
}
