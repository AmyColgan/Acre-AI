"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { netWorthSeries, netWorthNow, netWorthDeltaYear } from "@/lib/data";
import { formatCurrency, formatSigned } from "@/lib/utils";

const AMBIENT_WIDTH = 1000;
const AMBIENT_HEIGHT = 360;

function buildAmbientPath() {
  const data = netWorthSeries("5Y");
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const stepX = AMBIENT_WIDTH / (values.length - 1);
  return values
    .map((v, i) => {
      const x = i * stepX;
      const y = AMBIENT_HEIGHT - ((v - min) / (max - min)) * AMBIENT_HEIGHT;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export function Hero() {
  const path = useMemo(() => buildAmbientPath(), []);
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
      {/* Ambient net-worth line, faint, behind the copy */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] opacity-[0.14]">
        {path && (
          <svg
            viewBox={`0 0 ${AMBIENT_WIDTH} ${AMBIENT_HEIGHT}`}
            preserveAspectRatio="none"
            className="h-full w-full"
          >
            <motion.path
              d={path}
              fill="none"
              stroke="var(--color-brass-bright)"
              strokeWidth={1.5}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2.6, ease: [0.16, 1, 0.3, 1] }}
            />
          </svg>
        )}
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-6 sm:px-10">
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.25em] text-brass-bright"
        >
          <span className="h-px w-8 bg-brass-bright/60" />
          Private wealth intelligence
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 max-w-4xl font-display text-5xl font-light leading-[1.05] text-parchment text-balance sm:text-6xl lg:text-7xl"
        >
          Money deserves the same clarity as everything else you take seriously.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="mt-7 max-w-xl text-base leading-relaxed text-parchment-dim sm:text-lg"
        >
          Most financial tools show you numbers. Acre is built to reason about
          them — reading income, spending, goals, and holdings as one system,
          and speaking plainly about what to do next.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex flex-col gap-8 sm:flex-row sm:items-end"
        >
          <div>
            <span className="block text-xs uppercase tracking-wide text-muted">
              Net worth, live
            </span>
            <span className="mt-1 block font-tabular text-4xl font-semibold text-parchment">
              {formatCurrency(count)}
            </span>
            <span className="mt-1 block text-sm text-emerald-bright">
              {formatSigned(netWorthDeltaYear, { percent: true })} over the last year
            </span>
          </div>

          <a
            href="#dashboard"
            className="inline-flex w-fit items-center gap-2 rounded-full bg-brass px-6 py-3 text-sm font-medium text-ink transition-colors duration-300 hover:bg-brass-bright"
          >
            See it in motion
          </a>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="mx-auto mb-10 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted"
      >
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="h-8 w-px bg-hairline-strong"
        />
        Scroll to explore
      </motion.div>
    </section>
  );
}
