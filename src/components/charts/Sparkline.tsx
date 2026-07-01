interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
}

export function Sparkline({ values, width = 72, height = 26, color }: SparklineProps) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);
  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  });
  const rising = values[values.length - 1] >= values[0];
  const stroke = color ?? (rising ? "var(--color-emerald-bright)" : "var(--color-rust-bright)");

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
