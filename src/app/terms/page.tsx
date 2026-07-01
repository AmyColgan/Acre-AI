import Link from "next/link";
import type { Metadata } from "next";
import { LogoMark } from "@/components/ui/LogoMark";

export const metadata: Metadata = {
  title: "Terms · Acre",
};

export default function TermsPage() {
  return (
    <div className="mx-auto min-h-screen max-w-2xl px-6 py-20 sm:px-10">
      <Link href="/" className="flex w-fit items-center gap-2.5 text-parchment">
        <LogoMark size={26} className="text-brass-bright" />
        <span className="font-display text-lg font-medium tracking-wide">Acre</span>
      </Link>

      <h1 className="mt-12 font-display text-3xl font-light text-parchment sm:text-4xl">
        Terms
      </h1>
      <p className="mt-2 coord-label text-muted">Last reviewed July 2026</p>

      <div className="mt-10 flex flex-col gap-6 text-sm leading-relaxed text-parchment-dim">
        <p>
          You are looking at a portfolio piece, not a financial product.
          Nothing on this site constitutes financial, investment, or tax
          advice, whether it comes from a static page or the planner chat.
          The planner&apos;s replies are pre-written responses matched to
          keywords, not a connection to any account or model reasoning over
          real data.
        </p>
        <p>
          The dashboard, portfolio figures, goals, and health score are
          fictional example data built to show how the interface would
          behave with real numbers behind it. Do not make financial
          decisions based on anything shown here.
        </p>
        <p>
          If you request access through the form on this site, that request
          is not fulfilled. There is no account to be granted.
        </p>
      </div>
    </div>
  );
}
