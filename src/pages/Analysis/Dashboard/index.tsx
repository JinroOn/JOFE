import type { RecommendedMajor, CapabilityRow } from './types';
import DashboardRadarChart from './components/DashboardRadarChart';
import AiCommentBanner from './components/AiCommentBanner';
import RecommendedMajors from './components/RecommendedMajors';
import CapabilityBarChart from './components/CapabilityBarChart';
import ShareSection from './components/ShareSection';

const AXES = ['수리·논리', '문제해결', '정보기술', '구현력', '시스템이해', '데이터분석', '의사소통', '협업·윤리', '자기관리'];

const USER_SCORES = [8.8, 8.2, 8.6, 7.4, 7.9, 9.1, 7.2, 8.4, 6.0];

const CS_REQUIRED = [8.0, 7.0, 8.0, 9.0, 9.0, 7.0, 6.0, 7.0, 7.0];

const RECOMMENDED_MAJORS: RecommendedMajor[] = [
  { rank: 1, name: '컴퓨터공학부', suitability: 98, description: '복잡한 논리 구조 설계와 데이터 기반 의사결정 역량이 최상위권입니다.' },
  { rank: 2, name: '데이터사이언스', suitability: 94, description: '수치 데이터 해석 및 통계적 추론 능력이 매우 뛰어납니다.' },
  { rank: 3, name: '산업공학과', suitability: 89, description: '시스템 효율화 및 공정 설계에 적합한 전략적 사고를 보유하고 있습니다.' },
  { rank: 4, name: '통계학과', suitability: 85, description: '불확실성 속에서 패턴을 찾아내는 감각이 탁월합니다.' },
  { rank: 5, name: 'AI로보틱스', suitability: 82, description: '물리적 메커니즘과 소프트웨어 융합 이해도가 높습니다.' },
];

const CAPABILITY_ROWS: CapabilityRow[] = AXES.map((axis, i) => ({
  axis,
  userScore: Math.round(USER_SCORES[i] * 10),
  majorAvg: Math.round(CS_REQUIRED[i] * 10),
}));

const Dashboard = () => (
  <div className="min-h-screen bg-surface pb-24">
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-12">

      <header className="mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container/20 text-secondary font-bold text-xs mb-4">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              AI 인공지능 분석 완료
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-primary-container tracking-tight mb-4 leading-tight">
              홍길동님의 <span className="text-secondary">진로 역량 리포트</span>
            </h1>
            <p className="text-on-surface-variant max-w-2xl text-base sm:text-lg leading-relaxed">
              JinroOn AI가 9가지 핵심 역량 지표를 바탕으로 가장 적합한 전공과 진로 방향을 도출했습니다.<br />
              본 데이터는 약 24만 개의 학부 졸업생 경로 데이터를 기반으로 생성되었습니다.
            </p>
          </div>
          <div className="shrink-0">
            <button className="flex items-center gap-2 px-6 py-4 rounded-[14px] bg-[#FFAB00] text-primary-container font-bold shadow-lg shadow-[#FFAB00]/20 hover:-translate-y-0.5 transition-all">
              <span className="material-symbols-outlined">download</span>
              리포트 다운로드 (PDF)
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

        <section className="md:col-span-5 bg-surface-container-lowest rounded-[14px] p-6 sm:p-8 shadow-[0px_20px_40px_rgba(10,25,47,0.06)] flex flex-col items-center">
          <h3 className="w-full text-lg sm:text-xl font-bold mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">analytics</span>
            9-Axis 역량 다이어그램
          </h3>
          <div className="w-full max-w-[480px] aspect-square">
            <DashboardRadarChart scores={USER_SCORES.map((s) => s / 10)} labels={AXES} />
          </div>
          <div className="mt-6 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#00D2FF] shrink-0" />
            <span className="text-xs font-bold text-on-surface-variant">현재 역량 점수</span>
          </div>
        </section>

        <div className="md:col-span-7 space-y-6">
          <AiCommentBanner />
          <RecommendedMajors majors={RECOMMENDED_MAJORS} />
        </div>

        <CapabilityBarChart rows={CAPABILITY_ROWS} className="md:col-span-12" />

      </div>

      <ShareSection />

      <footer className="mt-8 flex flex-wrap justify-center gap-4">
        <button className="flex items-center gap-2 px-6 py-4 bg-primary-container text-white rounded-[14px] font-bold hover:shadow-lg transition-shadow">
          <span className="material-symbols-outlined">picture_as_pdf</span>
          리포트 저장 (PDF)
        </button>
        <button className="flex items-center gap-2 px-6 py-4 bg-surface-container-lowest border border-outline-variant/20 text-on-surface rounded-[14px] font-bold hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined">image</span>
          이미지 저장
        </button>
        <button className="flex items-center gap-2 px-6 py-4 bg-surface-container-lowest border border-outline-variant/20 text-on-surface rounded-[14px] font-bold hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined">print</span>
          인쇄
        </button>
      </footer>

    </div>
  </div>
);

export default Dashboard;
