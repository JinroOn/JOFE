import RadarChart from './components/RadarChart';

const CURRENT_SCORES = [0.28, 0.55, 0.60, 0.62, 0.42, 0.58, 0.70, 0.72, 0.65];
const TARGET_SCORES  = [0.85, 0.82, 0.78, 0.80, 0.80, 0.90, 0.80, 0.85, 0.80];

const WEAK_ITEMS = [
  {
    rank: 1,
    area: '수리·논리력',
    sub: '알고리즘 / 자료구조',
    grade: 'D-',
    current: 28,
    target: 85,
    color: 'text-error',
    barColor: 'bg-error',
    border: 'border-error/20',
    badge: 'bg-error/10 text-error',
  },
  {
    rank: 2,
    area: '시스템 프로그래밍',
    sub: '운영체제 / 컴퓨터구조',
    grade: 'D+',
    current: 42,
    target: 80,
    color: 'text-[#FF6B35]',
    barColor: 'bg-[#FF6B35]',
    border: 'border-[#FF6B35]/20',
    badge: 'bg-[#FF6B35]/10 text-[#FF6B35]',
  },
  {
    rank: 3,
    area: '데이터 분석 활용',
    sub: '통계 / 데이터 시각화',
    grade: 'C-',
    current: 58,
    target: 90,
    color: 'text-[#FFAB00]',
    barColor: 'bg-[#FFAB00]',
    border: 'border-[#FFAB00]/20',
    badge: 'bg-[#FFAB00]/10 text-[#FFAB00]',
  },
];

const ROADMAP_WEEKS = [
  { week: 1,  label: '알고리즘 기초',        status: 'done'    },
  { week: 2,  label: '시간복잡도 분석',       status: 'done'    },
  { week: 3,  label: '정렬 & 탐색',          status: 'done'    },
  { week: 4,  label: '트리 & 그래프',         status: 'current' },
  { week: 5,  label: '동적 프로그래밍',       status: 'locked'  },
  { week: 6,  label: 'OS 기초',              status: 'locked'  },
  { week: 7,  label: '프로세스 & 스레드',     status: 'locked'  },
  { week: 8,  label: '메모리 관리',           status: 'locked'  },
  { week: 9,  label: '통계 기초',            status: 'locked'  },
  { week: 10, label: '데이터 시각화',         status: 'locked'  },
  { week: 11, label: 'Pandas 실습',          status: 'locked'  },
  { week: 12, label: '종합 프로젝트',         status: 'locked'  },
];

const VIDEOS = [
  { title: '알고리즘 마스터 클래스', channel: 'CS Academy', duration: '2h 30m' },
  { title: '자료구조 완전 정복', channel: 'Dev School', duration: '1h 45m' },
  { title: 'OS 핵심 개념 총정리', channel: 'System Lab', duration: '3h 00m' },
  { title: 'Python 데이터 분석', channel: 'Data Camp', duration: '2h 15m' },
];

const statusStyle: Record<string, string> = {
  done:    'bg-secondary-container/20 border-secondary-container/40 text-secondary',
  current: 'bg-primary-container text-white border-primary-container shadow-lg',
  locked:  'bg-surface-container border-outline-variant/20 text-on-surface-variant/50',
};

const statusIcon: Record<string, string> = {
  done:    'check_circle',
  current: 'radio_button_checked',
  locked:  'lock',
};

