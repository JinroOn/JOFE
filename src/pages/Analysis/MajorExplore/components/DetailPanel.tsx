import { useState } from 'react';
import type { Major } from '../types';
import RadarChart from './RadarChart';

const DetailPanel = ({
  major,
  onClose,
  onAddToCompare,
  inCompare,
}: {
  major: Major;
  onClose: () => void;
  onAddToCompare: (m: Major) => void;
  inCompare: boolean;
}) => {
  const [bookmarked, setBookmarked] = useState(false);

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div
        className="absolute inset-0 bg-primary-container/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full md:max-w-2xl bg-white shadow-2xl h-full flex flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 z-10 w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined text-on-surface">close</span>
        </button>

        <div className="relative w-full h-[180px] sm:h-[200px] shrink-0 bg-gradient-to-br from-primary-container to-secondary flex items-end px-6 sm:px-8 pb-6">
          <div>
            <span className="inline-block bg-white/20 text-white px-3 py-1 rounded-md text-xs font-bold mb-2">
              {major.category}
            </span>
            <h2 className="text-3xl font-extrabold text-white leading-tight">
              {major.name}
              <span className="block text-lg font-normal opacity-70 mt-1">({major.enName})</span>
            </h2>
          </div>
        </div>

        <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-4 space-y-6 sm:space-y-8 flex-1">
          <section>
            <h3 className="text-base font-bold text-primary-container mb-3 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-secondary-container rounded-full inline-block" />
              학과 소개
            </h3>
            <p className="text-on-surface-variant leading-relaxed text-sm">{major.fullDescription}</p>
          </section>

          <section className="bg-surface-container-low rounded-2xl p-6">
            <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-5">
              Core Competency Analysis
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div className="aspect-square max-w-[280px] mx-auto sm:max-w-none sm:mx-0">
                <RadarChart scores={major.scores} />
              </div>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-secondary-container/20">
                  <div className="text-xs text-on-surface-variant mb-1">AI 적합도</div>
                  <div className="text-3xl font-extrabold text-secondary-container">{major.matchRate}%</div>
                  <div className="w-full bg-surface-container-high h-1.5 mt-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary-container rounded-full transition-all duration-700"
                      style={{ width: `${major.matchRate}%` }}
                    />
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-[#FFAB00]/20">
                  <div className="text-xs text-on-surface-variant mb-1">미래 전망</div>
                  <div className="text-2xl font-extrabold text-[#FFAB00]">{major.prospect}</div>
                  <p className="text-[11px] text-on-surface-variant mt-1">
                    {major.prospect === 'HIGH'
                      ? '지속적인 기술 혁신으로 인한 높은 인력 수요 예상'
                      : '꾸준한 수요가 유지되는 안정적인 분야'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-base font-bold text-primary-container mb-4">졸업 후 진로 (Career Paths)</h3>
            <div className="grid grid-cols-2 gap-3">
              {major.careers.map(({ icon, label }) => (
                <div
                  key={label}
                  className="flex items-center p-4 bg-white border border-outline-variant/10 rounded-xl hover:shadow-md transition-shadow group"
                >
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center mr-3 group-hover:bg-secondary-container/10 transition-colors">
                    <span className="material-symbols-outlined text-secondary">{icon}</span>
                  </div>
                  <span className="font-medium text-sm text-on-surface">{label}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="p-4 sm:p-6 bg-white border-t border-outline-variant/20 flex gap-3 shrink-0">
          <button
            onClick={() => setBookmarked(!bookmarked)}
            className={`flex-1 py-3.5 px-5 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition-all ${
              bookmarked
                ? 'border-[#FFAB00] text-[#FFAB00]'
                : 'border-primary-container text-primary-container hover:bg-primary-container/5'
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: bookmarked ? "'FILL' 1" : "'FILL' 0" }}
            >
              bookmark
            </span>
            북마크
          </button>
          <button
            onClick={() => onAddToCompare(major)}
            disabled={inCompare}
            className={`flex-[1.5] py-3.5 px-5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              inCompare
                ? 'bg-surface-container text-outline cursor-not-allowed'
                : 'bg-[#FFAB00] text-white shadow-lg shadow-[#FFAB00]/20 hover:opacity-90 active:scale-95'
            }`}
          >
            <span className="material-symbols-outlined">shopping_cart</span>
            {inCompare ? '담김' : '비교 바구니에 담기'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailPanel;
