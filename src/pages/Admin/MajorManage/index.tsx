interface Stat {
  label: string;
  value: string;
  icon: string;
  dark?: boolean;
  border?: string;
}

const STATS: Stat[] = [
  { label: 'Total Majors', value: '142', icon: 'account_balance', border: 'border-b-2 border-secondary-container' },
  { label: 'Active Vectors', value: '856', icon: 'polyline' },
  { label: 'Last Update', value: '2h Ago', icon: 'history' },
  { label: 'AI Match Confidence', value: '98.2%', icon: 'auto_awesome', dark: true },
];

const MAJORS = [
  {
    icon: 'terminal',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    name: '컴퓨터공학부',
    nameEn: 'Computer Science',
    category: '공학계열',
    categoryBg: 'bg-secondary-fixed text-on-secondary-fixed',
    vectorLabel: 'Math/Logic',
    vectorPct: 92,
    vectorColor: 'bg-secondary-container',
    tags: [
      { label: 'Data: 85', bg: 'bg-blue-50 text-blue-700' },
      { label: 'System: 88', bg: 'bg-blue-50 text-blue-700' },
    ],
    jobs: ['SW엔지니어', '데이터사이언티스트', '+3'],
  },
  {
    icon: 'account_balance',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    name: '경영학과',
    nameEn: 'Business Administration',
    category: '사회계열',
    categoryBg: 'bg-tertiary-fixed text-on-tertiary-fixed',
    vectorLabel: 'Communication',
    vectorPct: 88,
    vectorColor: 'bg-tertiary-fixed-dim',
    tags: [
      { label: 'Logic: 74', bg: 'bg-amber-50 text-amber-700' },
      { label: 'Strategy: 90', bg: 'bg-amber-50 text-amber-700' },
    ],
    jobs: ['경영컨설턴트', '마케팅매니저'],
  },
  {
    icon: 'palette',
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
    name: '시각디자인학과',
    nameEn: 'Visual Design',
    category: '예체능계열',
    categoryBg: 'bg-surface-container-high text-on-surface-variant',
    vectorLabel: 'Creative',
    vectorPct: 95,
    vectorColor: 'bg-green-500',
    tags: [
      { label: 'Digital: 82', bg: 'bg-green-50 text-green-700' },
      { label: 'Art: 98', bg: 'bg-green-50 text-green-700' },
    ],
    jobs: ['UI/UX디자이너', '브랜드디자이너'],
  },
];

