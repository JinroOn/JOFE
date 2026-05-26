import type { RecommendedMajor } from '../types';

interface RecommendedMajorsProps {
  majors: RecommendedMajor[];
}

const RecommendedMajors = ({ majors }: RecommendedMajorsProps) => {
  const [top1, ...rest] = majors;
  return (
    <div className="space-y-4">
      <div className="bg-surface-container-lowest p-6 rounded-[14px] shadow-sm border-l-4 border-[#FFAB00] hover:translate-x-1 transition-transform">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-[10px] font-black text-[#FFAB00] bg-[#FFAB00]/10 px-2 py-0.5 rounded">
              #1 RECOMMENDED
            </span>
            <h4 className="text-2xl font-bold text-primary-container mt-1">{top1.name}</h4>
          </div>
          <div className="text-right shrink-0">
            <span className="text-3xl font-black text-[#FFAB00]">
              {top1.suitability}<span className="text-sm">%</span>
            </span>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Suitability</p>
          </div>
        </div>
        <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden mb-4">
          <div className="h-full bg-[#FFAB00] rounded-full" style={{ width: `${top1.suitability}%` }} />
        </div>
        <p className="text-on-surface-variant text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-sm shrink-0">info</span>
          {top1.description}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {rest.map((m) => (
          <div key={m.rank} className="bg-surface-container-lowest p-5 rounded-[14px] shadow-sm hover:translate-x-1 transition-transform">
            <div className="flex justify-between items-center mb-3">
              <h5 className="font-bold text-primary-container">{m.name}</h5>
              <span className="text-secondary font-black tabular-nums">{m.suitability}%</span>
            </div>
            <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden mb-3">
              <div className="h-full bg-secondary rounded-full" style={{ width: `${m.suitability}%` }} />
            </div>
            <p className="text-xs text-on-surface-variant leading-snug">{m.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendedMajors;
