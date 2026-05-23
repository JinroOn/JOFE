import { useState } from 'react';

type Tab = 'notice' | 'library';

const notices = [
  { id: 8, badge: '중요', badgeClass: 'bg-error-container text-on-error-container', title: '진로 온(JinroOn) 플랫폼 시스템 점검 안내 (2024.11.20)', date: '2024.11.15', views: '3.2k', attachment: false },
  { id: 7, badge: null, badgeClass: '', title: '전공적성 검사 리뉴얼 기념 이벤트 당첨자 발표', date: '2024.11.12', views: '1.8k', attachment: false },
  { id: 6, badge: null, badgeClass: '', title: '2025학년도 서울 주요 대학 입학 전형 변경사항 총정리', date: '2024.11.08', views: '5.4k', attachment: true },
  { id: 5, badge: null, badgeClass: '', title: '학습 동기 부여를 위한 명사 초청 온라인 세미나 참여 안내', date: '2024.11.01', views: '892', attachment: false },
  { id: 4, badge: null, badgeClass: '', title: 'JinroOn AI 진단 알고리즘 업데이트 내역 보고서', date: '2024.10.25', views: '1.1k', attachment: true },
];

const Notice = () => {
  const [activeTab, setActiveTab] = useState<Tab>('notice');
  const [search, setSearch] = useState('');

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
            onClick={() => setActiveTab('notice')}
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

      <div className="bg-surface-container-lowest rounded-[14px] shadow-[0_20px_40px_rgba(10,25,47,0.06)]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant/10">
              <th className="hidden sm:table-cell px-6 py-5 text-left text-xs font-bold text-on-surface-variant uppercase tracking-wider w-16">No</th>
              <th className="px-4 sm:px-6 py-5 text-left text-xs font-bold text-on-surface-variant uppercase tracking-wider">Title</th>
              <th className="hidden sm:table-cell px-6 py-5 text-center text-xs font-bold text-on-surface-variant uppercase tracking-wider w-32">Date</th>
              <th className="hidden md:table-cell px-6 py-5 text-center text-xs font-bold text-on-surface-variant uppercase tracking-wider w-24">Views</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {notices
              .filter((n) => n.title.includes(search))
              .map((n) => (
                <tr key={n.id} className="hover:bg-surface-container-low transition-colors group cursor-pointer">
                  <td className="hidden sm:table-cell px-6 py-6 text-sm text-on-surface-variant">{String(n.id).padStart(2, '0')}</td>
                  <td className="px-4 sm:px-6 py-4 sm:py-6">
                    <div className="flex items-center gap-3">
                      {n.badge && (
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold shrink-0 ${n.badgeClass}`}>{n.badge}</span>
                      )}
                      <span className="text-on-surface font-medium group-hover:text-secondary transition-colors">{n.title}</span>
                      {n.attachment && (
                        <span className="material-symbols-outlined text-secondary-container text-lg shrink-0">attachment</span>
                      )}
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-6 py-6 text-center text-sm text-on-surface-variant">{n.date}</td>
                  <td className="hidden md:table-cell px-6 py-6 text-center text-sm text-on-surface-variant">{n.views}</td>
                </tr>
              ))}
          </tbody>
        </table>

        <div className="flex items-center justify-center gap-2 py-8 border-t border-outline-variant/10">
          <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          {[1, 2, 3].map((p) => (
            <button
              key={p}
              className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold transition-colors ${p === 1 ? 'bg-primary-container text-white' : 'hover:bg-surface-container-high font-medium'}`}
            >
              {p}
            </button>
          ))}
          <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notice;
