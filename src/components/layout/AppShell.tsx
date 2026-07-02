"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icons";
import { Orbs, ToastViewport } from "@/components/ui/core";
import { usePulse } from "@/lib/store";
import { getHealth } from "@/lib/calc";
import { fmtMoney } from "@/lib/format";
import { AIPanel, AIFloatingButton } from "./AIPanel";

export const NAV_ITEMS: { href: string; label: string; icon: IconName }[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/planner", label: "AI Planner", icon: "sparkles" },
  { href: "/decisions", label: "Decision Mode", icon: "scale" },
  { href: "/goals", label: "Goals & Wealth", icon: "target" },
  { href: "/budget", label: "Budget & Cash Flow", icon: "wallet" },
  { href: "/investments", label: "Investments", icon: "chartLine" },
  { href: "/health", label: "Health Center", icon: "pulse" },
  { href: "/opportunities", label: "Opportunity Feed", icon: "lightbulb" },
  { href: "/actions", label: "Action Center", icon: "checkCircle" },
  { href: "/reports", label: "Reports", icon: "fileText" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

/* --------------------------------- sidebar ---------------------------------- */

function Sidebar() {
  const pathname = usePathname();
  const { state } = usePulse();
  const health = useMemo(() => getHealth(state), [state]);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-line bg-deep/70 backdrop-blur-xl lg:flex">
      <Link href="/dashboard" className="flex items-center gap-2.5 px-5 pb-4 pt-6">
        <span className="ai-pulse flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-lg">
          <Icon name="logo" size={20} strokeWidth={2.2} />
        </span>
        <span className="text-[17px] font-bold tracking-wide">
          PULSE <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">AI</span>
        </span>
      </Link>

      <div className="mx-4 mb-4 flex items-center gap-3 rounded-xl border border-line bg-panel/60 p-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-600 text-sm font-bold text-white">
          {state.profile.name.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{state.profile.name}</div>
          <div className="text-[11px] capitalize text-dim">{state.profile.riskLevel} · {state.profile.coachingStyle}</div>
        </div>
        <Link
          href="/health"
          className="flex flex-col items-center rounded-lg border border-line bg-raise px-2 py-1 transition-colors hover:border-line-strong"
          title="Financial health score"
        >
          <span
            className="text-xs font-bold font-tabular"
            style={{ color: health.total >= 650 ? "var(--color-good)" : health.total >= 480 ? "var(--color-warn)" : "var(--color-bad)" }}
          >
            {health.total}
          </span>
          <span className="text-[9px] uppercase tracking-wide text-dim">score</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4 scrollbar-none">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                active
                  ? "bg-gradient-to-r from-blue-500/15 to-transparent text-snow shadow-[inset_2px_0_0_var(--color-pulse)]"
                  : "text-fog hover:bg-raise/70 hover:text-snow"
              )}
            >
              <Icon name={item.icon} size={17} className={active ? "text-pulse" : "text-dim group-hover:text-fog"} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line px-5 py-4 text-[11px] text-dim">
        Educational planning only.
        <br />
        Not financial advice.
      </div>
    </aside>
  );
}

/* ---------------------------------- header ---------------------------------- */

