"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  ActionTask,
  BudgetCategory,
  CategoryId,
  DecisionReport,
  Goal,
  Opportunity,
  Profile,
  PulseState,
  SavedRecommendation,
  TaskEffect,
  Transaction,
} from "./types";
import { createSeedState, STATE_VERSION, STORAGE_KEY } from "./seed";
import { uid } from "./format";

/* --------------------------------- toasts ---------------------------------- */

export interface Toast {
  id: string;
  message: string;
  tone: "success" | "info" | "warn";
}

/* --------------------------------- context --------------------------------- */

interface PulseContextValue {
  state: PulseState;
  hydrated: boolean;
  toasts: Toast[];
  toast: (message: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: string) => void;

  patch: (fn: (s: PulseState) => PulseState) => void;
  updateProfile: (p: Partial<Profile>) => void;
  setMonthlyIncome: (n: number) => void;

  addTransaction: (t: Omit<Transaction, "id">) => void;
  deleteTransaction: (id: string) => void;

  updateCategory: (id: CategoryId, patch: Partial<BudgetCategory>) => void;

  addGoal: (g: Omit<Goal, "id">) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  contributeToGoal: (id: string, amount: number) => void;

  addTask: (t: Omit<ActionTask, "id" | "status">) => void;
  completeTask: (id: string) => void;
  dismissTask: (id: string) => void;

  setOpportunityStatus: (id: string, status: Opportunity["status"]) => void;

  saveDecision: (d: DecisionReport) => void;
  saveRecommendation: (r: Omit<SavedRecommendation, "id" | "createdAt">) => void;

  applyEffect: (effect: TaskEffect, label?: string) => void;
  applyBrief: () => void;

  markNotificationsRead: () => void;

  resetDemo: () => void;
  clearAll: () => void;
  importState: (json: string) => boolean;
}

const PulseContext = createContext<PulseContextValue | null>(null);

export function usePulse(): PulseContextValue {
  const ctx = useContext(PulseContext);
  if (!ctx) throw new Error("usePulse must be used inside PulseProvider");
  return ctx;
}

/* -------------------------------- provider --------------------------------- */

