import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createDiagnosisResult, createResultMajorScore } from '../../../api/results';
import { getMajors } from '../../../api/major';
import { createPlan } from '../../../api/plan';
import { updateSession } from '../../../api/diagnosis';
import type { CompetencyResult } from '../../../types/diagnosis';
import type { Major } from '../../../types/major';
import logo from '../../../assets/logo-auth.svg';

const TICKER_LINES = [
  'INITIATING SYMBOLIC REGRESSION...',
  'MAPPING ACADEMIC TRAJECTORY...',
  'OPTIMIZING NEURAL WEIGHTS...',
  'DECODING LEARNING PATTERNS...',
  'CROSS-REFERENCING ADMISSION DATA...',
  'CALIBRATING PREDICTIVE MODELS...',
];

function computeCompetencyScore(cr: CompetencyResult, major: Major): number {
  const pairs: [number, number | null][] = [
    [cr.mathLogic,           major.reqMathLogic],
    [cr.problemSolving,      major.reqProblemSolving],
    [cr.infoTech,            major.reqInfoTech],
    [cr.implementation,      major.reqImplementation],
    [cr.systemUnderstanding, major.reqSystemUnderstanding],
    [cr.dataAnalysis,        major.reqDataAnalysis],
    [cr.communication,       major.reqCommunication],
    [cr.collaboration,       major.reqCollaboration],
    [cr.selfManagement,      major.reqSelfManagement],
  ];
  const axisScores = pairs.map(([userScore, req]) => {
    const reqScore = req ?? 0;
    if (reqScore === 0) return 100;
    return Math.min((userScore / reqScore) * 100, 100);
  });
  return Math.round(axisScores.reduce((a, b) => a + b, 0) / axisScores.length);
}

function checkFailed(cr: CompetencyResult, major: Major): boolean {
  return (
    (major.thrMathLogic != null && major.thrMathLogic > 0 && cr.mathLogic < major.thrMathLogic) ||
    (major.thrInfoTech != null && major.thrInfoTech > 0 && cr.infoTech < major.thrInfoTech)
  );
}

