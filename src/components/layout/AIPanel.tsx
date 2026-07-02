"use client";


import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/icons";
import { Button } from "@/components/ui/core";
import { usePulse } from "@/lib/store";
import { answerQuestion, SUGGESTED_PROMPTS, type AiResponse } from "@/lib/ai";
import { getHealth, getTotals } from "@/lib/calc";
import { fmtMoney, greeting, uid } from "@/lib/format";
import { addDaysISO, todayISO } from "@/lib/format";

interface ChatMsg {
  id: string;
  role: "user" | "ai";
  text: string;
  response?: AiResponse;
}

export function AIFloatingButton({ onClick, open }: { onClick: () => void; open: boolean }) {
  if (open) return null;
  return (
    <button
      onClick={onClick}
      aria-label="Open Pulse AI assistant"
      className="ai-pulse fixed bottom-20 right-4 z-[70] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-violet-500 to-violet-600 text-white shadow-[0_16px_40px_-8px_rgba(99,102,241,0.65)] transition-transform hover:scale-105 active:scale-95 sm:bottom-6 sm:right-6 cursor-pointer"
    >
      <Icon name="sparkles" size={24} strokeWidth={2} />
    </button>
  );
}

export function AIPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, addTask, saveRecommendation, toast } = usePulse();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const totals = useMemo(() => getTotals(state), [state]);
  const health = useMemo(() => getHealth(state), [state]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, thinking]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const ask = (q: string) => {
    const question = q.trim();
    if (!question || thinking) return;
    setInput("");
    setMessages((m) => [...m, { id: uid("m"), role: "user", text: question }]);
    setThinking(true);
    setTimeout(() => {
      const response = answerQuestion(state, question);
      setMessages((m) => [...m, { id: uid("m"), role: "ai", text: response.answer, response }]);
      setThinking(false);
    }, 750);
  };

  const createAction = (r: AiResponse) => {
    addTask({
      title: r.action,
      detail: `From Pulse AI: ${r.topic}. ${r.impact}`,
      bucket: "week",
      priority: r.riskLevel === "high" ? "high" : "medium",
      impact: 0,
      due: addDaysISO(todayISO(), 5),
      timeNeeded: "10 min",
      category: "AI recommendation",
      effect: { kind: "none" },
    });
    toast("Task added to your Action Center");
  };

  const saveRec = (r: AiResponse) => {
    saveRecommendation({
      topic: r.topic,
      summary: r.answer,
      detail: `Impact: ${r.impact}\nRecommended action: ${r.action}\nProjection: ${r.projection}`,
      source: "assistant",
    });
    toast("Recommendation saved to Reports");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[85]" role="dialog" aria-modal="true" aria-label="Pulse AI assistant">
      <div className="absolute inset-0 bg-void/60 backdrop-blur-sm fade-in" onClick={onClose} />
      <div className="slide-in-right glass-strong absolute inset-y-0 right-0 flex w-full max-w-md flex-col sm:rounded-l-2xl">
        {/* header */}
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <span className="ai-breathe flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-white">
            <Icon name="sparkles" size={19} />
          </span>
          <div className="flex-1">
            <div className="text-sm font-semibold">Pulse AI</div>
            <div className="flex items-center gap-1.5 text-[11px] text-mint">
              <span className="h-1.5 w-1.5 rounded-full bg-mint" /> Watching your finances in real time
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close assistant"
            className="rounded-lg p-1.5 text-fog transition-colors hover:bg-raise hover:text-snow cursor-pointer"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* context strip */}
        <div className="grid grid-cols-3 gap-2 border-b border-line px-5 py-3">
          {[
            { label: "Net worth", value: fmtMoney(totals.netWorth, { compact: true }) },
            { label: "Safe this week", value: fmtMoney(totals.safeToSpendWeek) },
            { label: "Health", value: `${health.total}` },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-line bg-panel/60 px-2.5 py-2 text-center">
              <div className="text-[10px] uppercase tracking-wide text-dim">{s.label}</div>
              <div className="text-sm font-semibold font-tabular">{s.value}</div>
            </div>
          ))}
        </div>

        {/* chat area */}
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {messages.length === 0 && (
            <div className="rise-in">
              <p className="text-sm leading-relaxed text-fog">
                {greeting()}, {state.profile.name}. I&apos;ve been watching your money — you have{" "}
                <span className="font-semibold text-snow">{fmtMoney(totals.safeToSpendWeek)}</span> safe to
                spend this week and your health score is{" "}
                <span className="font-semibold text-snow">{health.total}/1000</span>. Ask me anything, or
                start with one of these:
              </p>
              <div className="mt-4 flex flex-col gap-2">
                {SUGGESTED_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => ask(p)}
                    className="rounded-xl border border-line bg-panel/60 px-3.5 py-2.5 text-left text-sm text-fog transition-all hover:border-blue-500/40 hover:text-snow cursor-pointer"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2.5 text-sm text-white">
                  {m.text}
                </div>
              </div>
            ) : (
              <div key={m.id} className="rise-in flex gap-2.5">
                <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-white">
                  <Icon name="sparkles" size={13} />
                </span>
                <div className="min-w-0 flex-1 space-y-2.5">
                  <div className="rounded-2xl rounded-tl-md border border-line bg-panel/70 px-4 py-3 text-sm leading-relaxed text-snow/90">
                    {m.text}
                    {m.response && (
                      <div className="mt-3 space-y-1.5 border-t border-line pt-2.5 text-xs text-fog">
                        <div>
                          <span className="font-semibold text-pulse">Impact:</span> {m.response.impact}
                        </div>
                        <div>
                          <span className="font-semibold text-mint">Next move:</span> {m.response.action}
                        </div>
                      </div>
                    )}
                  </div>
                  {m.response && (
                    <div className="flex flex-wrap gap-1.5">
                      <Button size="sm" variant="secondary" icon="checkCircle" onClick={() => createAction(m.response!)}>
                        Create action
                      </Button>
                      <Button size="sm" variant="secondary" icon="bookmark" onClick={() => saveRec(m.response!)}>
                        Save
                      </Button>
                      {m.response.decisionPrefill && (
                        <Button
                          size="sm"
                          variant="secondary"
                          icon="scale"
                          onClick={() => {
                            const d = m.response!.decisionPrefill!;
                            onClose();
                            router.push(`/decisions?name=${encodeURIComponent(d.name)}&cost=${d.cost}`);
                          }}
                        >
                          Decision report
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          )}

          {thinking && (
            <div className="flex items-center gap-2.5 text-fog">
              <span className="ai-breathe flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-white">
                <Icon name="sparkles" size={13} />
              </span>
              <span className="text-xs">Pulse is analyzing your data…</span>
            </div>
          )}
        </div>

        {/* composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className="border-t border-line p-4"
        >
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a purchase, debt, goals…"
              className="flex-1 rounded-xl border border-line bg-panel/80 px-3.5 py-2.5 text-sm text-snow placeholder:text-dim outline-none focus:border-blue-500/50"
            />
            <button
              type="submit"
              disabled={!input.trim() || thinking}
              aria-label="Send"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              <Icon name="send" size={16} />
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] text-dim">
            Simulated intelligence based on your stored data · Educational only, not financial advice
          </p>
        </form>
      </div>
    </div>
  );
}