const WeakCapability = () => {
  return (
    <div className="min-h-screen bg-surface pb-20">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 pt-8 sm:pt-12 space-y-10">

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-secondary bg-secondary/10 px-3 py-1 rounded-full mb-3">
              <span className="material-symbols-outlined text-[14px]">analytics</span>
              AI 역량 심층 분석
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-primary-container tracking-tight leading-tight">
              취약 역량 심층 분석
            </h1>
            <p className="text-on-surface-variant mt-2 text-sm sm:text-base">
              목표하신 <span className="font-semibold text-secondary-container">'컴퓨터공학'</span> 전공 대비 보완이 필요한 상위 3가지 역량을 AI가 분석했습니다.<br className="hidden sm:block" />
              주차별 학습 계획을 통해 역량 갭을 메워보세요.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-on-surface-variant shrink-0">
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            마지막 분석: 2025.05.20
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
              TOP 3 취약 역량
            </h2>
            {WEAK_ITEMS.map((item) => (
              <div
                key={item.rank}
                className={`bg-white rounded-2xl p-5 sm:p-6 border ${item.border} shadow-sm`}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <span className={`text-3xl font-black ${item.color} leading-none`}>
                      #{item.rank}
                    </span>
                    <div>
                      <p className="font-extrabold text-base text-primary-container">{item.area}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">{item.sub}</p>
                    </div>
                  </div>
                  <span className={`text-xl font-black px-3 py-1 rounded-xl ${item.badge}`}>
                    {item.grade}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-on-surface-variant">
                    <span>현재 역량</span>
                    <span className={item.color}>{item.current}%</span>
                  </div>
                  <div className="relative w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                    <div
                      className={`absolute left-0 top-0 h-full ${item.barColor} rounded-full transition-all duration-700`}
                      style={{ width: `${item.current}%` }}
                    />
                    <div
                      className="absolute top-0 h-full w-0.5 bg-secondary-container/70"
                      style={{ left: `${item.target}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                    <span>목표까지 <span className="font-bold text-on-surface">+{item.target - item.current}%</span> 필요</span>
                    <span>목표: {item.target}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-5 flex flex-col gap-5">
            <div className="bg-surface-container-low rounded-2xl p-5 sm:p-6 flex-1">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">
                역량 레이더 분석
              </p>
              <div className="flex justify-center items-center gap-4 mb-4 text-[11px]">
                <span className="flex items-center gap-1.5 text-on-surface-variant">
                  <span className="w-5 h-0.5 border-t-2 border-dashed border-secondary-container inline-block" />
                  목표 역량
                </span>
                <span className="flex items-center gap-1.5 text-on-surface-variant">
                  <span className="w-5 h-0.5 bg-error inline-block rounded-full" />
                  현재 역량
                </span>
              </div>
              <div className="aspect-square max-w-[260px] mx-auto">
                <RadarChart currentScores={CURRENT_SCORES} targetScores={TARGET_SCORES} />
              </div>
            </div>

            <div className="bg-primary-container/5 border border-primary-container/10 rounded-2xl p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-secondary text-[20px]">auto_awesome</span>
                <span className="text-sm font-bold text-primary-container">AI 학습 인사이트</span>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                수리·논리력이 목표 대비 <span className="font-bold text-error">57%p</span> 부족합니다.
                알고리즘 기초 학습을 우선 집중하고, 시스템 프로그래밍은 OS 개념과 병행 학습을 권장합니다.
              </p>
              <div className="mt-4 pt-4 border-t border-primary-container/10 flex items-center justify-between text-xs text-on-surface-variant">
                <span>예상 개선 기간</span>
                <span className="font-bold text-secondary">약 12주</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-extrabold text-xl text-primary-container">12주 학습 로드맵</h2>
            <span className="text-xs text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
              진행률 <span className="font-bold text-secondary">25%</span>
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ROADMAP_WEEKS.map((w) => (
              <div
                key={w.week}
                className={`rounded-xl border px-4 py-3.5 flex items-start gap-3 ${statusStyle[w.status]}`}
              >
                <span className="material-symbols-outlined text-[18px] mt-0.5 shrink-0">
                  {statusIcon[w.status]}
                </span>
                <div>
                  <p className="text-[11px] font-bold opacity-60">WEEK {w.week}</p>
                  <p className="text-sm font-semibold mt-0.5 leading-snug">{w.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-extrabold text-xl text-primary-container mb-5">추천 학습 콘텐츠</h2>
          <div className="flex gap-4 overflow-x-auto pb-3 [&::-webkit-scrollbar]:hidden">
            {VIDEOS.map((v, i) => (
              <div
                key={i}
                className="shrink-0 w-48 sm:w-56 bg-white rounded-2xl border border-outline-variant/10 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer overflow-hidden"
              >
                <div className="h-32 bg-gradient-to-br from-primary-container/80 to-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-[48px]">play_circle</span>
                </div>
                <div className="p-4">
                  <p className="font-bold text-sm text-primary-container leading-snug line-clamp-2">{v.title}</p>
                  <div className="flex items-center justify-between mt-2 text-[11px] text-on-surface-variant">
                    <span>{v.channel}</span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">schedule</span>
                      {v.duration}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default WeakCapability;
