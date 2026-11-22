import type { CapabilityRow } from '../types';

interface CapabilityBarChartProps {
  rows: CapabilityRow[];
  className?: string;
  targetMajorName?: string;
}

const clampPercent = (value: number): number =>
  Math.min(Math.max(value, 0), 100);

/**
 * 학생의 역량 점수(0~100)와 req_* 상대 비중은 비교 가능한 목표 점수가 아닙니다.
 * 임의의 충족/미달 판정이나 점수 차이를 계산하지 않습니다.
 */
const CapabilityBarChart = ({
  rows,
  className = '',
  targetMajorName,
}: CapabilityBarChartProps) => (
  <section className={`rounded-[14px] bg-surface-container-lowest p-6 shadow-sm sm:p-8 ${className}`}>
    <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-primary-container sm:text-xl">
      <span className="material-symbols-outlined text-secondary" aria-hidden="true">bar_chart</span>
      {targetMajorName
        ? `${targetMajorName}의 역량별 상대 비중과 학생 역량 점수`
        : '학생 역량 점수와 전공별 상대 비중'}
    </h3>
    <p className="mb-6 text-sm leading-relaxed text-on-surface-variant">
      학생 점수는 0~100점이며 전공별 req 값은 전공 내부에서 역량의 상대적인 중요도를 나타냅니다.
      서로 다른 척도이므로 높고 낮음을 직접 비교하거나 목표 달성 여부를 판단하지 않습니다.
      역량별 보완 기준은 별도 검토 중입니다.
    </p>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {rows.map((row) => {
        const student = row.userScore === null ? null : clampPercent(row.userScore);
        const weight = row.majorAvg === null ? null : clampPercent(row.majorAvg);
        return (
          <div key={row.axis} className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-4">
            <h4 className="mb-3 font-bold text-primary-container">{row.axis}</h4>
            <div className="mb-3">
              <div className="mb-1 flex justify-between text-xs text-on-surface-variant">
                <span>학생 역량 점수</span>
                <strong>{student === null ? '-' : `${Math.round(student)}점`}</strong>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-container-high">
                {student !== null && (
                  <div className="h-full rounded-full bg-secondary" style={{ width: `${student}%` }} />
                )}
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs text-on-surface-variant">
                <span>전공 내 상대 가중치</span>
                <strong>{weight === null ? '-' : weight.toFixed(1)}</strong>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-container-high">
                {weight !== null && (
                  <div className="h-full rounded-full bg-on-surface-variant/50" style={{ width: `${weight}%` }} />
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </section>
);

export default CapabilityBarChart;