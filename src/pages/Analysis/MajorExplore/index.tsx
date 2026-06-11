import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Major } from './types';
import { getMajors } from '../../../api/major';
import { addFavorite, getFavorites } from '../../../api/user';
import FilterContent from './components/FilterContent';
import MajorCard from './components/MajorCard';
import DetailPanel from './components/DetailPanel';

const MajorExplore = () => {
  const [majors, setMajors] = useState<Major[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const [selectedMajor, setSelectedMajor] = useState<Major | null>(null);
  const [compareList, setCompareList] = useState<Major[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);

  const handleBookmark = useCallback(async (id: number) => {
    setBookmarkedIds((prev) => new Set(prev).add(id));
    try {
      await addFavorite(id);
    } catch {
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, []);

  useEffect(() => {
    Promise.all([getMajors(), getFavorites().catch(() => [])])
      .then(([majorsData, favData]) => {
        setMajors(majorsData);
        setBookmarkedIds(new Set(favData.map((f) => f.majorId)));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAddToCompare = (major: Major) => {
    if (compareList.find((m) => m.id === major.id) || compareList.length >= 3) return;
    setCompareList((prev) => [...prev, major]);
  };

  const handleRemoveFromCompare = (id: number) => {
    setCompareList((prev) => prev.filter((m) => m.id !== id));
  };

  const filteredMajors = majors.filter((m) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q || m.name.toLowerCase().includes(q) || (m.category ?? '').toLowerCase().includes(q);
    const matchesCategory =
      selectedCategories.length === 0 || selectedCategories.includes(m.category ?? '');
    return matchesQuery && matchesCategory;
  });

  return (
    <div className={`min-h-screen bg-surface ${compareList.length > 0 ? 'pb-36' : 'pb-16'}`}>
      <main className="max-w-[1280px] mx-auto pt-6 sm:pt-8 px-4 sm:px-8 flex flex-col md:flex-row gap-8">

        <aside className="hidden md:block w-72 flex-shrink-0">
          <FilterContent
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
          />
        </aside>

        <section className="flex-grow min-w-0">
          <div className="flex items-start justify-between mb-6 sm:mb-8 gap-3">
            <div>
              <h2 className="font-extrabold text-2xl sm:text-3xl tracking-tight text-primary-container">
                Major Discovery
              </h2>
              <p className="text-on-surface-variant mt-1 text-sm">
                {loading
                  ? '전공 데이터를 불러오는 중...'
                  : `총 ${filteredMajors.length}개의 전공이 검색되었습니다.`}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className={`md:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-semibold transition-all ${
                  filterOpen
                    ? 'bg-secondary text-white border-secondary'
                    : 'bg-white text-on-surface border-outline-variant/20 shadow-sm'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">tune</span>
                필터
              </button>
            </div>
          </div>

          {filterOpen && (
            <div className="md:hidden mb-6 p-5 bg-white rounded-2xl shadow-sm border border-outline-variant/10">
              <FilterContent
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedCategories={selectedCategories}
                setSelectedCategories={setSelectedCategories}
              />
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <span className="material-symbols-outlined animate-spin text-4xl text-on-surface-variant">
                progress_activity
              </span>
            </div>
          ) : filteredMajors.length === 0 ? (
            <div className="text-center py-20 text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl mb-3 block">search_off</span>
              <p className="font-medium">검색 결과가 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredMajors.map((major) => (
                <MajorCard
                  key={major.id}
                  major={major}
                  onClick={() => setSelectedMajor(major)}
                  bookmarked={bookmarkedIds.has(major.id)}
                  onBookmark={handleBookmark}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {selectedMajor && (
        <DetailPanel
          major={selectedMajor}
          onClose={() => setSelectedMajor(null)}
          onAddToCompare={handleAddToCompare}
          inCompare={!!compareList.find((m) => m.id === selectedMajor.id)}
          bookmarked={bookmarkedIds.has(selectedMajor.id)}
          onBookmark={handleBookmark}
        />
      )}

      {compareList.length > 0 && (
        <div className="fixed bottom-0 left-0 w-full z-40 px-4 sm:px-8 pb-4 sm:pb-6">
          <div className="max-w-[1280px] mx-auto">
            <div className="bg-primary-container/90 backdrop-blur-2xl rounded-2xl flex items-center px-4 sm:px-8 py-4 sm:h-24 shadow-2xl border border-white/5 gap-4">
              <div className="flex-grow flex items-center gap-4 sm:gap-6 min-w-0">
                <div className="text-white shrink-0">
                  <div className="text-[10px] sm:text-xs font-bold opacity-60 uppercase tracking-tighter">비교 바구니</div>
                  <div className="text-base sm:text-lg font-bold">
                    <span className="text-secondary-container">{compareList.length}</span>
                    <span className="opacity-60">/3</span>
                  </div>
                </div>
                <div className="hidden sm:flex gap-3">
                  {Array.from({ length: 3 }, (_, i) => {
                    const m = compareList[i];
                    if (m) {
                      return (
                        <div
                          key={i}
                          className="w-32 h-14 bg-white/10 rounded-xl border border-white/20 flex items-center px-3 gap-2 relative group overflow-hidden"
                        >
                          <span className="text-[11px] text-white font-bold truncate">{m.name}</span>
                          <button
                            onClick={() => handleRemoveFromCompare(m.id)}
                            className="absolute -right-8 group-hover:right-2 transition-all p-1 bg-error rounded-full flex items-center justify-center"
                          >
                            <span className="material-symbols-outlined text-[12px] text-white">close</span>
                          </button>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={i}
                        className="w-32 h-14 bg-white/5 border border-dashed border-white/20 rounded-xl flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-white/30">add</span>
                      </div>
                    );
                  })}
                </div>
                <div className="sm:hidden flex gap-2 overflow-x-auto">
                  {compareList.map((m) => (
                    <div
                      key={m.id}
                      className="shrink-0 flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-1.5 border border-white/20"
                    >
                      <span className="text-[11px] text-white font-bold max-w-[80px] truncate">{m.name}</span>
                      <button onClick={() => handleRemoveFromCompare(m.id)}>
                        <span className="material-symbols-outlined text-[14px] text-white/60">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() =>
                  navigate(`/analysis/compare?ids=${compareList.map((m) => m.id).join(',')}`)
                }
                className="shrink-0 bg-[#FFAB00] text-primary-container font-bold px-4 sm:px-8 py-3 sm:py-4 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all text-sm sm:text-base"
              >
                상세 비교
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MajorExplore;
