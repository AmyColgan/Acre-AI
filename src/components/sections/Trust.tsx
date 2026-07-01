import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";

const PRINCIPLES = [
  {
    index: "01",
    title: "Grounded in your real accounts",
    detail:
      "Every answer is computed from your actual balances and history — never a generic rule of thumb dressed up as advice.",
  },
  {
    index: "02",
    title: "Shows its reasoning",
    detail:
      "Acre states the assumption, the calculation, and the range of outcomes — so you can disagree with a number, not just trust it.",
  },
  {
    index: "03",
    title: "Conservative by default",
    detail:
      "Where the data is ambiguous, it says so. Confidence is earned per answer, not assumed across the board.",
  },
  {
    index: "04",
    title: "Private by design",
    detail:
      "Your financial data is never used to train shared models, and never sold. It exists to serve your plan, and nothing else.",
  },
];

export function TrustPrinciples() {
  return (
    <section id="trust" className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <SectionHeading
          eyebrow="How it thinks"
          title="Intelligence you can audit, not just believe."
          description="A financial system earns trust the same way an advisor does — by showing its work every time, not only when asked."
          align="left"
        />

        <div className="mt-16 grid gap-x-10 gap-y-14 sm:grid-cols-2">
          {PRINCIPLES.map((p, i) => (
            <Reveal key={p.index} delay={i * 0.08}>
              <div className="border-t border-hairline-strong pt-6">
                <span className="font-display text-sm text-brass-bright">{p.index}</span>
                <h3 className="mt-3 font-display text-2xl font-light text-parchment">
                  {p.title}
                </h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-parchment-dim">
                  {p.detail}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
