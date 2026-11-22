import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type { Major } from './types';

import { getMajors } from '../../../api/major';
import {
  addFavorite,
  getFavorites,
} from '../../../api/user';

import FilterContent from './components/FilterContent';
import MajorCard from './components/MajorCard';
import DetailPanel from './components/DetailPanel';

const MajorExplore = () => {
  const [majors, setMajors] =
    useState<Major[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [favoriteError, setFavoriteError] =
    useState(false);

  const [selectedMajor, setSelectedMajor] =
    useState<Major | null>(null);

  const [bookmarkedIds, setBookmarkedIds] =
    useState<Set<number>>(new Set());

  const [searchQuery, setSearchQuery] = useState('');

  const [selectedCategories, setSelectedCategories] =
    useState<string[]>([]);

  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.all([
      getMajors(),
      getFavorites().catch(() => []),
    ])
      .then(([majorsData, favorites]) => {
        if (!active) return;

        if (!Array.isArray(majorsData)) {
          throw new Error(
            '전공 목록 응답 형식이 올바르지 않습니다.',
          );
        }

        const sortedMajors = [...majorsData].sort(
          (a, b) =>
            a.name.localeCompare(b.name, 'ko-KR'),
        );

        setMajors(sortedMajors);

        setBookmarkedIds(
          new Set(
            favorites.map(
              (favorite) => favorite.majorId,
            ),
          ),
        );

        setLoadError(false);
      })
      .catch(() => {
        if (!active) return;

        setMajors([]);
        setLoadError(true);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [retryCount]);

  const handleBookmark = useCallback(
    async (id: number) => {
      setFavoriteError(false);

      setBookmarkedIds((previous) => {
        const next = new Set(previous);
        next.add(id);
        return next;
      });

      try {
        await addFavorite(id);
      } catch {
        setBookmarkedIds((previous) => {
          const next = new Set(previous);
          next.delete(id);
          return next;
        });

        setFavoriteError(true);
      }
    },
    [],
  );

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          majors
            .map((major) => major.category)
            .filter(
              (category): category is string =>
                Boolean(category?.trim()),
            ),
        ),
      ).sort((a, b) =>
        a.localeCompare(b, 'ko-KR'),
      ),
    [majors],
  );

  const filteredMajors = useMemo(() => {
    const query =
      searchQuery.trim().toLowerCase();

    return majors.filter((major) => {
      const matchesQuery =
        !query ||
        major.name.toLowerCase().includes(query) ||
        (major.category ?? '')
          .toLowerCase()
          .includes(query);

      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(
          major.category ?? '',
        );

      return matchesQuery && matchesCategory;
    });
  }, [
    majors,
    searchQuery,
    selectedCategories,
  ]);

  const handleRetry = () => {
    setLoading(true);
    setLoadError(false);

    setRetryCount(
      (previous) => previous + 1,
    );
  };

  return (
    <div className="min-h-screen bg-surface pb-16">
      <main className="max-w-[1280px] mx-auto pt-6 sm:pt-8 px-4 sm:px-8 flex flex-col md:flex-row gap-8">
        <aside className="hidden md:block w-72 flex-shrink-0">
          <FilterContent
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
            categories={categories}
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
                  : loadError
                    ? '전공 데이터를 불러오지 못했습니다.'
                    : `전체 ${majors.length}개 전공 중 ${filteredMajors.length}개가 표시됩니다.`}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setFilterOpen(
                  (previous) => !previous,
                )
              }
              className={`md:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-semibold transition-all ${
                filterOpen
                  ? 'bg-secondary text-white border-secondary'
                  : 'bg-white text-on-surface border-outline-variant/20 shadow-sm'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                tune
              </span>

              필터
            </button>
          </div>

          {filterOpen && (
            <div className="md:hidden mb-6 p-5 bg-white rounded-2xl shadow-sm border border-outline-variant/10">
              <FilterContent
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedCategories={selectedCategories}
                setSelectedCategories={setSelectedCategories}
                categories={categories}
              />
            </div>
          )}

          {favoriteError && (
            <div
              role="alert"
              className="mb-4 rounded-xl border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-error flex justify-between gap-3"
            >
              <span>
                북마크를 저장하지 못했습니다.
                다시 시도해 주세요.
              </span>

              <button
                type="button"
                onClick={() =>
                  setFavoriteError(false)
                }
              >
                닫기
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <span className="material-symbols-outlined animate-spin text-4xl text-on-surface-variant">
                progress_activity
              </span>
            </div>
          ) : loadError ? (
            <div
              role="alert"
              className="text-center py-20 text-on-surface-variant"
            >
              <span className="material-symbols-outlined text-5xl mb-3 block">
                error
              </span>

              <p className="font-medium">
                전공 정보를 불러오지 못했습니다.
              </p>

              <p className="text-sm mt-2">
                서버 연결 상태를 확인한 뒤
                다시 시도해 주세요.
              </p>

              <button
                type="button"
                onClick={handleRetry}
                className="mt-5 px-6 py-3 bg-primary-container text-white font-bold rounded-xl"
              >
                다시 불러오기
              </button>
            </div>
          ) : majors.length === 0 ? (
            <div className="text-center py-20 text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl mb-3 block">
                school
              </span>

              <p className="font-medium">
                등록된 전공 데이터가 없습니다.
              </p>

              <p className="text-sm mt-2">
                백엔드 데이터베이스의 전공 등록
                상태를 확인해 주세요.
              </p>
            </div>
          ) : filteredMajors.length === 0 ? (
            <div className="text-center py-20 text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl mb-3 block">
                search_off
              </span>

              <p className="font-medium">
                검색 조건에 맞는 전공이 없습니다.
              </p>

              <button
                type="button"
                className="mt-4 text-secondary font-bold underline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategories([]);
                }}
              >
                검색 조건 초기화
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredMajors.map((major) => (
                <MajorCard
                  key={major.id}
                  major={major}
                  onClick={() =>
                    setSelectedMajor(major)
                  }
                  bookmarked={bookmarkedIds.has(
                    major.id,
                  )}
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
          onClose={() =>
            setSelectedMajor(null)
          }
          bookmarked={bookmarkedIds.has(
            selectedMajor.id,
          )}
          onBookmark={handleBookmark}
        />
      )}
    </div>
  );
};

export default MajorExplore;