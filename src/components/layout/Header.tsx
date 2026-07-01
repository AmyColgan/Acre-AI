"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/ui/LogoMark";

const NAV_LINKS = [
  { label: "Product", href: "#dashboard" },
  { label: "Intelligence", href: "#planner" },
  { label: "Health", href: "#health" },
  { label: "Access", href: "#access" },
];

export function Header() {
  const { scrollY } = useScroll();
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setSolid(latest > 40);
  });

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color] duration-500",
        solid
          ? "border-b border-hairline bg-ink/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 sm:px-10">
        <a
          href="#top"
          className="flex items-center gap-2.5 text-parchment"
        >
          <LogoMark size={26} className="text-brass-bright" />
          <span className="font-display text-xl font-medium tracking-wide">Acre</span>
        </a>

        <nav className="hidden items-center gap-9 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-parchment-dim transition-colors duration-200 hover:text-brass-bright"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a
          href="#access"
          className="hidden rounded-full border border-hairline-strong px-5 py-2 text-sm text-parchment transition-colors duration-200 hover:border-brass hover:text-brass-bright md:inline-flex"
        >
          Request access
        </a>

        <button
          type="button"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 flex-col items-center justify-center gap-[5px] md:hidden"
        >
          <span
            className={cn(
              "h-px w-5 bg-parchment transition-transform duration-300",
              open && "translate-y-[3px] rotate-45"
            )}
          />
          <span
            className={cn(
              "h-px w-5 bg-parchment transition-transform duration-300",
              open && "-translate-y-[3px] -rotate-45"
            )}
          />
        </button>
      </div>

      {open && (
        <motion.nav
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="flex flex-col gap-1 border-t border-hairline bg-ink px-6 pb-6 md:hidden"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="py-3 text-base text-parchment-dim transition-colors duration-200 hover:text-brass-bright"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#access"
            onClick={() => setOpen(false)}
            className="mt-2 rounded-full border border-hairline-strong px-5 py-2.5 text-center text-sm text-parchment"
          >
            Request access
          </a>
        </motion.nav>
      )}
    </motion.header>
  );
}
