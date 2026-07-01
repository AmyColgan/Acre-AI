import { Reveal } from "@/components/ui/Reveal";

const PRINCIPLES = [
  {
    index: "01",
    title: "Reads your actual accounts",
    detail:
      "Every answer starts from your real balances and transaction history. If the data doesn't support an answer, it says so instead of filling the gap with a rule of thumb.",
  },
  {
    index: "02",
    title: "Shows its work",
    detail:
      "You get the assumption it made, the calculation behind it, and how wrong that could reasonably turn out to be. Something you can push back on, not a verdict you're meant to accept.",
  },
  {
    index: "03",
    title: "Says when it's unsure",
    detail:
      "Confidence gets earned answer by answer. When the data is thin, or the outcome depends on something outside your accounts, it tells you up front.",
  },
  {
    index: "04",
    title: "Keeps your data yours",
    detail:
      "Nothing here trains a shared model, and nothing gets sold. It exists to run your plan, and nothing beyond that.",
  },
];

export function TrustPrinciples() {
  return (
    <section id="trust" className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-5xl px-6 sm:px-10">
        <div className="sm:pl-40">
          <Reveal>
            <span className="coord-label text-brass-bright">How it thinks</span>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="mt-4 max-w-xl font-display text-4xl font-light leading-[1.1] text-parchment text-balance sm:text-5xl">
              You can audit this the way you&rsquo;d audit anyone else&rsquo;s math.
            </h2>
          </Reveal>
        </div>

        <div className="mt-16 flex flex-col">
          {PRINCIPLES.map((p, i) => (
            <Reveal key={p.index} delay={i * 0.06}>
              <div className="grid grid-cols-[3rem_1fr] gap-6 border-t border-hairline-strong py-8 sm:grid-cols-[10rem_1fr] sm:gap-10">
                <span className="font-mono text-3xl text-brass-dim sm:text-4xl">
                  {p.index}
                </span>
                <div>
                  <h3 className="font-display text-xl font-light text-parchment sm:text-2xl">
                    {p.title}
                  </h3>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-parchment-dim">
                    {p.detail}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
          <div className="border-t border-hairline-strong" />
        </div>
      </div>
    </section>
  );
}
