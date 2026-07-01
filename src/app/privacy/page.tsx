import Link from "next/link";
import type { Metadata } from "next";
import { LogoMark } from "@/components/ui/LogoMark";

export const metadata: Metadata = {
  title: "Privacy · Acre",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto min-h-screen max-w-2xl px-6 py-20 sm:px-10">
      <Link href="/" className="flex w-fit items-center gap-2.5 text-parchment">
        <LogoMark size={26} className="text-brass-bright" />
        <span className="font-display text-lg font-medium tracking-wide">Acre</span>
      </Link>

      <h1 className="mt-12 font-display text-3xl font-light text-parchment sm:text-4xl">
        Privacy
      </h1>
      <p className="mt-2 coord-label text-muted">Last reviewed July 2026</p>

      <div className="mt-10 flex flex-col gap-6 text-sm leading-relaxed text-parchment-dim">
        <p>
          This site is a design concept for a financial planning product. It
          is not a live service, and no account, statement, or transaction
          shown anywhere on it is real.
        </p>
        <p>
          The waitlist form on this page stores your email only in your own
          browser&apos;s memory for the duration of your visit. It is not
          sent to a server, logged, or kept anywhere once you close the tab.
          There is no database behind this site.
        </p>
        <p>
          If Acre becomes a real product, this page will be replaced with a
          privacy policy that actually governs what happens to your data. It
          would cover, at minimum: what account information is collected,
          how it is used to generate the planning shown on the dashboard,
          how long it is retained, and how to request deletion of it. None
          of that exists yet, which is the honest answer.
        </p>
      </div>
    </div>
  );
}
