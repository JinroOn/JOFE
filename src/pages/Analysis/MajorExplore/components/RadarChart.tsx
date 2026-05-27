const RADAR_AXES = [
  '수리·논리', '문제해결', '정보기술', '구현력',
  '시스템이해', '데이터분석', '의사소통', '협업·윤리', '자기관리',
];

const RadarChart = ({ scores }: { scores: number[] }) => {
  const n = 9;
  const cx = 120, cy = 120, r = 80;

  const getAngle = (i: number) => (-90 + i * (360 / n)) * (Math.PI / 180);

  const getPoint = (radius: number, i: number) => ({
    x: cx + radius * Math.cos(getAngle(i)),
    y: cy + radius * Math.sin(getAngle(i)),
  });

  const polyPoints = (radius: number) =>
    Array.from({ length: n }, (_, i) => getPoint(radius, i))
      .map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
      .join(' ');

  const dataPoints = scores
    .map((s, i) => getPoint(r * s, i))
    .map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(' ');

  const LABEL_R = 104;
  const labelCfg: { anchor: 'start' | 'middle' | 'end'; dy: number }[] = [
    { anchor: 'middle', dy: -6 },
    { anchor: 'start',  dy: -4 },
    { anchor: 'start',  dy:  4 },
    { anchor: 'start',  dy:  5 },
    { anchor: 'middle', dy: 13 },
    { anchor: 'end',    dy: 13 },
    { anchor: 'end',    dy:  5 },
    { anchor: 'end',    dy:  4 },
    { anchor: 'end',    dy: -4 },
  ];

  return (
    <svg viewBox="0 0 240 240" className="w-full h-full" style={{ overflow: 'visible' }}>
      {[0.25, 0.5, 0.75, 1].map((s) => (
        <polygon
          key={s}
          points={polyPoints(r * s)}
          fill="none"
          stroke="#c5c6cd"
          strokeWidth={s === 1 ? 0.8 : 0.5}
        />
      ))}
      {Array.from({ length: n }, (_, i) => {
        const end = getPoint(r, i);
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={end.x} y2={end.y}
            stroke="#c5c6cd"
            strokeWidth={0.5}
          />
        );
      })}
      <polygon
        points={dataPoints}
        fill="rgba(0,210,255,0.15)"
        stroke="#00D2FF"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {scores.map((s, i) => {
        const p = getPoint(r * s, i);
        return (
          <circle
            key={i}
            cx={p.x} cy={p.y}
            r={2.5}
            fill="#00677f"
            stroke="white"
            strokeWidth={0.8}
          />
        );
      })}
      {RADAR_AXES.map((label, i) => {
        const p = getPoint(LABEL_R, i);
        const cfg = labelCfg[i];
        return (
          <text
            key={i}
            x={p.x}
            y={p.y + cfg.dy}
            textAnchor={cfg.anchor}
            fontSize={7.5}
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
