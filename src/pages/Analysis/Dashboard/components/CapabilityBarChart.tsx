import type { CapabilityRow } from '../types';

interface CapabilityBarChartProps {
  rows: CapabilityRow[];
  className?: string;
  targetMajorName?: string;
}

const clampPercent = (value: number) => Math.min(Math.max(value, 0), 100);

const CapabilityBarChart = ({
  rows,
  className = '',
  targetMajorName,
}: CapabilityBarChartProps) => (
  <section
    className={`bg-surface-container-lowest p-6 sm:p-8 rounded-[14px] shadow-[0px_20px_40px_rgba(10,25,47,0.06)] ${className}`}
  >
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
        <span className="material-symbols-outlined text-secondary">bar_chart</span>
        {targetMajorName
          ? `${targetMajorName} 요구 역량 vs 내 역량 비교`
          : '전공 요구 역량 vs 내 역량 비교'}
      </h3>
      <div className="flex gap-4 text-xs font-bold shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-secondary rounded-sm" />
          <span className="text-on-surface-variant">내 점수</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-surface-container-high rounded-sm border border-outline-variant/30" />
          <span className="text-on-surface-variant">전공 요구 점수</span>
        </div>
      </div>
    </div>

    <p className="text-xs text-on-surface-variant mb-5">
      정보가 없는 항목은 '-'로 표시하며 임의의 점수를 채우지 않습니다.
    </p>

    <div className="space-y-5">
      {rows.map((row) => {
        const userScore = row.userScore === null ? null : clampPercent(row.userScore);
        const majorAvg = row.majorAvg === null ? null : clampPercent(row.majorAvg);
        const comparable = userScore !== null && majorAvg !== null;
        const meetsRequirement = comparable && userScore >= majorAvg;

        return (
          <div key={row.axis} className="space-y-1.5">
            <div className="flex justify-between text-sm font-bold">
              <span className="text-primary-container">{row.axis}</span>
              <span className={`tabular-nums ${meetsRequirement ? 'text-secondary' : 'text-on-surface-variant'}`}>
                {userScore === null ? '-' : Math.round(userScore)} / {majorAvg === null ? '-' : Math.round(majorAvg)}
              </span>
            </div>
            <div className="relative h-3 bg-surface-container-low rounded-full overflow-hidden">
              {majorAvg !== null && (
                <div
                  className="absolute h-full bg-surface-container-high rounded-full"
                  style={{ width: `${majorAvg}%` }}
                />
              )}
              {userScore !== null && (
                <div
                  className={`absolute h-full rounded-full transition-all duration-500 ${meetsRequirement ? 'bg-secondary' : 'bg-secondary/60'}`}
                  style={{ width: `${userScore}%` }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  </section>
);

export default CapabilityBarChart;