const DiagnosisLoading = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const state = location.state as {
      sessionId?: number;
      competencyResult?: CompetencyResult;
    } | null;

    const process = async () => {
      const { sessionId, competencyResult } = state ?? {};
      if (!sessionId) return;

      // 1. 세션 완료 처리
      await updateSession(sessionId, {
        status: 'completed',
        completedAt: new Date().toISOString(),
      }).catch((e) => console.warn('[Loading] updateSession 실패:', e));

      // 2. 진단 결과 생성
      // tendencyVector: DB nullable=false 제약으로 반드시 전달 필요 (성향 평가 미구현으로 0값 플레이스홀더)
      const diagnosisResult = await createDiagnosisResult({
        diagnosisSessionId: sessionId,
        competencyVector: competencyResult
          ? JSON.stringify(competencyResult)
          : JSON.stringify({ mathLogic: 0, problemSolving: 0, infoTech: 0, implementation: 0, systemUnderstanding: 0, dataAnalysis: 0, communication: 0, collaboration: 0, selfManagement: 0 }),
        tendencyVector: JSON.stringify({ tendLogicalInquiry: 0, tendPracticalTech: 0, tendArtCreative: 0, tendSocialCooperation: 0, tendLifeHealth: 0, tendEducationGuide: 0, tendTheoryAcademic: 0, tendDataAnalytics: 0, tendSystemOperation: 0 }),
      });

      // 3. 전공 목록 조회 + 역량 적합도 계산
      const majors = await getMajors();

      const scoreData = majors
        .map((major) => ({
          major,
          competencyScore: competencyResult ? computeCompetencyScore(competencyResult, major) : 50,
          tendencyScore: 50,
          failed: competencyResult ? checkFailed(competencyResult, major) : false,
        }))
        .map((item) => ({
          ...item,
          finalScore: Math.round(item.competencyScore * 0.6 + item.tendencyScore * 0.4),
        }))
        .sort((a, b) => b.finalScore - a.finalScore);

      // 4. 전공별 점수 등록 (병렬)
      const scoreResponses = await Promise.allSettled(
        scoreData.map((item, idx) =>
          createResultMajorScore({
            diagnosisResultId: diagnosisResult.id,
            majorId: item.major.id,
            competencyScore: item.competencyScore,
            tendencyScore: item.tendencyScore,
            finalScore: item.finalScore,
            rank: idx + 1,
            failed: item.failed,
          }),
        ),
      );

      // 5. 상위 전공(과락 제외)으로 플랜 생성 → AI 서버가 주간 계획 자동 생성
      const candidates = scoreResponses
        .map((r, i) =>
          r.status === 'fulfilled' ? { score: r.value, item: scoreData[i] } : null,
        )
        .filter((x): x is NonNullable<typeof x> => x !== null);

      const target = candidates.find((x) => !x.item.failed) ?? candidates[0];
      if (target) {
        await createPlan({
          diagnosisResultId: diagnosisResult.id,
          resultMajorScoreId: target.score.id,
          activeVersion: true,
        }).catch(() => {});
      }
    };

    // API 처리와 최소 표시 시간(4초)을 병렬 실행
    Promise.all([
      process().catch((e) => console.error('[Loading] 진단 결과 생성 실패:', e)),
      new Promise<void>((resolve) => setTimeout(resolve, 4000)),
    ]).then(() => {
      navigate('/analysis/dashboard', { replace: true });
    });
  }, [navigate, location.state]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface">
      {/* 배경 */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="neural-grid absolute inset-0" />
        <div
          className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]"
          style={{
            background:
              'radial-gradient(circle, rgba(0,210,255,0.1) 0%, rgba(58,123,213,0.05) 100%)',
          }}
        />
      </div>

      <main className="relative z-10 flex min-h-screen flex-col items-center justify-between px-6 py-12">
        {/* 로고 */}
        <div className="flex flex-col items-center space-y-4">
          <img src={logo} alt="JinroOn" className="h-14 w-auto translate-x-6 opacity-90" />
          <div className="h-px w-12 bg-gradient-to-r from-transparent via-secondary-container/50 to-transparent" />
        </div>

        {/* 중앙 AI 시각화 */}
        <div className="flex w-full max-w-2xl flex-1 flex-col items-center justify-center">
          <div className="relative mb-12 flex h-48 w-48 sm:h-64 sm:w-64 md:h-72 md:w-72 items-center justify-center">
            <div className="ring-spin absolute inset-0 rounded-full border-[0.5px] border-secondary-container/20">
              <div className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-secondary-container shadow-[0_0_8px_rgba(0,210,255,0.5)]" />
            </div>
            <div className="ring-spin-reverse absolute inset-4 rounded-full border-[0.5px] border-dashed border-secondary-container/10" />
            <div className="absolute inset-8 animate-pulse rounded-full border-[0.5px] border-secondary-container/20" />

            <div
              className="orb-glow relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-full"
              style={{ background: 'linear-gradient(135deg, #00d2ff, #3a7bd5)' }}
            >
              <div className="scanner-line" />
              <span
                className="material-symbols-outlined animate-pulse text-5xl text-white"
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 200" }}
              >
                power_settings_new
              </span>
              <div
                className="pointer-events-none absolute inset-0 opacity-20"
                style={{
                  background:
                    'repeating-linear-gradient(transparent, transparent 2px, rgba(255,255,255,0.2) 2px, rgba(255,255,255,0.2) 4px)',
                }}
              />
            </div>

            <div className="absolute left-0 top-0 h-2 w-2 animate-ping rounded-full bg-secondary-container/40" />
          </div>

          <div className="z-20 space-y-8 text-center">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-secondary-container/20 bg-secondary-container/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-secondary-container" />
                Neural Engine Active
              </div>
              <h2 className="glimmer-text font-headline text-4xl font-bold tracking-tight">
                학습 성향 분석 중...
              </h2>
              <p className="text-sm font-medium tracking-wide text-slate-600">
                수만 개의 데이터 포인트를 기반으로 최적의 경로를 설계합니다
              </p>
            </div>

            <div className="flex justify-center gap-6">
              <CircleStat value={89} label="Vector Match" color="#0a192f" dashOffset={18} />
              <CircleStat value={98} label="Confidence" color="#00d2ff" dashOffset={3.5} />
            </div>
          </div>
        </div>

        {/* 하단 티커 */}
        <div className="mt-8 w-full max-w-lg">
          <div className="h-12 overflow-hidden border-b border-t border-slate-200 py-2">
            <div className="ticker-scroll flex flex-col items-center gap-1">
              {[...TICKER_LINES, ...TICKER_LINES].map((line, i) => (
                <span key={i} className="font-mono text-[10px] text-slate-400">
                  {line}
                </span>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* 왼쪽 플로팅 카드 */}
      <div className="fixed left-12 top-24 hidden w-64 animate-pulse rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm backdrop-blur-md xl:block">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-1.5 w-1.5 rounded-full bg-secondary-container" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
            Real-time Stream
          </span>
        </div>
        <div className="space-y-3">
          <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-[85%] bg-secondary-container" />
          </div>
          <div className="h-1 w-2/3 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-[45%] bg-secondary-container" />
          </div>
        </div>
      </div>

      {/* 오른쪽 플로팅 카드 */}
      <div className="fixed bottom-24 right-12 hidden w-72 rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm backdrop-blur-md xl:block">
        <div className="mb-4 flex items-start justify-between">
          <span className="font-headline text-xs font-bold tracking-wide text-[#0a192f]">
            AI Roadmap v2.0
          </span>
          <span className="material-symbols-outlined text-sm text-secondary-container">
            auto_awesome
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
            <span className="material-symbols-outlined text-lg text-secondary-container">hub</span>
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-1.5 w-full rounded-full bg-slate-100" />
            <div className="h-1.5 w-1/2 rounded-full bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  );
};

interface CircleStatProps {
  value: number;
  label: string;
  color: string;
  dashOffset: number;
}

const CircleStat = ({ value, label, color, dashOffset }: CircleStatProps) => (
  <div className="flex w-28 flex-col items-center gap-3">
    <div className="relative flex h-16 w-16 items-center justify-center">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="28" fill="transparent" stroke="#f1f5f9" strokeWidth="3" />
        <circle
          cx="32"
          cy="32"
          r="28"
          fill="transparent"
          stroke={color}
          strokeWidth="3"
          strokeDasharray="175.9"
          strokeDashoffset={dashOffset}
          className="transition-all duration-1000"
        />
      </svg>
      <span className="absolute text-xs font-bold" style={{ color }}>
        {value}%
      </span>
    </div>
    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
  </div>
);

export default DiagnosisLoading;
