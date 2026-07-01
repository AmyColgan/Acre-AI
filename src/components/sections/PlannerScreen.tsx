"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScreenFrame } from "@/components/ui/ScreenFrame";
import { Reveal } from "@/components/ui/Reveal";
import { plannerResponse, plannerSuggestions } from "@/lib/data";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "greeting",
    role: "assistant",
    content:
      "I've been through your accounts this morning. Ask about spending, a goal, some risk you're carrying, whatever you're deciding on.",
  },
];

export function PlannerScreen() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;
    const userMessage: Message = { id: crypto.randomUUID(), role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setThinking(true);

    const delay = 650 + Math.random() * 500;
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: plannerResponse(trimmed) },
      ]);
      setThinking(false);
    }, delay);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  return (
    <section id="planner" className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <SectionHeading
          eyebrow="02 · Planner"
          title="Ask it the way you'd ask a person who actually knows your accounts."
          description="It reads your real numbers before it answers, and shows the arithmetic behind the answer, so you can check it if something looks off."
        />

        <Reveal delay={0.1} className="mt-14">
          <ScreenFrame title="Planner" subtitle="Grounded in your live accounts">
            <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
              <div className="flex flex-col rounded-2xl border border-hairline bg-ink">
                <div
                  ref={scrollRef}
                  className="flex h-[360px] flex-col gap-4 overflow-y-auto px-5 py-5 sm:h-[420px]"
                >
                  <AnimatePresence initial={false}>
                    {messages.map((m) => (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className={
                          m.role === "user"
                            ? "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-brass px-4 py-3 text-sm text-ink"
                            : "mr-auto max-w-[85%] rounded-2xl rounded-bl-sm border border-hairline bg-ink-2 px-4 py-3 text-sm leading-relaxed text-parchment-dim"
                        }
                      >
                        {m.content}
                      </motion.div>
                    ))}
                    {thinking && (
                      <motion.div
                        key="thinking"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="mr-auto flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-hairline bg-ink-2 px-4 py-3.5"
                      >
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            className="h-1.5 w-1.5 rounded-full bg-muted"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.15 }}
                          />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <form
                  onSubmit={onSubmit}
                  className="flex items-center gap-3 border-t border-hairline px-4 py-3"
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about your finances…"
                    className="flex-1 bg-transparent text-sm text-parchment placeholder:text-muted outline-none"
                    aria-label="Message the AI planner"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || thinking}
                    className="inline-flex items-center justify-center rounded-full bg-brass px-4 py-2 text-xs font-medium text-ink transition-colors duration-200 hover:bg-brass-bright disabled:opacity-40"
                  >
                    Send
                  </button>
                </form>
              </div>

              <div className="flex flex-col gap-2.5">
                <span className="coord-label text-muted">Try asking</span>
                {plannerSuggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    disabled={thinking}
                    className="rounded-lg border border-hairline bg-ink px-3.5 py-2.5 text-left text-xs leading-snug text-parchment-dim transition-colors duration-200 hover:border-brass hover:text-brass-bright disabled:opacity-40"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </ScreenFrame>
        </Reveal>
      </div>
    </section>
  );
}
