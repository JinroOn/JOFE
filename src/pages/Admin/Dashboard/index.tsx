import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string;
  badge: string;
  icon: string;
  footer: ReactNode;
}

const StatCard = ({ label, value, badge, icon, footer }: StatCardProps) => (
  <div className="bg-surface-container-lowest cloud-shadow rounded-2xl p-5 sm:p-8 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
      <span className="material-symbols-outlined text-7xl sm:text-8xl">{icon}</span>
    </div>
    <p className="text-on-primary-container text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 sm:mb-3">{label}</p>
    <div className="flex items-end gap-2">
      <span className="text-4xl sm:text-5xl font-extrabold font-headline text-primary">{value}</span>
      <span className="text-secondary font-bold text-sm mb-1">{badge}</span>
    </div>
    {footer}
  </div>
);

const ACTIVITIES = [
  {
    initials: 'JD',
    avatarBg: 'bg-primary-fixed',
    name: 'John Doe',
    stage: '전공 적합성 분석',
    stageBg: 'bg-blue-100 text-blue-700',
    loginIcon: 'login',
    loginColor: 'text-secondary',
    loginTime: '방금 전 로그인',
    loginBold: true,
    elapsed: '2분 경과',
  },
  {
    initials: 'MK',
    avatarBg: 'bg-secondary-fixed',
    name: 'Min-su Kim',
    stage: '커리어 로드맵',
    stageBg: 'bg-orange-100 text-orange-700',
    loginIcon: 'history',
    loginColor: 'text-on-primary-container',
    loginTime: '2분 전 로그인',
    loginBold: false,
    elapsed: '8분 경과',
  },
  {
    initials: 'SY',
    avatarBg: 'bg-tertiary-fixed',
    name: 'Seo-yeon Lee',
    stage: '역량 진단',
    stageBg: 'bg-blue-100 text-blue-700',
    loginIcon: 'history',
    loginColor: 'text-on-primary-container',
    loginTime: '5분 전 로그인',
    loginBold: false,
    elapsed: '12분 경과',
  },
];

const RANKINGS = [
  { name: '컴퓨터공학부', count: '2,140', pct: 92 },
  { name: '경영학부', count: '1,850', pct: 78 },
  { name: '심리학과', count: '1,420', pct: 65 },
  { name: '데이터사이언스', count: '1,100', pct: 50 },
];

const CHART_BARS = [
  { color: 'bg-surface-container-high', h: 'h-4' },
  { color: 'bg-surface-container-high', h: 'h-6' },
  { color: 'bg-secondary-container', h: 'h-10' },
  { color: 'bg-secondary', h: 'h-16' },
  { color: 'bg-secondary-container', h: 'h-10' },
  { color: 'bg-tertiary-fixed-dim', h: 'h-16' },
  { color: 'bg-surface-container-high', h: 'h-6' },
  { color: 'bg-surface-container-high', h: 'h-4' },
];