export function PulseProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PulseState>(() => createSeedState());
  const [hydrated, setHydrated] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // hydrate once from localStorage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PulseState;
        if (parsed?.version === STATE_VERSION && parsed.profile) {
          // one-time sync from localStorage (an external store) after mount —
          // a lazy initializer would break SSR/client HTML consistency.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setState(parsed);
        }
      }
    } catch {
      // corrupted storage — fall back to seed
    }
    setHydrated(true);
  }, []);

  // persist on change (after hydration, so we don't clobber saved data with seed)
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage full or unavailable — app still works in memory
    }
  }, [state, hydrated]);

  // theme preference (Graphite default vs neutral Charcoal) applies as CSS variables
  useEffect(() => {
    const charcoal = !!state.flags["themeCharcoal"];
    const root = document.documentElement;
    root.style.setProperty("--color-void", charcoal ? "#0b0b0e" : "#0a0d12");
    root.style.setProperty("--color-deep", charcoal ? "#101013" : "#0d1117");
    root.style.setProperty("--color-panel", charcoal ? "#15151a" : "#11161d");
  }, [state.flags]);

  const dismissToast = useCallback((id: string) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
    const timer = timers.current[id];
    if (timer) clearTimeout(timer);
    delete timers.current[id];
  }, []);

  const toast = useCallback(
    (message: string, tone: Toast["tone"] = "success") => {
      const id = uid("toast");
      setToasts((ts) => [...ts.slice(-2), { id, message, tone }]);
      timers.current[id] = setTimeout(() => dismissToast(id), 4600);
    },
    [dismissToast]
  );

  const patch = useCallback((fn: (s: PulseState) => PulseState) => {
    setState((s) => fn(s));
  }, []);

  /* ------------------------------ effect engine ----------------------------- */

  const applyEffectTo = useCallback((s: PulseState, effect: TaskEffect): PulseState => {
    switch (effect.kind) {
      case "moveToSavings": {
        const efId = effect.goalId ?? s.emergencyFundGoalId;
        return {
          ...s,
          savingsBalance: s.savingsBalance + effect.amount,
          goals: s.goals.map((g) =>
            g.id === efId ? { ...g, current: Math.min(g.target, g.current + effect.amount) } : g
          ),
          transactions: [
            {
              id: uid("tx"),
              date: new Date().toISOString().slice(0, 10),
              name: "Transfer → savings (Pulse action)",
              category: "savings",
              amount: effect.amount,
              type: "transfer",
            },
            ...s.transactions,
          ],
        };
      }
      case "payDebt": {
        const target =
          s.debts.find((d) => d.id === effect.debtId) ??
          [...s.debts].sort((a, b) => b.apr - a.apr)[0];
        if (!target) return s;
        return {
          ...s,
          debts: s.debts.map((d) =>
            d.id === target.id ? { ...d, balance: Math.max(0, d.balance - effect.amount) } : d
          ),
          goals: s.goals.map((g) =>
            g.name.toLowerCase().includes("debt")
              ? { ...g, current: Math.min(g.target, g.current + effect.amount) }
              : g
          ),
          transactions: [
            {
              id: uid("tx"),
              date: new Date().toISOString().slice(0, 10),
              name: `Extra payment → ${target.name}`,
              category: "debt",
              amount: effect.amount,
              type: "transfer",
            },
            ...s.transactions,
          ],
        };
      }
      case "cutCategoryBudget":
        return {
          ...s,
          categories: s.categories.map((c) =>
            c.id === effect.category
              ? { ...c, budget: Math.max(0, c.budget - effect.amount) }
              : c
          ),
        };
      case "none":
      default:
        return s;
    }
  }, []);

  /* --------------------------------- actions -------------------------------- */

  const value = useMemo<PulseContextValue>(() => {
    return {
      state,
      hydrated,
      toasts,
      toast,
      dismissToast,
      patch,

      updateProfile: (p) =>
        setState((s) => ({ ...s, profile: { ...s.profile, ...p } })),

      setMonthlyIncome: (n) => setState((s) => ({ ...s, monthlyIncome: Math.max(0, n) })),

      addTransaction: (t) =>
        setState((s) => ({
          ...s,
          transactions: [{ ...t, id: uid("tx") }, ...s.transactions],
        })),

      deleteTransaction: (id) =>
        setState((s) => ({
          ...s,
          transactions: s.transactions.filter((t) => t.id !== id),
        })),

      updateCategory: (id, p) =>
        setState((s) => ({
          ...s,
          categories: s.categories.map((c) => (c.id === id ? { ...c, ...p } : c)),
        })),

      addGoal: (g) =>
        setState((s) => ({ ...s, goals: [...s.goals, { ...g, id: uid("goal") }] })),

      updateGoal: (id, p) =>
        setState((s) => ({
          ...s,
          goals: s.goals.map((g) => (g.id === id ? { ...g, ...p } : g)),
        })),

      deleteGoal: (id) =>
        setState((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) })),

      contributeToGoal: (id, amount) =>
        setState((s) => ({
          ...s,
          savingsBalance:
            s.goals.find((g) => g.id === id)?.name.toLowerCase().includes("retirement")
              ? s.savingsBalance
              : s.savingsBalance + amount,
          goals: s.goals.map((g) =>
            g.id === id ? { ...g, current: Math.min(g.target, g.current + amount) } : g
          ),
          transactions: [
            {
              id: uid("tx"),
              date: new Date().toISOString().slice(0, 10),
              name: `Contribution → ${s.goals.find((g) => g.id === id)?.name ?? "goal"}`,
              category: "savings",
              amount,
              type: "transfer",
            },
            ...s.transactions,
          ],
        })),

      addTask: (t) =>
        setState((s) => ({
          ...s,
          tasks: [{ ...t, id: uid("task"), status: "open" }, ...s.tasks],
        })),

      completeTask: (id) =>
        setState((s) => {
          const task = s.tasks.find((t) => t.id === id);
          if (!task) return s;
          let next = s;
          if (task.effect) next = applyEffectTo(s, task.effect);
          return {
            ...next,
            tasks: next.tasks.map((t) => (t.id === id ? { ...t, status: "done" as const } : t)),
          };
        }),

      dismissTask: (id) =>
        setState((s) => ({
          ...s,
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, status: "dismissed" as const } : t)),
        })),

      setOpportunityStatus: (id, status) =>
        setState((s) => {
          let next = s;
          const opp = s.opportunities.find((o) => o.id === id);
          if (opp && status === "accepted" && opp.effect) {
            next = applyEffectTo(s, opp.effect);
          }
          return {
            ...next,
            opportunities: next.opportunities.map((o) =>
              o.id === id ? { ...o, status } : o
            ),
          };
        }),

      saveDecision: (d) =>
        setState((s) => ({ ...s, decisions: [d, ...s.decisions] })),

      saveRecommendation: (r) =>
        setState((s) => ({
          ...s,
          recommendations: [
            { ...r, id: uid("rec"), createdAt: new Date().toISOString().slice(0, 10) },
            ...s.recommendations,
          ],
        })),

      applyEffect: (effect) => setState((s) => applyEffectTo(s, effect)),

      applyBrief: () =>
        setState((s) => {
          const next = applyEffectTo(s, { kind: "moveToSavings", amount: 250 });
          return { ...next, flags: { ...next.flags, briefApplied: true } };
        }),

      markNotificationsRead: () =>
        setState((s) => ({
          ...s,
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        })),

      resetDemo: () => {
        const fresh = createSeedState();
        setState(fresh);
      },

      clearAll: () => {
        try {
          window.localStorage.removeItem(STORAGE_KEY);
        } catch {
          // ignore
        }
        setState(createSeedState());
      },

      importState: (json) => {
        try {
          const parsed = JSON.parse(json) as PulseState;
          if (!parsed || typeof parsed !== "object" || !parsed.profile || !Array.isArray(parsed.goals)) {
            return false;
          }
          setState({ ...parsed, version: STATE_VERSION });
          return true;
        } catch {
          return false;
        }
      },
    };
  }, [state, hydrated, toasts, toast, dismissToast, patch, applyEffectTo]);

  return <PulseContext.Provider value={value}>{children}</PulseContext.Provider>;
}
