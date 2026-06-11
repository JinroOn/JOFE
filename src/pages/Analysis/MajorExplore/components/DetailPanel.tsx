import { useState } from 'react';
import type { Major } from '../types';
import { getReqScores } from '../types';
import RadarChart from './RadarChart';

const DetailPanel = ({
  major,
  onClose,
  onAddToCompare,
  inCompare,
  bookmarked,
  onBookmark,
}: {
  major: Major;
  onClose: () => void;
  onAddToCompare: (m: Major) => void;
  inCompare: boolean;
  bookmarked: boolean;
  onBookmark: (id: number) => void;
}) => {
  const [bookmarking, setBookmarking] = useState(false);

  const careerList = major.careerPaths
    ? major.careerPaths.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const handleBookmark = async () => {
    if (bookmarked || bookmarking) return;
    setBookmarking(true);
    try {
      await onBookmark(major.id);
    } finally {
      setBookmarking(false);
    }
  };

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
              {major.category ?? '기타'}
            </span>
            <h2 className="text-3xl font-extrabold text-white leading-tight">
              {major.name}
            </h2>
          </div>
        </div>

        <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-4 space-y-6 sm:space-y-8 flex-1">
          <section>
            <h3 className="text-base font-bold text-primary-container mb-3 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-secondary-container rounded-full inline-block" />
              학과 소개
            </h3>
            <p className="text-on-surface-variant leading-relaxed text-sm">
              {major.description ?? ''}
            </p>
          </section>

          <section className="bg-surface-container-low rounded-2xl p-6">
            <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-5">
              Core Competency Analysis
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div className="aspect-square max-w-[280px] mx-auto sm:max-w-none sm:mx-0">
                <RadarChart scores={getReqScores(major)} />
              </div>
              <div className="space-y-3">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-outline-variant/20">
                  <div className="text-xs text-on-surface-variant mb-2">난이도</div>
                  <div className="text-lg font-extrabold text-secondary capitalize">
                    {major.difficulty ?? '-'}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-error/20">
                  <div className="text-xs text-on-surface-variant mb-3 flex items-center gap-1">
                    <span className="material-symbols-outlined text-error text-[14px]">warning</span>
                    과락 기준
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-on-surface-variant">수리·논리</span>
                        <span className="font-bold text-error">{major.thrMathLogic ?? 0}</span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                        <div
                          className="h-full bg-error/60 rounded-full"
                          style={{ width: `${major.thrMathLogic ?? 0}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-on-surface-variant">정보통신</span>
                        <span className="font-bold text-error">{major.thrInfoTech ?? 0}</span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                        <div
                          className="h-full bg-error/60 rounded-full"
                          style={{ width: `${major.thrInfoTech ?? 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {careerList.length > 0 && (
            <section>
              <h3 className="text-base font-bold text-primary-container mb-4">졸업 후 진로 (Career Paths)</h3>
              <div className="flex flex-wrap gap-2">
                {careerList.map((career) => (
                  <span
                    key={career}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white border border-outline-variant/20 rounded-full text-sm font-medium text-on-surface hover:border-secondary/40 hover:shadow-sm transition-all"
                  >
                    <span className="material-symbols-outlined text-secondary text-[16px]">work</span>
                    {career}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="p-4 sm:p-6 bg-white border-t border-outline-variant/20 flex gap-3 shrink-0">
          <button
            onClick={handleBookmark}
            disabled={bookmarked || bookmarking}
            className={`flex-1 py-3.5 px-5 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition-all ${bookmarking ? 'opacity-60' : ''} ${
              bookmarked
                ? 'border-[#FFAB00] text-[#FFAB00]'
                : 'border-primary-container text-primary-container hover:bg-primary-container/5'
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: bookmarked ? "'FILL' 1" : "'FILL' 0" }}
            >
              {bookmarking ? 'hourglass_empty' : 'bookmark'}
            </span>
            {bookmarked ? '북마크됨' : '북마크'}
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
