const WIDTH = 320;

export function Sparkline({
  data,
  height = 46,
  strokeColor = "var(--forest-strong)",
  fillId,
}: {
  data: number[];
  height?: number;
  strokeColor?: string;
  fillId: string;
}) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = WIDTH / (data.length - 1);
  const pad = height * 0.1;

  const points = data.map((v, i) => {
    const x = i * step;
    const y = pad + (1 - (v - min) / range) * (height - pad * 2);
    return [x, y];
  });

  const line = points.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `0,${height} ${line} ${WIDTH},${height}`;
  const [lastX, lastY] = points[points.length - 1];

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${WIDTH} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity={0.35} />
          <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${fillId})`} />
      <polyline
        points={line}
        fill="none"
        stroke={strokeColor}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r={4} fill={strokeColor} />
    </svg>
  );
}
