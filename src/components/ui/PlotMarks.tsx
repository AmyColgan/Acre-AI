const CORNERS = [
  { pos: "top", left: true, border: "border-t border-l" },
  { pos: "top", left: false, border: "border-t border-r" },
  { pos: "bottom", left: true, border: "border-b border-l" },
  { pos: "bottom", left: false, border: "border-b border-r" },
] as const;

export function PlotMarks({ size = 14, inset = 12 }: { size?: number; inset?: number }) {
  return (
    <>
      {CORNERS.map((c) => {
        const style: React.CSSProperties = { width: size, height: size };
        if (c.pos === "top") style.top = inset;
        else style.bottom = inset;
        if (c.left) style.left = inset;
        else style.right = inset;

        return (
          <span
            key={`${c.pos}-${c.left}`}
            aria-hidden="true"
            className={`pointer-events-none absolute border-brass-dim ${c.border}`}
            style={style}
          />
        );
      })}
    </>
  );
}
