import type { CardDisplay as CardType } from "@/types/card";

interface StatRadarProps {
  card: CardType;
  size?: number;
  color?: string;
}

const AXES: { key: keyof CardType; label: string }[] = [
  { key: "attack", label: "ATK" },
  { key: "defense", label: "DEF" },
  { key: "speed", label: "SPD" },
  { key: "health", label: "HP" },
  { key: "luck", label: "LCK" },
];

// Pure-SVG pentagon radar (no chart lib) of the five combat stats (0–99).
export function StatRadar({ card, size = 220, color = "#a855f7" }: StatRadarProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 28;
  const n = AXES.length;

  const point = (i: number, scale: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + Math.cos(angle) * r * scale, cy + Math.sin(angle) * r * scale] as const;
  };

  // Concentric grid rings.
  const rings = [0.25, 0.5, 0.75, 1].map((scale) =>
    AXES.map((_, i) => point(i, scale).join(",")).join(" "),
  );

  // The card's stat polygon.
  const statPoly = AXES.map((a, i) => {
    const v = Math.max(0, Math.min(99, Number(card[a.key]) || 0)) / 99;
    return point(i, v).join(",");
  }).join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
      {rings.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
      ))}
      {AXES.map((_, i) => {
        const [x, y] = point(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />;
      })}
      <polygon points={statPoly} fill={`${color}33`} stroke={color} strokeWidth={2} style={{ filter: `drop-shadow(0 0 6px ${color}66)` }} />
      {AXES.map((a, i) => {
        const v = Math.max(0, Math.min(99, Number(card[a.key]) || 0)) / 99;
        const [x, y] = point(i, v);
        return <circle key={i} cx={x} cy={y} r={3} fill={color} />;
      })}
      {AXES.map((a, i) => {
        const [x, y] = point(i, 1.18);
        return (
          <text key={a.label} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
            className="fill-white/60 font-mono font-bold" style={{ fontSize: 10 }}>
            {a.label} {card[a.key] as number}
          </text>
        );
      })}
    </svg>
  );
}
