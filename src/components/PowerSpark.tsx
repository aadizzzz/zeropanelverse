/** Tiny server-rendered power-curve sparkline used on the global timeline. */
export function PowerSpark({
  values,
  accent,
  width = 110,
  height = 30,
}: {
  values: number[];
  accent: string;
  width?: number;
  height?: number;
}) {
  if (values.length < 2) {
    return <span className="mono text-[8px] text-mute">single entry</span>;
  }
  const step = width / (values.length - 1);
  const y = (value: number) => height - 3 - (value / 100) * (height - 6);
  const points = values.map((value, index) => `${(index * step).toFixed(1)},${y(value).toFixed(1)}`);
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Power level across the franchise"
    >
      <line x1="0" x2={width} y1={height - 1} y2={height - 1} stroke="#232327" />
      <polyline points={points.join(" ")} fill="none" stroke={accent} strokeWidth="1.6" />
      {values.map((value, index) => (
        <circle key={index} cx={index * step} cy={y(value)} r="2.2" fill={accent} />
      ))}
    </svg>
  );
}
