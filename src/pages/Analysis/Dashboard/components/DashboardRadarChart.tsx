interface DashboardRadarChartProps {
  scores: number[]; // 0..1 normalized
  labels: string[];
}

const DashboardRadarChart = ({ scores, labels }: DashboardRadarChartProps) => {
  const n = labels.length;
  const cx = 180, cy = 180, R = 120;
  const angleOf = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const ptAt = (i: number, r: number) => ({
    x: cx + r * Math.cos(angleOf(i)),
    y: cy + r * Math.sin(angleOf(i)),
  });

  const polyPts = (r: number) =>
    Array.from({ length: n }, (_, i) => `${ptAt(i, r).x.toFixed(2)},${ptAt(i, r).y.toFixed(2)}`).join(' ');

  const dataPoints = scores
    .map((s, i) => {
      const { x, y } = ptAt(i, s * R);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <svg viewBox="0 0 360 360" className="w-full h-full" style={{ overflow: 'visible' }}>
      {[0.25, 0.5, 0.75, 1.0].map((level) => (
        <polygon key={level} points={polyPts(level * R)} fill="none" stroke="#e5e8eb" strokeWidth="1" />
      ))}
      {Array.from({ length: n }, (_, i) => {
        const p = ptAt(i, R);
        return <line key={i} x1={cx} y1={cy} x2={p.x.toFixed(2)} y2={p.y.toFixed(2)} stroke="#e5e8eb" strokeWidth="1" />;
      })}
      <polygon points={dataPoints} fill="rgba(0,210,255,0.15)" stroke="#00d2ff" strokeWidth="2.5" />
      {labels.map((label, i) => {
        const p = ptAt(i, R + 20);
        const angle = angleOf(i);
        const anchor = Math.cos(angle) > 0.3 ? 'start' : Math.cos(angle) < -0.3 ? 'end' : 'middle';
        return (
          <text
            key={i}
            x={p.x.toFixed(2)}
            y={p.y.toFixed(2)}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize="10"
            fontWeight="700"
            fill="#44474d"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
};

export default DashboardRadarChart;