const AdminMajorManage = () => (
  <div className="px-4 sm:px-8 lg:px-10 pt-6 sm:pt-8 lg:pt-10 relative">
    {/* 배경 장식 */}
    <div className="fixed -bottom-24 -left-24 w-96 h-96 bg-secondary-container/5 blur-[120px] rounded-full -z-10" />
    <div className="fixed -top-24 -right-24 w-96 h-96 bg-tertiary-fixed-dim/5 blur-[120px] rounded-full -z-10" />

    {/* 통계 카드 */}
    <section className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
      {STATS.map(({ label, value, icon, dark, border }) => (
        <div
          key={label}
          className={`p-5 sm:p-8 rounded-2xl cloud-shadow relative overflow-hidden group ${
            dark ? 'bg-primary-container' : `bg-surface-container-lowest ${border ?? ''}`
          }`}
        >
          <div className="relative z-10">
            <p className="text-xs sm:text-sm font-bold text-on-primary-container uppercase tracking-wider mb-1 sm:mb-2">
              {label}
            </p>
            <p className={`text-3xl sm:text-4xl font-extrabold tracking-tight font-headline ${dark ? 'text-white' : 'text-primary'}`}>
              {value}
            </p>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-all duration-500 group-hover:scale-110">
            <span className={`material-symbols-outlined text-7xl sm:text-8xl ${dark ? 'text-secondary-container' : ''}`}>
              {icon}
            </span>
          </div>
        </div>
      ))}
    </section>

    {/* 테이블 섹션 */}
    <div className="bg-surface-container-lowest rounded-[14px] cloud-shadow overflow-hidden mb-8">
      {/* 테이블 헤더 */}
      <div className="px-5 sm:px-8 py-5 sm:py-7 flex flex-wrap justify-between items-center gap-3 bg-white border-b border-surface-container-high">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-on-surface font-headline">전공 핵심 역량 데이터베이스</h3>
          <p className="text-sm sm:text-base text-on-primary-container mt-1">
            AI 진로 매칭을 위한 전공별 핵심 역량 벡터 및 직무 연결성 관리
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <button className="px-3 sm:px-5 py-2 sm:py-2.5 flex items-center gap-2 border border-outline-variant/20 rounded-lg text-sm font-medium hover:bg-surface-container transition-all">
            <span className="material-symbols-outlined text-sm">filter_list</span>
            <span className="hidden sm:inline">필터</span>
          </button>
          <button className="px-3 sm:px-5 py-2 sm:py-2.5 flex items-center gap-2 border border-outline-variant/20 rounded-lg text-sm font-medium hover:bg-surface-container transition-all">
            <span className="material-symbols-outlined text-sm">download</span>
            <span className="hidden sm:inline">엑셀 다운로드</span>
          </button>
        </div>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[460px]">
          <thead>
            <tr className="bg-surface-container-low/50">
              <th className="text-xs sm:text-sm font-bold text-on-primary-container uppercase tracking-wide px-5 sm:px-8 py-4 sm:py-5">전공 명칭</th>
              <th className="text-xs sm:text-sm font-bold text-on-primary-container uppercase tracking-wide px-5 sm:px-8 py-4 sm:py-5">카테고리</th>
              <th className="hidden sm:table-cell text-xs sm:text-sm font-bold text-on-primary-container uppercase tracking-wide px-5 sm:px-8 py-4 sm:py-5">역량 벡터</th>
              <th className="text-xs sm:text-sm font-bold text-on-primary-container uppercase tracking-wide px-5 sm:px-8 py-4 sm:py-5">연관 직무</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-high">
            {MAJORS.map((m) => (
              <tr key={m.name} className="hover:bg-surface-container-low/30 transition-colors">
                <td className="py-5 sm:py-7 px-5 sm:px-8 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${m.iconBg} flex items-center justify-center ${m.iconColor} shrink-0`}>
                      <span className="material-symbols-outlined text-xl sm:text-2xl">{m.icon}</span>
                    </div>
                    <div>
                      <p className="font-bold text-on-surface text-base sm:text-lg">{m.name}</p>
                      <p className="text-xs sm:text-sm text-on-primary-container">{m.nameEn}</p>
                    </div>
                  </div>
                </td>

                <td className="py-5 sm:py-7 px-5 sm:px-8 whitespace-nowrap">
                  <span className={`px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-bold rounded-full ${m.categoryBg}`}>
                    {m.category}
                  </span>
                </td>

                <td className="hidden sm:table-cell py-5 sm:py-7 px-5 sm:px-8">
                  <div className="flex flex-col gap-2 w-52">
                    <div className="flex justify-between text-xs font-bold">
                      <span>{m.vectorLabel}</span>
                      <span>{m.vectorPct}%</span>
                    </div>
                    <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                      <div className={`h-full ${m.vectorColor}`} style={{ width: `${m.vectorPct}%` }} />
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {m.tags.map((t) => (
                        <span key={t.label} className={`px-2 py-0.5 text-xs rounded ${t.bg}`}>{t.label}</span>
                      ))}
                    </div>
                  </div>
                </td>

                <td className="py-5 sm:py-7 px-5 sm:px-8">
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {m.jobs.map((j) => (
                      <span key={j} className="text-xs sm:text-sm text-on-primary-container bg-surface-container px-2 sm:px-3 py-1 rounded-lg whitespace-nowrap">
                        {j}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      <div className="px-5 sm:px-8 py-4 sm:py-5 bg-surface-container-low/30 border-t border-surface-container-high flex justify-between items-center gap-3">
        <p className="text-xs sm:text-sm text-on-primary-container shrink-0">1-10 / 142</p>
        <div className="flex gap-1.5 sm:gap-2">
          <button className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg border border-outline-variant/20 bg-white hover:bg-surface-container transition-all">
            <span className="material-symbols-outlined text-sm sm:text-base">chevron_left</span>
          </button>
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg border border-outline-variant/20 text-xs sm:text-sm font-bold transition-all ${
                n === 1 ? 'bg-secondary-container text-on-secondary-container' : 'bg-white hover:bg-surface-container'
              }`}
            >
              {n}
            </button>
          ))}
          <button className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg border border-outline-variant/20 bg-white hover:bg-surface-container transition-all">
            <span className="material-symbols-outlined text-sm sm:text-base">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default AdminMajorManage;