const AdminDashboard = () => (
  <div className="px-4 sm:px-8 lg:px-10 pt-6 sm:pt-8 lg:pt-10">
    {/* 헤더 */}
    <div className="mb-8 sm:mb-12 flex flex-wrap justify-between items-end gap-3">
      <div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-primary font-headline tracking-tight mb-2">
          Admin Dashboard
        </h2>
        <p className="text-on-primary-container text-base sm:text-xl max-w-2xl">
          진로온 AI 핵심 성과 데이터 및 실시간 분석 현황입니다.
        </p>
      </div>
      <div className="flex items-center gap-2 bg-secondary-container/10 px-4 py-2 rounded-full border border-secondary-container/20 animate-pulse">
        <span className="w-2 h-2 rounded-full bg-secondary shrink-0" />
        <span className="text-secondary text-xs sm:text-sm font-bold">AI Prediction Active</span>
      </div>
    </div>

    {/* 통계 카드 */}
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-14">
      <StatCard
        label="전체 전공 수"
        value="148"
        badge="+4개"
        icon="school"
        footer={
          <div className="mt-4 h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
            <div className="h-full bg-secondary w-3/4" />
          </div>
        }
      />
      <StatCard
        label="전체 사용자"
        value="12,842"
        badge="+12%"
        icon="group"
        footer={
          <div className="mt-4 flex gap-1.5">
            <div className="h-2 w-full bg-surface-container-high rounded-full" />
            <div className="h-2 w-full bg-surface-container-high rounded-full" />
            <div className="h-2 w-full bg-secondary-container rounded-full" />
          </div>
        }
      />

      {/* 오늘의 분석 (lg에서 2칸) */}
      <div className="col-span-2 md:col-span-1 lg:col-span-2 bg-surface-container-lowest cloud-shadow rounded-2xl p-5 sm:p-8 hover:-translate-y-1 transition-all duration-300">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-on-primary-container text-xs sm:text-sm font-bold uppercase tracking-wider mb-2">오늘의 분석</p>
            <span className="text-4xl sm:text-5xl font-extrabold font-headline text-primary">324</span>
          </div>
          <div className="bg-tertiary-fixed-dim/20 px-3 py-1 rounded-lg shrink-0">
            <span className="text-on-tertiary-fixed-variant text-xs sm:text-sm font-bold">실시간 피크</span>
          </div>
        </div>
        <div className="mt-6 flex items-end gap-1 sm:gap-1.5 h-12 sm:h-16">
          {CHART_BARS.map(({ color, h }, i) => (
            <div key={i} className={`flex-1 ${color} ${h} rounded-t-sm`} />
          ))}
        </div>
      </div>
    </div>

    {/* 하단 섹션 */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
      {/* 실시간 사용자 활동 테이블 */}
      <div className="lg:col-span-2 bg-surface-container-lowest cloud-shadow rounded-2xl overflow-hidden">
        <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-surface-container-high">
          <h3 className="text-xl sm:text-2xl font-bold font-headline text-primary">실시간 사용자 분석 활동</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[380px]">
            <thead>
              <tr className="bg-surface-container-low text-on-primary-container text-xs sm:text-sm uppercase tracking-wide">
                <th className="px-5 sm:px-8 py-4 font-semibold">사용자</th>
                <th className="px-5 sm:px-8 py-4 font-semibold">진행 단계</th>
                <th className="hidden sm:table-cell px-5 sm:px-8 py-4 font-semibold">마지막 로그인</th>
                <th className="px-5 sm:px-8 py-4 font-semibold">경과</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high">
              {ACTIVITIES.map((row) => (
                <tr key={row.initials} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="px-5 sm:px-8 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full ${row.avatarBg} flex items-center justify-center text-xs font-bold shrink-0`}>
                        {row.initials}
                      </div>
                      <span className="text-sm sm:text-base font-semibold">{row.name}</span>
                    </div>
                  </td>
                  <td className="px-5 sm:px-8 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${row.stageBg}`}>
                      {row.stage}
                    </span>
                  </td>
                  <td className="hidden sm:table-cell px-5 sm:px-8 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`material-symbols-outlined text-base ${row.loginColor}`}>{row.loginIcon}</span>
                      <span className={`text-sm ${row.loginBold ? `font-semibold ${row.loginColor}` : 'text-on-primary-container'}`}>
                        {row.loginTime}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 sm:px-8 py-4 text-on-primary-container text-sm whitespace-nowrap">{row.elapsed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 인기 전공 랭킹 */}
      <div className="bg-primary-container cloud-shadow rounded-2xl p-6 sm:p-8 text-white flex flex-col">
        <h3 className="text-xl sm:text-2xl font-bold font-headline mb-6 sm:mb-8 text-blue-400">인기 전공 랭킹</h3>
        <div className="space-y-5 sm:space-y-7 flex-1">
          {RANKINGS.map(({ name, count, pct }, i) => (
            <div key={name} className="flex items-center gap-3 sm:gap-4 group">
              <span className={`text-xl sm:text-2xl font-black w-6 sm:w-7 shrink-0 ${i === 0 ? 'text-tertiary-fixed-dim' : 'text-blue-200/50'}`}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between mb-2">
                  <span className="font-bold text-sm sm:text-base truncate">{name}</span>
                  <span className="text-xs sm:text-sm text-blue-300 shrink-0 ml-2">{count}</span>
                </div>
                <div className="h-2 sm:h-2.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-secondary-container group-hover:bg-tertiary-fixed-dim transition-colors"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default AdminDashboard;
