import type { Major } from '../types';

interface FitnessCardProps {
  majors: Major[];
  allFitness: number[];
  bestIdx: number;
}

const FitnessCard = ({ majors, allFitness, bestIdx }: FitnessCardProps) => (
  <section className="bg-primary-container p-6 sm:p-8 rounded-[14px] shadow-xl flex flex-col justify-between min-h-[320px]">
    <div>
      <h3 className="text-white text-lg font-bold mb-1">실시간 적합도 요약</h3>
      <p className="text-slate-400 text-sm">{majors[bestIdx].name} 기준</p>
    </div>
    <div className="my-6">
      <div className="flex items-end gap-1">
        <span className="text-7xl font-black text-[#00D2FF] leading-none tabular-nums">
          {allFitness[bestIdx]}
        </span>
        <span className="text-2xl font-bold text-white/50 mb-2">%</span>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <span
          className="material-symbols-outlined text-[#FFAB00] text-sm"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          trending_up
        </span>
        <span className="text-white font-bold text-sm">지난 시뮬레이션 대비 4.2% 상승</span>
      </div>
    </div>
    <div className="space-y-3 pt-5 border-t border-white/10">
      {majors.map((m, i) => (
        <div key={m.id} className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">{m.name}</span>
          <span
            className={`text-sm font-black tabular-nums ${
              i === bestIdx ? 'text-[#00D2FF]' : 'text-white/50'
            }`}
          >
            {allFitness[i]}%
          </span>
        </div>
      ))}
    </div>
  </section>
);

export default FitnessCard;
