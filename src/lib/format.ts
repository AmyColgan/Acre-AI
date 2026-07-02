export function fmtMoney(n: number, opts: { compact?: boolean; signed?: boolean; decimals?: number } = {}): string {
  const { compact = false, signed = false, decimals } = opts;
  const abs = Math.abs(n);
  let core: string;
  if (compact && abs >= 1_000_000) {
    core = `$${(abs / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  } else if (compact && abs >= 10_000) {
    core = `$${(abs / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  } else {
    core = `$${abs.toLocaleString("en-US", {
      minimumFractionDigits: decimals ?? 0,
      maximumFractionDigits: decimals ?? (abs < 100 && abs !== Math.floor(abs) ? 2 : 0),
    })}`;
  }
  if (n < 0) return `−${core}`;
  if (signed && n > 0) return `+${core}`;
  return core;
}

export function fmtPct(n: number, decimals = 0): string {
  return `${n.toFixed(decimals)}%`;
}

export function fmtDate(iso: string, style: "short" | "long" | "monthDay" = "short"): string {
  const d = new Date(iso + (iso.length === 10 ? "T12:00:00" : ""));
  if (Number.isNaN(d.getTime())) return iso;
  if (style === "long")
    return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  if (style === "monthDay") return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(fromISO: string, toISO: string): number {
  const a = new Date(fromISO + "T12:00:00").getTime();
  const b = new Date(toISO + "T12:00:00").getTime();
  return Math.round((b - a) / 86_400_000);
}

export function monthLabel(offset: number): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return d.toLocaleDateString("en-US", { month: "short" });
}

export function uid(prefix = "id"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Good evening";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
