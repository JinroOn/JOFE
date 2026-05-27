interface RadarDataset {
  label: string;
  scores: number[];
  color: string;
  strokeDash?: string;
}

interface CompareRadarChartProps {
  datasets: RadarDataset[];
  labels: string[];
}

const CompareRadarChart = ({ datasets, labels }: CompareRadarChartProps) => {
  const size = 280;
  const center = size / 2;
  const radius = 100;
  const n = labels.length;

  const angleOf = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;

  const toPoints = (scores: number[]) =>
    scores.map((s, i) => {
      const a = angleOf(i);
      return [center + s * radius * Math.cos(a), center + s * radius * Math.sin(a)];
    });

  const axisEnds = Array.from({ length: n }, (_, i) => {
    const a = angleOf(i);
    return [center + radius * Math.cos(a), center + radius * Math.sin(a)];
  });

  const labelPositions = Array.from({ length: n }, (_, i) => {
    const a = angleOf(i);
    return [center + (radius + 18) * Math.cos(a), center + (radius + 18) * Math.sin(a)];
  });

  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
      {gridLevels.map((level) => {
        const pts = Array.from({ length: n }, (_, i) => {
          const a = angleOf(i);
          const r = level * radius;
          return `${center + r * Math.cos(a)},${center + r * Math.sin(a)}`;
        }).join(' ');
        return (
          <polygon key={level} points={pts} fill="none" stroke="#e2e8f0" strokeWidth="0.6" />
        );
      })}

      {axisEnds.map(([x, y], i) => (
        <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="#e2e8f0" strokeWidth="0.6" />
      ))}

      {datasets.map((ds) => {
        const pts = toPoints(ds.scores).map(([x, y]) => `${x},${y}`).join(' ');
        return (
          <polygon
            key={ds.label}
            points={pts}
            fill={ds.color}
            fillOpacity={0.13}
            stroke={ds.color}
            strokeWidth={2}
            strokeDasharray={ds.strokeDash}
          />
        );
      })}

      {datasets.map((ds) =>
        toPoints(ds.scores).map(([x, y], i) => (
          <circle key={`${ds.label}-${i}`} cx={x} cy={y} r={2.5} fill={ds.color} />
        ))
      )}

      {labelPositions.map(([x, y], i) => (
        <text
          key={i}
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="7.5"
          fontWeight="600"
          fill="#475569"
        >
          {labels[i]}
        </text>
      ))}
    </svg>
  );
};

export default CompareRadarChart;
