"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Icon } from "@/components/ui/icons";
import { AnimatedNumber, Badge, Button, Card, PageHead, ProgressBar } from "@/components/ui/core";
import { usePulse } from "@/lib/store";
import { LESSON_XP, levelFor, QUIZ_XP, UNITS, type Unit } from "@/lib/curriculum";

const LEVEL_TONE: Record<Unit["level"], "blue" | "amber" | "rose"> = {
  Beginner: "blue",
  Intermediate: "amber",
  Advanced: "rose",
};

export default function Learn() {
  const { state, completeLesson, passQuiz, toast } = usePulse();
  const { learn } = state;
  const [openUnit, setOpenUnit] = useState<string | null>(null);
  const [openLesson, setOpenLesson] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [graded, setGraded] = useState<Record<string, boolean>>({});

  const lvl = useMemo(() => levelFor(learn.xp), [learn.xp]);
  const unitsDone = UNITS.filter((u) => learn.quizPassed[u.id]).length;

  const unlocked = (idx: number) => idx === 0 || !!learn.quizPassed[UNITS[idx - 1].id];
  const unitProgress = (u: Unit) => {
    const lessons = (learn.lessonsDone[u.id] ?? []).length;
    const steps = u.lessons.length + 1;
    return ((lessons + (learn.quizPassed[u.id] ? 1 : 0)) / steps) * 100;
  };

  const grade = (u: Unit) => {
    const missing = u.quiz.some((_, qi) => answers[`${u.id}-${qi}`] === undefined);
    if (missing) {
      toast("Answer all three questions first.", "warn");
      return;
    }
    const correct = u.quiz.filter((q, qi) => answers[`${u.id}-${qi}`] === q.answer).length;
    setGraded((g) => ({ ...g, [u.id]: true }));
    if (correct >= 2) {
      const already = learn.quizPassed[u.id];
      passQuiz(u.id, QUIZ_XP);
      toast(
        already
          ? `Nice — ${correct}/3 again.`
          : `Unit ${u.n} passed with ${correct}/3! +${QUIZ_XP} XP · ${u.n < UNITS.length ? `Unit ${u.n + 1} unlocked.` : "You finished the whole pathway."}`
      );
    } else {
      toast(`${correct}/3 — review the highlighted answers and try again. Nothing is lost.`, "warn");
    }
  };

  return (
    <div>
      <PageHead
        title="Learn"
        sub="A guided pathway from money basics to college-level strategy. Finish a unit's quiz to unlock the next one — everything earns XP."
      />

      {/* progress header */}
      <Card className="rise-in relative overflow-hidden p-5">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-blue-600/12 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-x-8 gap-y-4">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-dim">Your level</div>
            <div className="font-display mt-0.5 text-2xl text-pulse">{lvl.current.name}</div>
          </div>
          <div className="min-w-[200px] flex-1">
            <div className="mb-1.5 flex items-baseline justify-between text-xs">
              <span className="font-semibold text-snow font-tabular">
                <AnimatedNumber value={learn.xp} /> XP
              </span>
              <span className="text-dim">
                {lvl.next ? `${lvl.next.xp - learn.xp} XP to ${lvl.next.name}` : "Max level reached"}
              </span>
            </div>
            <ProgressBar pct={lvl.pct} tone="blue" />
          </div>
          <div className="flex items-center gap-5 text-center">
            <div>
              <div className="text-xl font-bold font-tabular">{unitsDone}<span className="text-sm text-dim">/{UNITS.length}</span></div>
              <div className="text-[10px] uppercase tracking-wide text-dim">units done</div>
            </div>
            <div>
              <div className="text-xl font-bold font-tabular">
                {Object.values(learn.lessonsDone).reduce((s, a) => s + a.length, 0)}
                <span className="text-sm text-dim">/{UNITS.length * 3}</span>
              </div>
              <div className="text-[10px] uppercase tracking-wide text-dim">lessons read</div>
            </div>
          </div>
        </div>
        <p className="relative mt-3 text-xs text-fog">
          Lessons are worth +{LESSON_XP} XP, quizzes +{QUIZ_XP} XP — and completing money tasks in the
          Action Center earns +25 XP too. Learning and doing feed the same score.
        </p>
      </Card>

      {/* journey path */}
      <div className="relative mt-6 space-y-3">
        <div aria-hidden className="absolute bottom-6 left-[21px] top-6 w-px bg-gradient-to-b from-blue-500/50 via-line to-line" />
        {UNITS.map((u, idx) => {
          const isUnlocked = unlocked(idx);
          const passed = !!learn.quizPassed[u.id];
          const isCurrent = isUnlocked && !passed;
          const open = openUnit === u.id;
          const lessonsDone = learn.lessonsDone[u.id] ?? [];
          return (
            <div key={u.id} className="relative pl-14">
              {/* node */}
              <span
                className={clsx(
                  "absolute left-2 top-4 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold font-tabular",
                  passed
                    ? "border-blue-400/60 bg-blue-600 text-white"
                    : isCurrent
                      ? "node-glow border-blue-400/70 bg-blue-500/15 text-pulse"
                      : "border-line bg-panel text-dim"
                )}
              >
                {passed ? <Icon name="check" size={13} strokeWidth={2.5} /> : u.n}
              </span>

              <Card
                className={clsx("transition-all", !isUnlocked && "opacity-50", open && "border-blue-500/40")}
                lift={isUnlocked && !open}
              >
                <button
                  onClick={() => {
                    if (!isUnlocked) {
                      toast(`Pass Unit ${u.n - 1}'s quiz to unlock “${u.title}.”`, "warn");
                      return;
                    }
                    setOpenUnit(open ? null : u.id);
                    setOpenLesson(null);
                  }}
                  className="flex w-full items-center gap-3 p-4 text-left cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-base">{u.title}</h2>
                      <Badge tone={LEVEL_TONE[u.level]}>{u.level}</Badge>
                      {passed && <Badge tone="green"><Icon name="check" size={10} /> complete</Badge>}
                      {isCurrent && idx === UNITS.findIndex((x, i) => unlocked(i) && !learn.quizPassed[x.id]) && (
                        <Badge tone="blue">up next</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-fog">{u.tagline}</p>
                    <div className="mt-2.5 flex items-center gap-3">
                      <ProgressBar pct={unitProgress(u)} tone={passed ? "green" : "blue"} className="max-w-[220px]" />
                      <span className="text-[10px] text-dim font-tabular">
                        {lessonsDone.length}/{u.lessons.length} lessons · quiz {passed ? "✓" : "—"}
                      </span>
                    </div>
                  </div>
                  <Icon
                    name={isUnlocked ? (open ? "chevronDown" : "chevronRight") : "unlock"}
                    size={16}
                    className="shrink-0 text-dim"
                  />
                </button>

                {open && (
                  <div className="fade-in border-t border-line p-4 pt-4">
                    {/* lessons */}
                    <div className="space-y-2">
                      {u.lessons.map((l, li) => {
                        const done = lessonsDone.includes(li);
                        const lessonOpen = openLesson === `${u.id}-${li}`;
                        return (
                          <div key={l.title} className="overflow-hidden rounded-xl border border-line bg-panel/60">
                            <button
                              onClick={() => setOpenLesson(lessonOpen ? null : `${u.id}-${li}`)}
                              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm cursor-pointer"
                            >
                              <span
                                className={clsx(
                                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px]",
                                  done ? "border-emerald-500/50 bg-emerald-500/15 text-mint" : "border-line text-dim"
                                )}
                              >
                                {done ? <Icon name="check" size={10} strokeWidth={2.5} /> : li + 1}
                              </span>
                              <span className={done ? "text-fog" : "text-snow"}>{l.title}</span>
                              <Icon name={lessonOpen ? "chevronDown" : "chevronRight"} size={14} className="ml-auto shrink-0 text-dim" />
                            </button>
                            {lessonOpen && (
                              <div className="fade-in border-t border-line px-4 py-3.5">
                                <p className="text-sm leading-relaxed text-fog">{l.body}</p>
                                <p className="mt-3 rounded-lg border border-blue-500/25 bg-blue-500/[0.07] px-3 py-2 text-xs text-pulse">
                                  <span className="font-semibold">Takeaway:</span> {l.takeaway}
                                </p>
                                {!done && (
                                  <Button
                                    size="sm"
                                    className="xp-pop mt-3"
                                    icon="check"
                                    onClick={() => {
                                      completeLesson(u.id, li, LESSON_XP);
                                      toast(`Lesson complete — +${LESSON_XP} XP.`);
                                    }}
                                  >
                                    Mark complete · +{LESSON_XP} XP
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* quiz */}
                    <div className="mt-4 rounded-xl border border-line bg-panel/60 p-4">
                      <div className="flex items-center gap-2">
                        <Icon name="zap" size={15} className="text-gold" />
                        <h3 className="text-sm font-semibold">Unit quiz</h3>
                        <span className="text-[11px] text-dim">2 of 3 to pass · +{QUIZ_XP} XP</span>
                        {passed && <Badge tone="green" className="ml-auto">passed</Badge>}
                      </div>
                      <div className="mt-3 space-y-4">
                        {u.quiz.map((q, qi) => {
                          const key = `${u.id}-${qi}`;
                          const chosen = answers[key];
                          const showResult = graded[u.id];
                          return (
                            <div key={key}>
                              <p className="text-sm text-snow/90">
                                {qi + 1}. {q.q}
                              </p>
                              <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                                {q.options.map((opt, oi) => {
                                  const isChosen = chosen === oi;
                                  const isRight = showResult && oi === q.answer;
                                  const isWrongPick = showResult && isChosen && oi !== q.answer;
                                  return (
                                    <button
                                      key={opt}
                                      onClick={() => {
                                        setAnswers((a) => ({ ...a, [key]: oi }));
                                        setGraded((g) => ({ ...g, [u.id]: false }));
                                      }}
                                      className={clsx(
                                        "rounded-lg border px-3 py-2 text-left text-xs transition-all cursor-pointer",
                                        isRight
                                          ? "border-emerald-500/60 bg-emerald-500/12 text-mint"
                                          : isWrongPick
                                            ? "border-rose-500/60 bg-rose-500/10 text-coral"
                                            : isChosen
                                              ? "border-blue-500/60 bg-blue-500/12 text-snow"
                                              : "border-line bg-panel/40 text-fog hover:border-line-strong hover:text-snow"
                                      )}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <Button className="mt-4" icon="zap" onClick={() => grade(u)}>
                        {passed ? "Retake quiz" : "Submit answers"}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          );
        })}
      </div>

      <p className="mt-6 rounded-xl border border-line bg-panel/50 p-3 text-center text-[11px] text-dim">
        Written for teen and young-adult learners; the capstone reaches college-level finance.
        Educational content only — not financial advice.
      </p>
    </div>
  );
}
