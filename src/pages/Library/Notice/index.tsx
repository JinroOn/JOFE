import { useEffect, useState } from 'react';
import { getNotices } from '../../../api/notice';
import type { Notice } from '../../../types/notice';

type Tab = 'notice' | 'library';

const formatDate = (iso: string) =>
  new Date(iso)
    .toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    .replace(/\. /g, '.')
    .replace(/\.$/, '');

const formatDatetime = (iso: string) =>
  new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

const LibraryNotice = () => {
  const [activeTab, setActiveTab] =
    useState<Tab>('notice');
  const [search, setSearch] = useState('');
  const [notices, setNotices] = useState<Notice[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] =
    useState<Notice | null>(null);

  useEffect(() => {
    if (activeTab !== 'notice') return;

    let active = true;

    getNotices(currentPage)
      .then((data) => {
        if (!active) return;

        setNotices(data.content);
        setTotalPages(data.totalPages);
        setError(false);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;

        setError(true);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activeTab, currentPage]);

  const filtered = notices
    .filter((notice) =>
      notice.title
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
    )
    .sort((a, b) =>
      a.displayType === b.displayType
        ? 0
        : a.displayType === 'banner'
          ? -1
          : 1,
    );

  const pageNumbers = Array.from(
    { length: Math.min(totalPages, 5) },
    (_, index) => index,
  );

  return (
    <main className="w-full min-w-0 max-w-[1280px] mx-auto px-4 sm:px-8 pt-8 pb-20">
      {/* 소개 */}
      <header className="w-full min-w-0 mb-8 sm:mb-12">
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-primary-container mb-4 break-keep">
          공지사항 및 자료실
        </h1>

        <p className="w-full max-w-2xl text-sm sm:text-base text-on-surface-variant leading-relaxed break-keep">
          진로 설계의 핵심 정보를 확인하세요.
          최신 입시 뉴스부터 전공별 심층 리포트까지
          인공지능이 큐레이션한 가이드라인을 제공합니다.
        </p>
      </header>

      {/* 탭 및 검색 */}
      <section className="w-full min-w-0 bg-surface-container-low p-3 sm:p-6 rounded-2xl mb-8 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex w-full md:w-auto min-w-0 gap-2 p-1 bg-surface-container-high rounded-xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab('notice');
              setCurrentPage(0);
              setLoading(true);
            }}
            className={`flex-1 md:flex-none min-w-0 px-3 sm:px-6 py-3 sm:py-2 rounded-lg font-bold transition-all ${
              activeTab === 'notice'
                ? 'bg-surface-container-lowest text-primary shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-highest'
            }`}
          >
            공지사항
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className={`flex-1 md:flex-none min-w-0 px-3 sm:px-6 py-3 sm:py-2 rounded-lg font-bold transition-all ${
              activeTab === 'library'
                ? 'bg-surface-container-lowest text-primary shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-highest'
            }`}
          >
            자료실
          </button>
        </div>

        <div className="relative w-full md:w-96 min-w-0">
          <span
            aria-hidden="true"
            className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline"
          >
            search
          </span>

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="검색어를 입력하세요..."
            aria-label="공지사항 검색"
            className="block w-full min-w-0 pl-12 pr-4 py-3 bg-surface-container-lowest border-none focus:ring-2 focus:ring-secondary-container rounded-xl text-sm outline-none placeholder:text-outline-variant"
          />
        </div>
      </section>

      {/* 공지사항 */}
      {activeTab === 'notice' && (
        <section className="w-full min-w-0 overflow-hidden bg-surface-container-lowest rounded-[14px] shadow-[0_20px_40px_rgba(10,25,47,0.06)]">
          <table className="w-full min-w-0 table-fixed sm:table-auto border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/10">
                <th className="hidden sm:table-cell px-6 py-5 text-left text-xs font-bold text-on-surface-variant w-16">
                  No
                </th>

                <th className="px-4 sm:px-6 py-4 sm:py-5 text-left text-xs font-bold text-on-surface-variant">
                  Title
                </th>

                <th className="hidden sm:table-cell px-6 py-5 text-center text-xs font-bold text-on-surface-variant w-32">
                  Date
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-outline-variant/10">
              {loading && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-16 text-center text-on-surface-variant"
                  >
                    <span
                      aria-label="불러오는 중"
                      className="material-symbols-outlined animate-spin text-3xl"
                    >
                      progress_activity
                    </span>
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-16 text-center text-on-surface-variant"
                  >
                    공지사항을 불러오지 못했습니다.
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-16 text-center text-on-surface-variant"
                    >
                      공지사항이 없습니다.
                    </td>
                  </tr>
                )}

              {!loading &&
                !error &&
                filtered.map((notice, index) => (
                  <tr
                    key={notice.id}
                    onClick={() => setSelected(notice)}
                    className="group cursor-pointer hover:bg-surface-container-low transition-colors"
                  >
                    <td className="hidden sm:table-cell px-6 py-6 text-sm text-on-surface-variant">
                      {String(
                        currentPage * 10 + index + 1,
                      ).padStart(2, '0')}
                    </td>

                    <td className="min-w-0 px-4 sm:px-6 py-4 sm:py-6">
                      <div className="flex min-w-0 items-start gap-2 sm:gap-3">
                        {notice.displayType === 'banner' && (
                          <span className="shrink-0 rounded bg-error-container text-on-error-container px-2 py-0.5 text-[10px] font-bold">
                            중요
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelected(notice);
                          }}
                          className="block min-w-0 flex-1 text-left text-sm sm:text-base font-medium text-on-surface group-hover:text-secondary leading-relaxed break-words [overflow-wrap:anywhere]"
                        >
                          {notice.title}
                        </button>
                      </div>

                      {/* 모바일에서 날짜는 제목 아래 표시 */}
                      <p className="sm:hidden mt-2 text-xs text-on-surface-variant">
                        {formatDate(notice.createdAt)}
                      </p>
                    </td>

                    <td className="hidden sm:table-cell px-6 py-6 text-center text-sm text-on-surface-variant">
                      {formatDate(notice.createdAt)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          {/* 페이지 이동 */}
          {totalPages > 1 && (
            <nav
              aria-label="공지사항 페이지"
              className="flex flex-wrap items-center justify-center gap-2 px-2 py-6 sm:py-8 border-t border-outline-variant/10"
            >
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setCurrentPage((page) =>
                    Math.max(0, page - 1),
                  );
                }}
                disabled={currentPage === 0}
                aria-label="이전 페이지"
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-container-high disabled:opacity-30"
              >
                <span className="material-symbols-outlined">
                  chevron_left
                </span>
              </button>

              {pageNumbers.map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    setCurrentPage(page);
                  }}
                  aria-current={
                    page === currentPage
                      ? 'page'
                      : undefined
                  }
                  className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold ${
                    page === currentPage
                      ? 'bg-primary-container text-white'
                      : 'hover:bg-surface-container-high'
                  }`}
                >
                  {page + 1}
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setCurrentPage((page) =>
                    Math.min(totalPages - 1, page + 1),
                  );
                }}
                disabled={currentPage === totalPages - 1}
                aria-label="다음 페이지"
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-container-high disabled:opacity-30"
              >
                <span className="material-symbols-outlined">
                  chevron_right
                </span>
              </button>
            </nav>
          )}
        </section>
      )}

      {/* 자료실 탭: 기존 콘텐츠 유지 */}
      {activeTab === 'library' && (
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-12 min-w-0">
          <div className="md:col-span-2 min-w-0 relative overflow-hidden rounded-[14px] bg-primary-container text-white p-5 sm:p-8 group cursor-pointer shadow-[0_20px_40px_rgba(10,25,47,0.06)]">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 to-transparent" />

            <div className="relative z-10">
              <span className="inline-block bg-secondary-container text-on-secondary-fixed px-3 py-1 rounded-full text-xs font-bold mb-4">
                Special Report
              </span>

              <h3 className="text-xl sm:text-2xl font-bold mb-2 break-keep">
                2025 AI 융합전공 입시 트렌드 분석
              </h3>

              <p className="text-white/70 text-sm mb-6 max-w-md leading-relaxed break-keep">
                인공지능 기술의 발전이 대학 전공 선택에
                미치는 영향과 새롭게 신설되는 첨단
                학과들을 분석한 핵심 리포트입니다.
              </p>

              <div className="flex items-center text-secondary-container font-bold text-sm gap-1">
                리포트 보기
                <span className="material-symbols-outlined">
                  arrow_forward
                </span>
              </div>
            </div>
          </div>

          <div className="min-w-0 bg-surface-container-lowest p-5 sm:p-8 rounded-[14px] border border-outline-variant/15 shadow-[0_20px_40px_rgba(10,25,47,0.06)] flex flex-col justify-between">
            <div>
              <span className="inline-block bg-tertiary-fixed text-on-tertiary-fixed px-3 py-1 rounded-full text-xs font-bold mb-4">
                Weekly Best
              </span>

              <h3 className="text-xl font-bold text-primary-container mb-2 break-keep">
                자기소개서 마스터 클래스 자료집
              </h3>
            </div>

            <div className="flex items-center justify-between gap-3 mt-4">
              <div className="flex -space-x-2 shrink-0">
                {[
                  'bg-slate-200',
                  'bg-slate-300',
                  'bg-slate-400',
                ].map((className) => (
                  <div
                    key={className}
                    className={`w-8 h-8 rounded-full border-2 border-surface ${className}`}
                  />
                ))}
              </div>

              <span className="text-xs text-on-surface-variant font-medium">
                1,240+ 다운로드
              </span>
            </div>
          </div>
        </section>
      )}

      {/* 공지사항 상세 모달 */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={selected.title}
            className="bg-white min-w-0 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 px-4 sm:px-6 py-5 border-b border-outline-variant/15">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                {selected.displayType === 'banner' && (
                  <span className="shrink-0 rounded bg-error-container text-on-error-container px-2 py-0.5 text-[10px] font-bold">
                    중요
                  </span>
                )}

                <h3 className="min-w-0 text-lg font-bold text-on-surface break-words [overflow-wrap:anywhere]">
                  {selected.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="닫기"
                className="shrink-0 rounded-lg hover:bg-surface-container-high p-1"
              >
                <span className="material-symbols-outlined">
                  close
                </span>
              </button>
            </div>

            <div className="px-4 sm:px-6 py-3 border-b border-outline-variant/10 flex flex-wrap gap-x-6 gap-y-1 text-xs text-on-surface-variant">
              <span>
                등록일 {formatDatetime(selected.createdAt)}
              </span>
              <span>
                노출 {formatDate(selected.startAt)}
                {' ~ '}
                {formatDate(selected.endAt)}
              </span>
            </div>

            <div className="min-w-0 px-4 sm:px-6 py-6 overflow-y-auto flex-1 text-on-surface leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
              {selected.content}
            </div>

            <div className="px-4 sm:px-6 py-4 border-t border-outline-variant/10 flex justify-end">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="px-6 py-2.5 bg-primary-container text-white rounded-lg font-bold"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default LibraryNotice;