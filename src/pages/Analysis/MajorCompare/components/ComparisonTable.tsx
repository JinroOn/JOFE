import type { Major } from '../types';

interface ComparisonTableProps {
  majors: Major[];
  allFitness: number[];
  bestIdx: number;
}

const ComparisonTable = ({ majors, allFitness, bestIdx }: ComparisonTableProps) => (
  <section className="bg-surface-container-lowest rounded-[14px] shadow-[0px_20px_40px_rgba(10,25,47,0.06)] overflow-hidden">
    <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-outline-variant/10 flex items-center justify-between">
      <h3 className="text-xl font-bold flex items-center gap-2">
        <span className="material-symbols-outlined text-secondary">compare_arrows</span>
        전공별 상세 비교
      </h3>
      <button className="text-secondary text-sm font-bold flex items-center gap-1 hover:underline shrink-0">
        <span className="material-symbols-outlined text-sm">add</span>
        비교 전공 추가
      </button>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full border-collapse min-w-[520px]">
        <thead>
          <tr className="bg-surface-container-low/50">
            <th className="p-6 text-left text-xs font-bold text-on-surface-variant uppercase tracking-widest border-b border-outline-variant/10 w-28">
              카테고리
            </th>
            {majors.map((m, i) => (
              <th
                key={m.id}
                className={`p-6 text-left border-b border-outline-variant/10 min-w-[180px] ${
                  i === bestIdx ? 'bg-secondary-container/5' : ''
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-primary-container">{m.name}</span>
                    {i === bestIdx && (
                      <span className="bg-secondary text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold">
                        BEST
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-slate-400">{m.college}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/10">
          <tr>
            <td className="p-6 text-sm font-bold text-on-surface-variant">적합도 점수</td>
            {allFitness.map((f, i) => (
              <td
                key={i}
                className={`p-6 font-black text-lg tabular-nums ${
                  i === bestIdx ? 'bg-secondary-container/5 text-secondary' : 'text-primary-container'
                }`}
              >
                {f}
              </td>
            ))}
          </tr>
          <tr>
            <td className="p-6 text-sm font-bold text-on-surface-variant">취업 경쟁률</td>
            {majors.map((m, i) => (
              <td key={m.id} className={`p-6 ${i === bestIdx ? 'bg-secondary-container/5' : ''}`}>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 bg-surface-container-high rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary rounded-full"
                      style={{ width: `${m.employmentPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-on-surface-variant shrink-0">
                    {m.employment}
                  </span>
                </div>
              </td>
            ))}
          </tr>
          <tr>
            <td className="p-6 text-sm font-bold text-on-surface-variant">역량 밸런스</td>
            {majors.map((m, i) => (
              <td key={m.id} className={`p-6 ${i === bestIdx ? 'bg-secondary-container/5' : ''}`}>
                <div className="flex gap-1 items-end h-8">
                  {m.required.slice(0, 4).map((val, j) => (
                    <div
                      key={j}
                      className="w-2 rounded-sm transition-all duration-300"
                      style={{
                        height: `${val * 10}%`,
                        background: i === bestIdx ? '#00677f' : '#cbd5e1',
                      }}
                    />
                  ))}
                </div>
              </td>
            ))}
          </tr>
          <tr>
            <td className="p-6 text-sm font-bold text-on-surface-variant">예상 초봉</td>
            {majors.map((m, i) => (
              <td
                key={m.id}
                className={`p-6 font-bold text-primary-container ${
                  i === bestIdx ? 'bg-secondary-container/5' : ''
                }`}
              >
                {m.startSalary}
                <span className="text-xs text-on-surface-variant font-normal ml-0.5">만원</span>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  </section>
);

export default ComparisonTable;
