"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { usePulse } from "@/lib/store";
import { Skeleton } from "@/components/ui/core";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { hydrated } = usePulse();

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-7xl space-y-4 px-6 py-10">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
