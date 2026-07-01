import clsx, { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(value: number, opts?: { compact?: boolean }) {
  if (opts?.compact && Math.abs(value) >= 1000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatSigned(value: number, opts?: { percent?: boolean }) {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  const abs = Math.abs(value);
  const body = opts?.percent
    ? `${(abs * 100).toFixed(1)}%`
    : formatCurrency(abs, { compact: true });
  return `${sign}${body}`;
}
