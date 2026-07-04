"use client";

import clsx from "clsx";
import {
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { Icon } from "./icons";
import { usePulse } from "@/lib/store";

/* ---------------------------------- Card ----------------------------------- */

export function Card({
  children,
  className,
  lift = false,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  lift?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        "glass rounded-2xl",
        lift && "hover-lift",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}

/* --------------------------------- Button ---------------------------------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";

export function Button({
  variant = "primary",
  size = "md",
  icon,
  className,
  children,
  ...rest
}: {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  icon?: Parameters<typeof Icon>[0]["name"];
  children?: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles: Record<ButtonVariant, string> = {
    primary:
      "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-[0_8px_24px_-8px_rgba(13,148,136,0.7)] hover:from-teal-500 hover:to-emerald-500",
    secondary:
      "bg-raise text-snow border border-line hover:border-line-strong hover:bg-raise-2",
    ghost: "text-fog hover:text-snow hover:bg-raise",
    danger:
      "bg-gradient-to-r from-rose-700 to-rose-600 text-white hover:from-rose-600 hover:to-rose-500",
    success:
      "bg-gradient-to-r from-emerald-700 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-500",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2",
  };
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none cursor-pointer",
        styles[variant],
        sizes[size],
        className
      )}
      {...rest}
    >
      {icon && <Icon name={icon} size={size === "sm" ? 14 : 16} />}
      {children}
    </button>
  );
}

/* ---------------------------------- Badge ----------------------------------- */

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "blue" | "green" | "violet" | "amber" | "rose";
  className?: string;
}) {
  const tones = {
    neutral: "bg-raise text-fog border-line",
    blue: "bg-teal-500/10 text-pulse border-teal-500/25",
    green: "bg-emerald-500/10 text-mint border-emerald-500/25",
    violet: "bg-indigo-500/10 text-iris border-indigo-500/25",
    amber: "bg-amber-500/10 text-gold border-amber-500/25",
    rose: "bg-rose-500/10 text-coral border-rose-500/25",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/* ---------------------------------- Modal ----------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-void/75 backdrop-blur-sm fade-in" onClick={onClose} />
      <div
        className={clsx(
          "glass-strong relative w-full rounded-t-2xl sm:rounded-2xl scale-in max-h-[88vh] overflow-y-auto",
          wide ? "sm:max-w-3xl" : "sm:max-w-lg"
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-deep/90 backdrop-blur px-5 py-4 rounded-t-2xl">
          <h3 className="text-sm font-semibold tracking-wide">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-fog hover:bg-raise hover:text-snow transition-colors cursor-pointer"
          >
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* --------------------------------- Fields ----------------------------------- */

const fieldBase =
  "w-full rounded-xl border border-line bg-panel/80 px-3.5 py-2.5 text-sm text-snow placeholder:text-dim outline-none transition-colors focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-fog">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-dim">{hint}</span>}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx(fieldBase, props.className)} />;
}

export function MoneyInput({
  value,
  onValue,
  ...rest
}: { value: number | ""; onValue: (n: number | "") => void } & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
>) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-dim">
        $
      </span>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          onValue(v === "" ? "" : Math.max(0, Number(v)));
        }}
        {...rest}
        className={clsx(fieldBase, "pl-7", rest.className)}
      />
    </div>
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={clsx(fieldBase, "appearance-none cursor-pointer", props.className)}
    />
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...props} className={clsx(fieldBase, "resize-none", props.className)} />;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; hint?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={clsx(
            "rounded-xl border px-3 py-2.5 text-center transition-all cursor-pointer",
            value === o.value
              ? "border-teal-500/60 bg-teal-500/10 text-snow shadow-[0_0_20px_-6px_rgba(13,148,136,0.5)]"
              : "border-line bg-panel/60 text-fog hover:border-line-strong hover:text-snow"
          )}
        >
          <span className="block text-sm font-medium capitalize">{o.label}</span>
          {o.hint && <span className="mt-0.5 block text-[11px] text-dim">{o.hint}</span>}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------- ProgressBar -------------------------------- */

