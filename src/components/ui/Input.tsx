import { type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border border-hairline-strong bg-ink px-4 py-2.5 text-sm text-parchment placeholder:text-muted outline-none transition-colors duration-200 focus:border-brass",
        className
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted",
        className
      )}
      {...props}
    />
  );
}
