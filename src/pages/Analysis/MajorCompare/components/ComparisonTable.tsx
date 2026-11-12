import type { Major } from '../types';

const DIFFICULTY_LABEL = { low: 'Easy', mid: 'Medium', high: 'Hard' } as const;
const DIFFICULTY_COLOR = {
  low: 'text-on-surface-variant',
  mid: 'text-secondary',
  high: 'text-error',
} as const;

interface ComparisonTableProps {
  majors: Major[];
  allFitness: number[];
  bestIdx: number;
}

const ComparisonTable = ({ majors, allFitness, bestIdx }: ComparisonTableProps) => (
  <section className="bg-surface-container-lowest rounded-[14px] shadow-[0px_20px_40px_rgba(10,25,47,0.06)] overflow-hidden">
    <div className="px-5 sm:px-8 py-5 border-b border-outline-variant/10 flex items-center gap-2">
      <span className="material-symbols-outlined text-secondary">compare_arrows</span>
      <h3 className="text-lg sm:text-xl font-bold">전공별 상세 비교</h3>
    </div>

    {/* Mobile: card layout */}
    <div className="md:hidden divide-y divide-outline-variant/10">
      {majors.map((m, i) => (
        <div key={m.id} className={`p-5 space-y-4 ${i === bestIdx ? 'bg-secondary-container/5' : ''}`}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-black text-primary-container">{m.name}</span>
            {i === bestIdx && (
              <span className="bg-secondary text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold">
                BEST
              </span>
            )}
            <span className="text-xs text-on-surface-variant">{m.category ?? '-'}</span>
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
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">난이도</p>
              <span className={`font-bold text-sm ${m.difficulty ? DIFFICULTY_COLOR[m.difficulty] : 'text-on-surface-variant'}`}>
                {m.difficulty ? DIFFICULTY_LABEL[m.difficulty] : '-'}
              </span>
            </div>
            {m.careerPaths && (
              <div className="col-span-2">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">진출 분야</p>
                <p className="text-xs text-on-surface line-clamp-2">{m.careerPaths}</p>
              </div>
            )}
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
                  <span className="text-[10px] font-medium text-on-surface-variant">{m.category ?? '-'}</span>
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
            <td className="p-4 lg:p-6 text-sm font-bold text-on-surface-variant">난이도</td>
            {majors.map((m, i) => (
              <td key={m.id} className={`p-4 lg:p-6 ${i === bestIdx ? 'bg-secondary-container/5' : ''}`}>
                <span className={`font-bold text-sm ${m.difficulty ? DIFFICULTY_COLOR[m.difficulty] : 'text-on-surface-variant'}`}>
                  {m.difficulty ? DIFFICULTY_LABEL[m.difficulty] : '-'}
                </span>
              </td>
            ))}
          </tr>
          <tr>
            <td className="p-4 lg:p-6 text-sm font-bold text-on-surface-variant">진출 분야</td>
            {majors.map((m, i) => (
              <td
                key={m.id}
                className={`p-4 lg:p-6 text-sm text-on-surface max-w-[200px] ${i === bestIdx ? 'bg-secondary-container/5' : ''}`}
              >
                <p className="line-clamp-2">{m.careerPaths ?? '-'}</p>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  </section>
);

export default ComparisonTable;
