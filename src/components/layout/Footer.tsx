import Link from "next/link";
import { LogoMark } from "@/components/ui/LogoMark";

const PRODUCT_LINKS = [
  { label: "Dashboard", href: "#dashboard" },
  { label: "Planner", href: "#planner" },
  { label: "Goals", href: "#goals" },
  { label: "Budget", href: "#budget" },
  { label: "Investments", href: "#investments" },
  { label: "Health", href: "#health" },
];

const INFO_LINKS = [
  { label: "How it thinks", href: "#trust" },
  { label: "Request access", href: "#access" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-hairline">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:px-10">
        <div className="grid gap-12 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <a href="#top" className="flex items-center gap-2.5 text-parchment">
              <LogoMark size={30} className="text-brass-bright" />
              <span className="font-display text-xl font-medium tracking-wide">Acre</span>
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              A design concept for an AI financial planning practice. Every
              figure on this site is illustrative, and nothing you enter here
              is stored.
            </p>
          </div>

          <div>
            <span className="coord-label text-muted">Product</span>
            <ul className="mt-4 flex flex-col gap-2.5">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-parchment-dim transition-colors duration-200 hover:text-brass-bright"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <span className="coord-label text-muted">Practice</span>
            <ul className="mt-4 flex flex-col gap-2.5">
              {INFO_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-parchment-dim transition-colors duration-200 hover:text-brass-bright"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-hairline pt-6 text-xs text-muted sm:flex-row sm:items-center">
          <p>Copyright {year} Acre. A concept demonstration, not a live product.</p>
          <p className="coord-label">Plot 41.2N 74.0W · rev. 03</p>
        </div>
      </div>
    </footer>
  );
}
