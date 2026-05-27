const RADAR_AXES = [
  '수리·논리', '문제해결', '정보기술', '구현력',
  '시스템이해', '데이터분석', '의사소통', '협업·윤리', '자기관리',
];

const RadarChart = ({
  currentScores,
  targetScores,
}: {
  currentScores: number[];
  targetScores: number[];
}) => {
  const n = 9;
  const cx = 180, cy = 180, R = 120;
  const angleOf = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const ptAt = (i: number, r: number) => ({
    x: cx + r * Math.cos(angleOf(i)),
    y: cy + r * Math.sin(angleOf(i)),
  });

  const polyPts = (r: number) =>
    Array.from({ length: n }, (_, i) => `${ptAt(i, r).x.toFixed(2)},${ptAt(i, r).y.toFixed(2)}`).join(' ');

  const dataPts = (scores: number[]) =>
    scores.map((s, i) => {
      const { x, y } = ptAt(i, s * R);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ');

  return (
    <svg viewBox="0 0 360 360" className="w-full h-full" style={{ overflow: 'visible' }}>
      {[0.25, 0.5, 0.75, 1].map((level) => (
        <polygon
          key={level}
          points={polyPts(level * R)}
          fill="none"
          stroke="#c5c6cd"
          strokeWidth={level === 1 ? 0.8 : 0.5}
        />
      ))}
      {Array.from({ length: n }, (_, i) => {
        const end = ptAt(i, R);
        return <line key={i} x1={cx} y1={cy} x2={end.x.toFixed(2)} y2={end.y.toFixed(2)} stroke="#c5c6cd" strokeWidth={0.5} />;
      })}
      <polygon
        points={dataPts(targetScores)}
        fill="rgba(0,210,255,0.08)"
        stroke="#00D2FF"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeDasharray="4 2"
      />
      <polygon
        points={dataPts(currentScores)}
        fill="rgba(186,26,26,0.15)"
        stroke="#ba1a1a"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {currentScores.map((s, i) => {
        const p = ptAt(i, s * R);
        return <circle key={i} cx={p.x.toFixed(2)} cy={p.y.toFixed(2)} r={3} fill="#ba1a1a" stroke="white" strokeWidth={0.8} />;
      })}
      {RADAR_AXES.map((label, i) => {
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
            fontSize={10}
            fontWeight="600"
            fill="#44474d"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
};

export default RadarChart;
