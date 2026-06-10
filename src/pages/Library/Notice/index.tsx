import { useEffect, useState } from 'react';
import { getNotices } from '../../../api/notice';
import type { Notice } from '../../../types/notice';

type Tab = 'notice' | 'library';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '');

const formatDatetime = (iso: string) =>
  new Date(iso).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

const LibraryNotice = () => {
  const [activeTab, setActiveTab] = useState<Tab>('notice');
  const [search, setSearch] = useState('');
  const [notices, setNotices] = useState<Notice[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<Notice | null>(null);

  useEffect(() => {
    if (activeTab !== 'notice') return;
    setLoading(true);
    setError(false);
    getNotices(currentPage)
      .then((data) => {
        setNotices(data.content);
        setTotalPages(data.totalPages);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [activeTab, currentPage]);

  const filtered = notices
    .filter((n) => n.title.includes(search))
    .sort((a, b) => (a.displayType === b.displayType ? 0 : a.displayType === 'banner' ? -1 : 1));

  const pageNumbers = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i);

  return (
    <div className="pt-8 pb-20 px-4 sm:px-8 max-w-[1280px] mx-auto overflow-x-hidden">
      <div className="mb-12">
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-primary-container mb-4">공지사항 및 자료실</h1>
        <p className="text-on-surface-variant max-w-2xl leading-relaxed">
          진로 설계의 핵심 정보를 확인하세요. 최신 입시 뉴스부터 전공별 심층 리포트까지 인공지능이 큐레이션한 가이드라인을 제공합니다.
        </p>
      </div>

      <div className="bg-surface-container-low p-6 rounded-2xl mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 p-1 bg-surface-container-high rounded-xl w-full md:w-auto">
          <button
            onClick={() => { setActiveTab('notice'); setCurrentPage(0); }}
            className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === 'notice' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant font-medium hover:bg-surface-container-highest'}`}
          >
            공지사항
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === 'library' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant font-medium hover:bg-surface-container-highest'}`}
          >
            자료실
          </button>
        </div>
        <div className="relative w-full md:w-96">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="검색어를 입력하세요..."
            className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border-none focus:ring-2 focus:ring-secondary-container rounded-xl text-sm transition-all placeholder:text-outline-variant outline-none"
          />
        </div>
      </div>

      {activeTab === 'notice' && (
        <div className="bg-surface-container-lowest rounded-[14px] shadow-[0_20px_40px_rgba(10,25,47,0.06)] overflow-x-auto">
          <table className="w-full border-collapse min-w-[480px]">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/10">
                <th className="hidden sm:table-cell px-6 py-5 text-left text-xs font-bold text-on-surface-variant uppercase tracking-wider w-16">No</th>
                <th className="px-4 sm:px-6 py-5 text-left text-xs font-bold text-on-surface-variant uppercase tracking-wider">Title</th>
                <th className="hidden sm:table-cell px-6 py-5 text-center text-xs font-bold text-on-surface-variant uppercase tracking-wider w-32">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {loading && (
                <tr>
                  <td colSpan={3} className="px-6 py-16 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
                  </td>
                </tr>
              )}
              {error && (
                <tr>
                  <td colSpan={3} className="px-6 py-16 text-center text-on-surface-variant">
                    공지사항을 불러오지 못했습니다.
                  </td>
                </tr>
              )}
              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-16 text-center text-on-surface-variant">
                    공지사항이 없습니다.
                  </td>
                </tr>
              )}
              {!loading && !error && filtered.map((n, idx) => (
                <tr key={n.id} onClick={() => setSelected(n)} className="hover:bg-surface-container-low transition-colors group cursor-pointer">
                  <td className="hidden sm:table-cell px-6 py-6 text-sm text-on-surface-variant">
                    {String(currentPage * 10 + idx + 1).padStart(2, '0')}
                  </td>
                  <td className="px-4 sm:px-6 py-4 sm:py-6">
                    <div className="flex items-center gap-3">
                      {n.displayType === 'banner' && (
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold shrink-0 bg-error-container text-on-error-container">중요</span>
                      )}
                      <span className="text-on-surface font-medium group-hover:text-secondary transition-colors">{n.title}</span>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-6 py-6 text-center text-sm text-on-surface-variant">
                    {formatDate(n.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-8 border-t border-outline-variant/10">
              <button
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors disabled:opacity-30"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              {pageNumbers.map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold transition-colors ${p === currentPage ? 'bg-primary-container text-white' : 'hover:bg-surface-container-high font-medium'}`}
                >
                  {p + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage === totalPages - 1}
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors disabled:opacity-30"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'library' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-12">
          <div className="md:col-span-2 relative overflow-hidden rounded-[14px] bg-primary-container text-white p-8 group cursor-pointer shadow-[0_20px_40px_rgba(10,25,47,0.06)]">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 to-transparent" />
            <div className="relative z-10">
              <span className="bg-secondary-container text-on-secondary-fixed px-3 py-1 rounded-full text-xs font-bold mb-4 inline-block uppercase">Special Report</span>
              <h3 className="text-2xl font-bold mb-2">2025 AI 융합전공 입시 트렌드 분석</h3>
              <p className="text-white/70 text-sm mb-6 max-w-md">
                인공지능 기술의 발전이 대학 전공 선택에 미치는 영향과 새롭게 신설되는 첨단 학과들을 분석한 핵심 리포트입니다.
              </p>
              <div className="flex items-center text-secondary-container font-bold text-sm gap-1 group-hover:gap-2 transition-all">
                리포트 보기 <span className="material-symbols-outlined">arrow_forward</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-8 rounded-[14px] border border-outline-variant/15 shadow-[0_20px_40px_rgba(10,25,47,0.06)] flex flex-col justify-between hover:shadow-xl transition-all duration-500">
            <div>
              <span className="bg-tertiary-fixed text-on-tertiary-fixed px-3 py-1 rounded-full text-xs font-bold mb-4 inline-block">Weekly Best</span>
              <h3 className="text-xl font-bold text-primary-container mb-2">자기소개서 마스터 클래스 자료집</h3>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="flex -space-x-2">
                {['bg-slate-200', 'bg-slate-300', 'bg-slate-400'].map((cls) => (
                  <div key={cls} className={`w-8 h-8 rounded-full border-2 border-surface ${cls}`} />
                ))}
              </div>
              <span className="text-xs text-on-surface-variant font-medium">1,240+ 다운로드</span>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between px-6 py-5 border-b border-outline-variant/15">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {selected.displayType === 'banner' && (
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold shrink-0 bg-error-container text-on-error-container">중요</span>
                )}
                <h3 className="text-lg font-bold text-on-surface truncate">{selected.title}</h3>
              </div>
              <button onClick={() => setSelected(null)} className="ml-4 p-1 rounded-lg hover:bg-surface-container-high transition-colors shrink-0">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="px-6 py-2 border-b border-outline-variant/10 flex gap-6 text-xs text-on-surface-variant">
              <span>등록일 {formatDatetime(selected.createdAt)}</span>
              <span>노출 {formatDate(selected.startAt)} ~ {formatDate(selected.endAt)}</span>
            </div>

            <div className="px-6 py-6 overflow-y-auto flex-1 text-on-surface leading-relaxed whitespace-pre-wrap">
              {selected.content}
            </div>

            <div className="px-6 py-4 border-t border-outline-variant/10 flex justify-end">
              <button
                onClick={() => setSelected(null)}
                className="px-6 py-2.5 bg-primary-container text-white rounded-lg font-bold hover:bg-primary-container/90 transition-all"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryNotice;
