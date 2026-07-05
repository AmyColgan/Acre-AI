"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icons";
import { ProgressRing } from "@/components/ui/core";
import { Sparkline } from "@/components/charts";
import { usePulse } from "@/lib/store";

const FEATURES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "sparkles",
    title: "AI Financial Planner",
    body: "Ask anything about your money and get answers computed from your real numbers — impact, risk, and the next move included.",
  },
  {
    icon: "scale",
    title: "Decision Mode",
    body: "Score any purchase before you make it. Pulse shows the cash impact, goal delays, and better alternatives — out of 100.",
  },
  {
    icon: "target",
    title: "Goals & Wealth Planning",
    body: "Every goal gets a projected finish date, a conflict detector, and a 10-year wealth projection across four paths.",
  },
  {
    icon: "wallet",
    title: "Budget & Cash Flow",
    body: "A safe-to-spend number that already accounts for bills, goals, and debt — plus a calendar that flags low-balance days.",
  },
  {
    icon: "chartLine",
    title: "Investment Insights",
    body: "Allocation, risk, and alignment scoring with 10-year projections that update the moment you change a contribution.",
  },
  {
    icon: "pulse",
    title: "Financial Health Score",
    body: "One score out of 1000, built from seven subscores — and a ranked list of exactly what to fix first.",
  },
];

const STEPS = [
  { n: "01", title: "It watches", body: "Pulse reads income, spending, debt, goals, and investments as one living system — not eleven separate lists." },
  { n: "02", title: "It explains", body: "Every number ships with a plain-English reason. What changed, why it matters, what it touches next." },
  { n: "03", title: "It acts", body: "Recommendations become one-tap actions that actually move money in your plan — and your score responds instantly." },
];

const METRICS = [
  { value: "$16,670", label: "demo net worth mapped" },
  { value: "743", label: "data points analyzed daily" },
  { value: "12", label: "decision factors per purchase" },
  { value: "< 1s", label: "from question to answer" },
];

