import type { Major } from '../types';

interface ComparisonTableProps {
  majors: Major[];
  allFitness: number[];
  bestIdx: number;
}

const ComparisonTable = ({ majors, allFitness, bestIdx }: ComparisonTableProps) => (
  <section className="bg-surface-container-lowest rounded-[14px] shadow-[0px_20px_40px_rgba(10,25,47,0.06)] overflow-hidden">
    <div className="px-5 sm:px-8 py-5 border-b border-outline-variant/10 flex items-center justify-between">
      <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
        <span className="material-symbols-outlined text-secondary">compare_arrows</span>
        전공별 상세 비교
      </h3>
      <button className="text-secondary text-sm font-bold flex items-center gap-1 hover:underline shrink-0">
        <span className="material-symbols-outlined text-sm">add</span>
        <span className="hidden sm:inline">비교 전공 추가</span>
      </button>
    </div>

    {/* Mobile: card layout */}
    <div className="md:hidden divide-y divide-outline-variant/10">
      {majors.map((m, i) => (
        <div key={m.id} className={`p-5 space-y-4 ${i === bestIdx ? 'bg-secondary-container/5' : ''}`}>
          <div className="flex items-center gap-2">
            <span className="font-black text-primary-container">{m.name}</span>
            {i === bestIdx && (
              <span className="bg-secondary text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold">
                BEST
              </span>
            )}
            <span className="text-xs text-slate-400 ml-1">{m.college}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">적합도 점수</p>
              <span
                className="text-2xl font-black tabular-nums"
                style={{ color: i === bestIdx ? '#00677f' : '#0d1c32' }}
              >
                {allFitness[i]}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">취업 경쟁률</p>
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full bg-secondary rounded-full" style={{ width: `${m.employmentPct}%` }} />
                </div>
                <span className="text-[10px] font-bold text-on-surface-variant shrink-0">{m.employment}</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">역량 밸런스</p>
              <div className="flex gap-1 items-end h-7">
                {m.required.slice(0, 4).map((val, j) => (
                  <div
                    key={j}
                    className="w-2 rounded-sm"
                    style={{ height: `${val * 10}%`, background: i === bestIdx ? '#00677f' : '#cbd5e1' }}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">예상 초봉</p>
              <span className="font-bold text-primary-container">
                {m.startSalary}
                <span className="text-xs text-on-surface-variant font-normal ml-0.5">만원</span>
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Desktop: table layout */}
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-surface-container-low/50">
            <th className="p-4 lg:p-6 text-left text-xs font-bold text-on-surface-variant uppercase tracking-widest border-b border-outline-variant/10 w-28">
              카테고리
            </th>
            {majors.map((m, i) => (
              <th
                key={m.id}
                className={`p-4 lg:p-6 text-left border-b border-outline-variant/10 ${
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
            <td className="p-4 lg:p-6 text-sm font-bold text-on-surface-variant">적합도 점수</td>
            {allFitness.map((f, i) => (
              <td
                key={i}
                className={`p-4 lg:p-6 font-black text-lg tabular-nums ${
                  i === bestIdx ? 'bg-secondary-container/5 text-secondary' : 'text-primary-container'
                }`}
              >
                {f}
              </td>
            ))}
          </tr>
          <tr>
            <td className="p-4 lg:p-6 text-sm font-bold text-on-surface-variant">취업 경쟁률</td>
            {majors.map((m, i) => (
              <td key={m.id} className={`p-4 lg:p-6 ${i === bestIdx ? 'bg-secondary-container/5' : ''}`}>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 bg-surface-container-high rounded-full overflow-hidden">
                    <div className="h-full bg-secondary rounded-full" style={{ width: `${m.employmentPct}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-on-surface-variant shrink-0">{m.employment}</span>
                </div>
              </td>
            ))}
          </tr>
          <tr>
            <td className="p-4 lg:p-6 text-sm font-bold text-on-surface-variant">역량 밸런스</td>
            {majors.map((m, i) => (
              <td key={m.id} className={`p-4 lg:p-6 ${i === bestIdx ? 'bg-secondary-container/5' : ''}`}>
                <div className="flex gap-1 items-end h-8">
                  {m.required.slice(0, 4).map((val, j) => (
                    <div
                      key={j}
                      className="w-2 rounded-sm transition-all duration-300"
                      style={{ height: `${val * 10}%`, background: i === bestIdx ? '#00677f' : '#cbd5e1' }}
                    />
                  ))}
                </div>
              </td>
            ))}
          </tr>
          <tr>
            <td className="p-4 lg:p-6 text-sm font-bold text-on-surface-variant">예상 초봉</td>
            {majors.map((m, i) => (
              <td
                key={m.id}
                className={`p-4 lg:p-6 font-bold text-primary-container ${i === bestIdx ? 'bg-secondary-container/5' : ''}`}
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