export function ProgressBar({
  pct,
  tone = "blue",
  className,
}: {
  pct: number;
  tone?: "blue" | "green" | "violet" | "amber" | "rose";
  className?: string;
}) {
  const tones = {
    blue: "from-teal-600 to-teal-400",
    green: "from-emerald-700 to-emerald-500",
    violet: "from-indigo-600 to-indigo-400",
    amber: "from-amber-600 to-amber-400",
    rose: "from-rose-600 to-rose-400",
  };
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div className={clsx("h-1.5 w-full overflow-hidden rounded-full bg-raise", className)}>
      <div
        className={clsx("h-full rounded-full bg-gradient-to-r transition-[width] duration-700", tones[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

/* ------------------------------- ProgressRing ------------------------------- */

export function ProgressRing({
  pct,
  size = 72,
  stroke = 6,
  color = "var(--color-chart-1)",
  label,
  sub,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: ReactNode;
  sub?: ReactNode;
}) {
  const clamped = Math.min(100, Math.max(0, pct));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-raise)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (clamped / 100) * c}
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {label ?? <span className="text-sm font-semibold">{Math.round(clamped)}%</span>}
        {sub}
      </div>
    </div>
  );
}

/* ----------------------------------- Gauge ---------------------------------- */

/** 240° arc gauge. `value` in [0, max]. */
export function Gauge({
  value,
  max,
  size = 220,
  label,
  sub,
  color,
}: {
  value: number;
  max: number;
  size?: number;
  label?: ReactNode;
  sub?: ReactNode;
  color?: string;
}) {
  const pct = Math.min(1, Math.max(0, value / max));
  const startAngle = 150;
  const sweep = 240;
  const stroke = size * 0.055;
  const r = size / 2 - stroke;
  const cx = size / 2;
  const cy = size / 2;

  const polar = (angleDeg: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const arc = (from: number, to: number) => {
    const s = polar(from);
    const e = polar(to);
    const large = to - from > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  const fillColor =
    color ?? (pct >= 0.72 ? "var(--color-good)" : pct >= 0.45 ? "var(--color-warn)" : "var(--color-bad)");

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size * 0.82 }}>
      <svg width={size} height={size} className="overflow-visible">
        <path d={arc(startAngle, startAngle + sweep)} fill="none" stroke="var(--color-raise)" strokeWidth={stroke} strokeLinecap="round" />
        {pct > 0.005 && (
          <path
            d={arc(startAngle, startAngle + sweep * pct)}
            fill="none"
            stroke={fillColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 10px ${fillColor}55)`, transition: "d 0.8s" }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-2 text-center">
        {label}
        {sub}
      </div>
    </div>
  );
}

/* ------------------------------ AnimatedNumber ------------------------------ */

export function AnimatedNumber({
  value,
  format,
  duration = 900,
  className,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const raf = useRef<number>(0);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) raf.current = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration]);

  return <span className={className}>{format ? format(display) : Math.round(display).toLocaleString()}</span>;
}

/* --------------------------------- Skeleton --------------------------------- */

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("skeleton", className)} />;
}

/* ------------------------------ ToastViewport ------------------------------- */

export function ToastViewport() {
  const { toasts, dismissToast } = usePulse();
  return (
    <div className="pointer-events-none fixed bottom-24 left-1/2 z-[120] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={clsx(
            "toast-in pointer-events-auto glass-strong flex items-start gap-3 rounded-xl px-4 py-3 text-sm",
            t.tone === "success" && "border-emerald-500/30",
            t.tone === "warn" && "border-amber-500/30"
          )}
        >
          <span
            className={clsx(
              "mt-0.5 shrink-0",
              t.tone === "success" ? "text-mint" : t.tone === "warn" ? "text-gold" : "text-pulse"
            )}
          >
            <Icon name={t.tone === "warn" ? "alert" : "checkCircle"} size={16} />
          </span>
          <span className="flex-1 text-snow/90">{t.message}</span>
          <button
            onClick={() => dismissToast(t.id)}
            aria-label="Dismiss"
            className="shrink-0 text-dim hover:text-snow transition-colors cursor-pointer"
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

/* --------------------------------- PageHead --------------------------------- */

export function PageHead({
  title,
  sub,
  actions,
}: {
  title: string;
  sub?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl tracking-tight sm:text-[1.75rem]">{title}</h1>
        {sub && <p className="mt-1 max-w-2xl text-sm text-fog">{sub}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/* --------------------------------- Orbs bg ---------------------------------- */

export function Orbs({ dim = false }: { dim?: boolean }) {
  return (
    <div aria-hidden className={clsx("pointer-events-none fixed inset-0 overflow-hidden", dim && "opacity-60")}>
      <div className="aurora" />
      
      
      <div className="bg-grid absolute inset-0" />
    </div>
  );
}