export default function Landing() {
  const router = useRouter();
  const { state, hydrated } = usePulse();

  const launch = () => {
    if (hydrated && state.flags.launched) router.push("/dashboard");
    else router.push("/onboarding");
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* scenery */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="aurora" />
        <div className="orb orb-drift left-[-12%] top-[-10%] h-[540px] w-[540px] bg-blue-600/12" />
        <div className="orb orb-drift-slow right-[-10%] top-[16%] h-[480px] w-[480px] bg-indigo-600/10" />
        <div className="orb orb-drift bottom-[-16%] left-[30%] h-[420px] w-[420px] bg-emerald-600/8" />
        <div className="bg-grid absolute inset-0" />
      </div>

      {/* nav */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2.5">
          <span className="ai-pulse flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
            <Icon name="logo" size={20} strokeWidth={2.2} />
          </span>
          <span className="text-lg font-bold tracking-wide">
            PULSE <span className="bg-gradient-to-r from-sky-300 to-cyan-300 bg-clip-text text-transparent">AI</span>
          </span>
        </div>
        <button
          onClick={launch}
          className="rounded-xl border border-line bg-panel/60 px-4 py-2 text-sm text-fog backdrop-blur transition-colors hover:border-line-strong hover:text-snow cursor-pointer"
        >
          Open the app
        </button>
      </header>

      {/* hero */}
      <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-10 lg:grid-cols-[1.05fr_1fr] lg:pt-16">
        <div>
          <div className="rise-in inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-mint">
            <span className="ai-breathe h-1.5 w-1.5 rounded-full bg-mint" />
            Your AI financial strategist for every money decision
          </div>
          <h1 className="font-display rise-in mt-5 text-4xl leading-[1.06] tracking-tight sm:text-5xl lg:text-[3.5rem]" style={{ animationDelay: "80ms" }}>
            Meet the AI financial strategist that turns your money into a{" "}
            <span className="bg-gradient-to-r from-sky-300 via-cyan-200 to-white bg-clip-text italic text-transparent">
              living plan.
            </span>
          </h1>
          <p className="rise-in mt-5 max-w-xl text-base leading-relaxed text-fog sm:text-lg" style={{ animationDelay: "160ms" }}>
            Pulse AI analyzes your income, spending, goals, debt, and investments to tell you what
            changed, what matters, and what to do next.
          </p>
          <div className="rise-in mt-8 flex flex-wrap items-center gap-4" style={{ animationDelay: "240ms" }}>
            <button
              onClick={launch}
              className="group inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 px-7 py-3.5 text-base font-semibold text-white shadow-[0_20px_50px_-12px_rgba(8,145,178,0.7)] transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
            >
              Launch Financial Command Center
              <Icon name="arrowRight" size={18} className="transition-transform group-hover:translate-x-1" />
            </button>
            <span className="text-xs text-dim">
              Understand your money. Improve your choices.
              <br />
              Build your future.
            </span>
          </div>
        </div>

        {/* hero mockup */}
        <div className="relative mx-auto mb-20 w-full max-w-md lg:mb-10 lg:max-w-none">
          <div className="glass rise-in relative rounded-2xl p-5" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-dim">Net worth</div>
                <div className="mt-0.5 text-3xl font-bold font-tabular">$16,670</div>
                <div className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-mint">
                  <Icon name="trendingUp" size={13} /> +$620 this month
                </div>
              </div>
              <ProgressRing
                pct={64}
                size={84}
                stroke={7}
                color="var(--color-good)"
                label={<span className="text-lg font-bold font-tabular">641</span>}
                sub={<span className="text-[9px] uppercase tracking-wide text-dim">health</span>}
              />
            </div>
            <div className="mt-4 rounded-xl border border-line bg-panel/70 p-3">
              <div className="mb-1 flex items-center justify-between text-[11px] text-dim">
                <span>Net worth trend · 12 months</span>
                <span className="text-mint">▲ 17%</span>
              </div>
              <Sparkline data={[9.4, 10.1, 9.8, 10.9, 11.6, 12.2, 12.0, 13.1, 14.0, 14.8, 15.9, 16.7]} width={310} height={44} color="var(--color-chart-1)" />
            </div>
          </div>

          {/* AI insight card */}
          <div className="glass-strong rise-in absolute -left-4 -bottom-20 w-[78%] rounded-2xl p-4 sm:-left-8" style={{ animationDelay: "360ms" }}>
            <div className="flex items-start gap-2.5">
              <span className="ai-breathe mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
                <Icon name="sparkles" size={13} />
              </span>
              <div>
                <div className="text-xs font-semibold text-snow">Pulse insight</div>
                <p className="mt-1 text-[11px] leading-relaxed text-fog">
                  Dining is 18% above normal. Moving $250 to savings today keeps your emergency fund
                  on schedule.
                </p>
              </div>
            </div>
          </div>

          {/* opportunity chip */}
          <div className="glass rise-in absolute -right-2 -top-6 rounded-xl px-3.5 py-2.5 sm:-right-6" style={{ animationDelay: "440ms" }}>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/15 text-mint">
                <Icon name="lightbulb" size={13} />
              </span>
              <div>
                <div className="font-semibold text-snow">Save $412</div>
                <div className="text-[10px] text-dim">pay the 24.99% card first</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* metrics band */}
      <section className="relative z-10 border-y border-line bg-deep/50 backdrop-blur">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-8 sm:grid-cols-4">
          {METRICS.map((m) => (
            <div key={m.label} className="text-center">
              <div className="text-2xl font-bold font-tabular sm:text-3xl">{m.value}</div>
              <div className="mt-1 text-xs text-dim">{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* features */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 py-20">
        <h2 className="font-display text-center text-2xl tracking-tight sm:text-3xl">
          Not a budgeting app. A{" "}
          <span className="bg-gradient-to-r from-sky-300 to-cyan-300 bg-clip-text text-transparent">
            command center.
          </span>
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-fog">
          Pulse doesn&apos;t just show you what happened. It explains what&apos;s happening now, predicts
          what&apos;s next, and hands you the action.
        </p>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="glass hover-lift rounded-2xl p-6" style={{ animationDelay: `${i * 60}ms` }}>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/15 to-cyan-500/15 text-pulse">
                <Icon name={f.icon} size={20} />
              </span>
              <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fog">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* how the AI thinks */}
      <section className="relative z-10 border-t border-line bg-deep/40">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-2xl tracking-tight sm:text-3xl">How the intelligence works</h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-fog">
                Every recommendation is computed from your actual data — balances, rates, budgets, and
                deadlines — then explained in plain language. No black box, no generic tips.
              </p>
              <div className="mt-8 space-y-6">
                {STEPS.map((s) => (
                  <div key={s.n} className="flex gap-4">
                    <span className="font-mono text-sm font-bold text-pulse">{s.n}</span>
                    <div>
                      <div className="text-sm font-semibold">{s.title}</div>
                      <p className="mt-1 text-sm leading-relaxed text-fog">{s.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-dim">
                <Icon name="scale" size={14} className="text-iris" /> Decision Mode preview
              </div>
              <div className="mt-4 flex items-center gap-5">
                <ProgressRing
                  pct={68}
                  size={96}
                  stroke={8}
                  color="var(--color-warn)"
                  label={<span className="text-2xl font-bold font-tabular">68</span>}
                  sub={<span className="text-[9px] uppercase tracking-wide text-dim">/ 100</span>}
                />
                <div>
                  <div className="text-sm font-semibold">&ldquo;Buy a $900 laptop&rdquo;</div>
                  <div className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-gold">
                    <Icon name="clock" size={12} /> Wait 30 days
                  </div>
                </div>
              </div>
              <p className="mt-4 rounded-xl border border-line bg-panel/70 p-3.5 text-xs leading-relaxed text-fog">
                &ldquo;You can afford this purchase, but buying now delays your emergency fund by 27
                days. Waiting until after rent clears keeps your cash flow safer.&rdquo;
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "Cash impact", value: "−$900" },
                  { label: "EF delay", value: "27 days" },
                  { label: "Risk", value: "Medium" },
                ].map((x) => (
                  <div key={x.label} className="rounded-lg border border-line bg-panel/60 px-2 py-2">
                    <div className="text-xs font-semibold font-tabular">{x.value}</div>
                    <div className="mt-0.5 text-[10px] text-dim">{x.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* trust */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 py-20">
        <div className="glass rounded-2xl p-8 sm:p-12">
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                icon: "shield" as IconName,
                title: "Your data stays yours",
                body: "Everything lives locally in your browser. Export it, import it, or wipe it — one click, no servers.",
              },
              {
                icon: "eye" as IconName,
                title: "Transparent math",
                body: "Every score and recommendation shows its calculation. Tap 'Explain this' anywhere you see a number.",
              },
              {
                icon: "graduation" as IconName,
                title: "Educational by design",
                body: "Pulse teaches planning, not trading. It's a strategist for decisions — not financial advice.",
              },
            ].map((t) => (
              <div key={t.title} className="text-center sm:text-left">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/12 text-mint">
                  <Icon name={t.icon} size={19} />
                </span>
                <h3 className="mt-3 text-sm font-semibold">{t.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fog">{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* final CTA */}
      <section className="relative z-10 px-5 pb-24 text-center">
        <h2 className="font-display text-2xl tracking-tight sm:text-3xl">
          Your money already has a pulse.
          <br />
          Start listening to it.
        </h2>
        <button
          onClick={launch}
          className="group mt-8 inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-4 text-base font-semibold text-white shadow-[0_20px_50px_-12px_rgba(8,145,178,0.7)] transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
        >
          Launch Financial Command Center
          <Icon name="arrowRight" size={18} className="transition-transform group-hover:translate-x-1" />
        </button>
        <p className="mt-4 text-xs text-dim">Loaded with a full demo profile — or bring your own numbers in onboarding.</p>
      </section>

      <footer className="relative z-10 border-t border-line py-8 text-center text-xs text-dim">
        PULSE AI · Educational planning only. Not financial advice. ·{" "}
        <Link href="/dashboard" className="text-fog hover:text-snow">
          Open dashboard
        </Link>
      </footer>
    </div>
  );
}
