"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScreenFrame } from "@/components/ui/ScreenFrame";
import { Reveal } from "@/components/ui/Reveal";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Label } from "@/components/ui/Input";
import { initialGoals, type Goal } from "@/lib/data";
import { cn, formatCurrency } from "@/lib/utils";

const CATEGORIES: Goal["category"][] = [
  "Emergency fund",
  "Home",
  "Education",
  "Retirement",
  "Travel",
  "Legacy",
];

export function GoalsScreen() {
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    target: "",
    monthly: "",
    category: CATEGORIES[0] as Goal["category"],
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const target = Number(form.target);
    const monthly = Number(form.monthly);
    if (!form.name || !target || target <= 0) return;

    const goal: Goal = {
      id: crypto.randomUUID(),
      name: form.name,
      target,
      saved: 0,
      monthly: monthly || 0,
      targetDate: "TBD",
      category: form.category,
    };
    setGoals((prev) => [goal, ...prev]);
    setForm({ name: "", target: "", monthly: "", category: CATEGORIES[0] });
    setOpen(false);
  }

  return (
    <section id="goals" className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow="03 — Goals & Wealth Planning"
            title="Every ambition, funded on purpose — not by whatever is left over."
            description="Set a target and Acre works backward to a monthly number, then tracks the pace against reality — emergency reserves, education, retirement, and the harder-to-name ones."
          />
        </div>

        <Reveal delay={0.1} className="mt-14">
          <ScreenFrame
            title="Goals"
            subtitle={`${goals.length} active`}
            actions={
              <Button variant="secondary" onClick={() => setOpen(true)}>
                + Add goal
              </Button>
            }
          >
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {goals.map((goal, i) => {
                const progress = goal.saved / goal.target;
                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                    className={cn(
                      "flex items-center gap-5 rounded-2xl border border-hairline bg-ink px-5 py-5"
                    )}
                  >
                    <ProgressRing progress={progress} size={72} stroke={5} />
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase tracking-wide text-brass-bright">
                        {goal.category}
                      </span>
                      <p className="mt-0.5 truncate font-display text-base text-parchment">
                        {goal.name}
                      </p>
                      <p className="mt-1 font-tabular text-xs text-parchment-dim">
                        {formatCurrency(goal.saved, { compact: true })} of{" "}
                        {formatCurrency(goal.target, { compact: true })}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {formatCurrency(goal.monthly, { compact: true })}/mo · {goal.targetDate}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </ScreenFrame>
        </Reveal>
      </div>

      <Modal open={open} onClose={() => setOpen(false)}>
        <h3 className="font-display text-2xl font-medium text-parchment">New goal</h3>
        <p className="mt-1 text-sm text-parchment-dim">
          Acre will suggest a monthly contribution once a target date is set.
        </p>
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <Label htmlFor="goal-name">Goal name</Label>
            <Input
              id="goal-name"
              placeholder="e.g. Sabbatical fund"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="goal-target">Target amount</Label>
              <Input
                id="goal-target"
                type="number"
                min={1}
                placeholder="50,000"
                value={form.target}
                onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="goal-monthly">Monthly contribution</Label>
              <Input
                id="goal-monthly"
                type="number"
                min={0}
                placeholder="500"
                value={form.monthly}
                onChange={(e) => setForm((f) => ({ ...f, monthly: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="goal-category">Category</Label>
            <select
              id="goal-category"
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value as Goal["category"] }))
              }
              className="w-full rounded-lg border border-hairline-strong bg-ink px-4 py-2.5 text-sm text-parchment outline-none focus:border-brass"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-2 flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create goal</Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
