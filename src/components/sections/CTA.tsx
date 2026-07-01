"use client";

import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";

type Status = "idle" | "submitting" | "success" | "error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function CTA() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) {
      setError("Enter a valid email address.");
      setStatus("error");
      return;
    }
    setError("");
    setStatus("submitting");
    setTimeout(() => {
      setStatus("success");
    }, 900);
  }

  return (
    <section id="access" className="relative py-28 sm:py-40">
      <div className="mx-auto max-w-3xl px-6 text-center sm:px-10">
        <Reveal>
          <span className="flex items-center justify-center gap-3 text-xs font-medium uppercase tracking-[0.2em] text-brass-bright">
            <span className="h-px w-8 bg-brass-bright/60" />
            Request access
            <span className="h-px w-8 bg-brass-bright/60" />
          </span>
        </Reveal>

        <Reveal delay={0.08}>
          <h2 className="mt-6 font-display text-4xl font-light leading-[1.1] text-parchment text-balance sm:text-5xl">
            Acre is being built for a small first group of members.
          </h2>
        </Reveal>

        <Reveal delay={0.16}>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-parchment-dim">
            Leave your email and we&apos;ll reach out as seats open. No spam, no
            newsletter — just an invitation when it&apos;s ready.
          </p>
        </Reveal>

        <Reveal delay={0.24}>
          <div className="mx-auto mt-10 max-w-md">
            <AnimatePresence mode="wait">
              {status === "success" ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-hairline-strong bg-ink-2 px-6 py-8"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-bright text-ink">
                    ✓
                  </span>
                  <p className="font-display text-lg text-parchment">You&apos;re on the list.</p>
                  <p className="text-sm text-muted">
                    We&apos;ll write to {email} when a seat is ready.
                  </p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={onSubmit}
                  className="flex flex-col gap-3 sm:flex-row"
                  noValidate
                >
                  <div className="flex-1 text-left">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (status === "error") setStatus("idle");
                      }}
                      placeholder="you@domain.com"
                      aria-label="Email address"
                      aria-invalid={status === "error"}
                      className="w-full rounded-full border border-hairline-strong bg-ink-2 px-5 py-3.5 text-sm text-parchment placeholder:text-muted outline-none transition-colors duration-200 focus:border-brass"
                    />
                    {status === "error" && (
                      <p className="mt-2 pl-1 text-left text-xs text-rust-bright">{error}</p>
                    )}
                  </div>
                  <Button type="submit" disabled={status === "submitting"} className="shrink-0">
                    {status === "submitting" ? "Submitting…" : "Request access"}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
