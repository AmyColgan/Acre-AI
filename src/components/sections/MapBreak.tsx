import { Topography } from "@/components/graphics/Topography";

export function MapBreak() {
  return (
    <section className="relative h-[60vh] min-h-[420px] overflow-hidden border-y border-hairline bg-ink-2">
      <Topography
        seed={11}
        peakCount={4}
        ringsPerPeak={12}
        width={1600}
        height={700}
        strokeOpacity={0.4}
        className="absolute inset-0 h-full w-full text-brass-dim"
      />

      <div className="absolute bottom-8 left-6 right-6 flex flex-wrap items-end justify-between gap-4 sm:left-10 sm:right-10">
        <p className="coord-label max-w-xs text-muted">
          Fig. 01 · every account surveyed and re-plotted overnight
        </p>
        <div className="coord-label flex items-center gap-2 text-muted">
          <span className="h-px w-6 bg-hairline-strong" />
          <span>0</span>
          <span className="h-px w-10 bg-hairline-strong" />
          <span>250K</span>
          <span className="h-px w-10 bg-hairline-strong" />
          <span>500K</span>
        </div>
      </div>
    </section>
  );
}