function Header({ onOpenAI }: { onOpenAI: () => void }) {
  const { state, markNotificationsRead } = usePulse();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [showBell, setShowBell] = useState(false);
  const [showQuick, setShowQuick] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const quickRef = useRef<HTMLDivElement>(null);

  const unread = state.notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!searchRef.current?.contains(e.target as Node)) setShowResults(false);
      if (!bellRef.current?.contains(e.target as Node)) setShowBell(false);
      if (!quickRef.current?.contains(e.target as Node)) setShowQuick(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  const results = useMemo(() => {
    if (query.trim().length < 2) return { pages: [], txs: [] };
    const q = query.toLowerCase();
    return {
      pages: NAV_ITEMS.filter((n) => n.label.toLowerCase().includes(q)).slice(0, 3),
      txs: state.transactions
        .filter((t) => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q))
        .slice(0, 5),
    };
  }, [query, state.transactions]);

  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-void/75 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
        {/* mobile logo */}
        <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 text-white">
            <Icon name="logo" size={17} strokeWidth={2.2} />
          </span>
        </Link>

        {/* search */}
        <div ref={searchRef} className="relative flex-1 max-w-md">
          <Icon name="search" size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            placeholder="Search transactions, pages…"
            className="w-full rounded-xl border border-line bg-panel/70 py-2 pl-9 pr-3 text-sm text-snow placeholder:text-dim outline-none transition-colors focus:border-blue-500/50"
          />
          {showResults && (results.pages.length > 0 || results.txs.length > 0) && (
            <div className="glass-strong absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl scale-in">
              {results.pages.map((p) => (
                <button
                  key={p.href}
                  onClick={() => {
                    router.push(p.href);
                    setQuery("");
                    setShowResults(false);
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-fog transition-colors hover:bg-raise hover:text-snow cursor-pointer"
                >
                  <Icon name={p.icon} size={14} className="text-pulse" />
                  {p.label}
                  <span className="ml-auto text-[10px] uppercase tracking-wide text-dim">page</span>
                </button>
              ))}
              {results.txs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    router.push(`/budget?q=${encodeURIComponent(t.name)}`);
                    setQuery("");
                    setShowResults(false);
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-fog transition-colors hover:bg-raise hover:text-snow cursor-pointer"
                >
                  <Icon name="wallet" size={14} className="text-mint" />
                  <span className="truncate">{t.name}</span>
                  <span className="ml-auto shrink-0 font-tabular text-xs text-snow">
                    {t.type === "income" ? "+" : "−"}{fmtMoney(t.amount)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5">
          {/* date */}
          <span className="hidden text-xs text-dim md:block">{dateStr}</span>

          {/* AI status */}
          <button
            onClick={onOpenAI}
            className="hidden items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-mint transition-colors hover:bg-emerald-500/20 sm:inline-flex cursor-pointer"
            title="Pulse AI is monitoring your finances"
          >
            <span className="ai-breathe h-1.5 w-1.5 rounded-full bg-mint" />
            AI active
          </button>

          {/* quick action */}
          <div ref={quickRef} className="relative">
            <button
              onClick={() => setShowQuick((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_6px_20px_-6px_rgba(59,130,246,0.7)] transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              aria-label="Quick actions"
            >
              <Icon name="plus" size={17} strokeWidth={2.2} />
            </button>
            {showQuick && (
              <div className="glass-strong absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl scale-in">
                {[
                  { label: "Add transaction", href: "/budget?add=1", icon: "wallet" as IconName },
                  { label: "New decision", href: "/decisions", icon: "scale" as IconName },
                  { label: "Add goal", href: "/goals?add=1", icon: "target" as IconName },
                  { label: "Ask Pulse AI", href: "", icon: "sparkles" as IconName },
                ].map((a) => (
                  <button
                    key={a.label}
                    onClick={() => {
                      setShowQuick(false);
                      if (a.href) router.push(a.href);
                      else onOpenAI();
                    }}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-fog transition-colors hover:bg-raise hover:text-snow cursor-pointer"
                  >
                    <Icon name={a.icon} size={14} className="text-pulse" />
                    {a.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* bell */}
          <div ref={bellRef} className="relative">
            <button
              onClick={() => {
                setShowBell((v) => !v);
                if (!showBell && unread > 0) markNotificationsRead();
              }}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-panel/70 text-fog transition-colors hover:text-snow cursor-pointer"
              aria-label="Notifications"
            >
              <Icon name="bell" size={16} />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-coral text-[9px] font-bold text-void">
                  {unread}
                </span>
              )}
            </button>
            {showBell && (
              <div className="glass-strong absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl scale-in">
                <div className="border-b border-line px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-dim">
                  Notifications
                </div>
                {state.notifications.map((n) => (
                  <div key={n.id} className="border-b border-line/50 px-4 py-3 last:border-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={clsx(
                          "h-1.5 w-1.5 rounded-full",
                          n.tone === "good" ? "bg-mint" : n.tone === "warn" ? "bg-gold" : "bg-pulse"
                        )}
                      />
                      <span className="text-xs font-semibold">{n.title}</span>
                      <span className="ml-auto text-[10px] text-dim">{n.time}</span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-fog">{n.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* avatar */}
          <Link
            href="/settings"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-600 text-sm font-bold text-white ring-1 ring-line transition-transform hover:scale-105"
            title="Settings"
          >
            {state.profile.name.slice(0, 1).toUpperCase()}
          </Link>
        </div>
      </div>
    </header>
  );
}

/* -------------------------------- mobile nav -------------------------------- */

const MOBILE_ITEMS: { href: string; label: string; icon: IconName }[] = [
  { href: "/dashboard", label: "Home", icon: "dashboard" },
  { href: "/budget", label: "Budget", icon: "wallet" },
  { href: "/goals", label: "Goals", icon: "target" },
  { href: "/health", label: "Health", icon: "pulse" },
];

function MobileNav({ onMore }: { onMore: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-deep/85 backdrop-blur-xl lg:hidden">
      <div className="flex items-stretch justify-around pb-[env(safe-area-inset-bottom)]">
        {MOBILE_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] transition-colors",
                active ? "text-pulse" : "text-dim"
              )}
            >
              <Icon name={item.icon} size={19} />
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={onMore}
          className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] text-dim cursor-pointer"
        >
          <Icon name="menu" size={19} />
          More
        </button>
      </div>
    </nav>
  );
}

function MobileMoreSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-void/75 backdrop-blur-sm fade-in" onClick={onClose} />
      <div className="glass-strong absolute inset-x-0 bottom-0 rounded-t-2xl p-4 pb-8 scale-in">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-raise-2" />
        <div className="grid grid-cols-3 gap-2">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center text-[11px] transition-colors",
                  active
                    ? "border-blue-500/40 bg-blue-500/10 text-snow"
                    : "border-line bg-panel/60 text-fog"
                )}
              >
                <Icon name={item.icon} size={19} className={active ? "text-pulse" : ""} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- shell ----------------------------------- */

export function AppShell({ children }: { children: ReactNode }) {
  const [aiOpen, setAiOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      <Orbs dim />
      <Sidebar />
      <div className="relative lg:pl-60">
        <Header onOpenAI={() => setAiOpen(true)} />
        <main key={pathname} className="fade-in relative mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:pb-12">
          {children}
        </main>
      </div>
      <MobileNav onMore={() => setMoreOpen(true)} />
      <MobileMoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
      <AIFloatingButton onClick={() => setAiOpen(true)} open={aiOpen} />
      <AIPanel open={aiOpen} onClose={() => setAiOpen(false)} />
      <ToastViewport />
    </div>
  );
}
