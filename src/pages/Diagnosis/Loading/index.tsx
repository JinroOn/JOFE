import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { completeDiagnosisResult } from '../../../api/results';
import logo from '../../../assets/logo-auth.svg';

const ANALYSIS_STEPS = [
  { label: '성향 분석', flow: '성향 분석', message: '학습 성향을 분석하고 있습니다' },
  { label: '공통 역량', flow: '공통 역량', message: '공통 역량을 분석하고 있습니다' },
  { label: '맞춤 비교', flow: '맞춤 진단 비교', message: '맞춤 진단 결과를 비교하고 있습니다' },
  { label: '전공군 차이', flow: '후보 전공군 차이', message: '후보 전공군의 차이를 살펴보고 있습니다' },
  { label: '요구 특성', flow: '특성 비교', message: '전공별 요구 특성을 비교하고 있습니다' },
  { label: '추천 이유', flow: '추천 이유', message: '추천 이유를 정리하고 있습니다' },
];

// 최소 표시 시간(4초) 동안 진행률을 채우고, 결과 생성이 끝나기 전에는 95%에서 멈춤
const MIN_DURATION_MS = 4000;
const TICK_MS = 100;
const MAX_PENDING_PROGRESS = 95;

const DiagnosisLoading = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const processed = useRef(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const step = (MAX_PENDING_PROGRESS / MIN_DURATION_MS) * TICK_MS;
    const timer = setInterval(() => {
      setProgress((p) => Math.min(MAX_PENDING_PROGRESS, p + step));
    }, TICK_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const state = location.state as {
      sessionId?: number;
    } | null;

    const process = async () => {
      const { sessionId } = state ?? {};
      if (!sessionId) return;

      await completeDiagnosisResult(sessionId);
    };
    // API 처리와 최소 표시 시간(4초)을 병렬 실행
    Promise.allSettled([
      process(),
      new Promise<void>((resolve) => setTimeout(resolve, MIN_DURATION_MS)),
    ]).then(([result]) => {
      if (result.status === 'rejected') {
        console.error('[Loading] diagnosis result completion failed:', result.reason);
        return;
      }
      setProgress(100);
      navigate('/analysis/dashboard', { replace: true });
    });
  }, [navigate, location.state]);

  const percent = Math.round(progress);
  const currentStep = Math.min(ANALYSIS_STEPS.length - 1, Math.floor((progress / 100) * ANALYSIS_STEPS.length));
  const current = ANALYSIS_STEPS[currentStep];

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface">
      {/* 배경 */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="neural-grid absolute inset-0" />
        <div
          className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[50px]"
          style={{
            background:
              'radial-gradient(circle, rgba(0,210,255,0.1) 0%, rgba(58,123,213,0.05) 100%)',
          }}
        />
      </div>

      <main className="relative z-10 flex min-h-screen flex-col items-center justify-between px-6 py-12">
        {/* 로고 */}
        <div className="flex flex-col items-center space-y-4">
          <img src={logo} alt="JinroOn" className="h-10 w-auto translate-x-4 opacity-90" />
          <div className="h-px w-12 bg-gradient-to-r from-transparent via-secondary-container/50 to-transparent" />
        </div>

        {/* 중앙 AI 시각화 */}
        <div className="flex w-full max-w-2xl flex-1 flex-col items-center justify-center py-10">
          <div className="relative mb-12 flex h-48 w-48 sm:h-64 sm:w-64 md:h-72 md:w-72 items-center justify-center">
            <div className="ring-spin absolute inset-0 rounded-full border border-secondary-container/20">
              <div className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-secondary-container shadow-[0_0_8px_rgba(0,210,255,0.5)]" />
            </div>
            <div className="ring-spin-reverse absolute inset-4 rounded-full border border-dashed border-secondary-container/10" />
            <div className="absolute inset-8 animate-pulse rounded-full border border-secondary-container/20" />

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
            <div className="absolute bottom-10 right-4 h-1 w-1 rounded-full bg-white/40" />
          </div>

          <div className="z-20 flex w-full flex-col items-center gap-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-secondary-container/20 bg-secondary-container/10 px-[15px] py-[7px] text-xs font-bold tracking-[0.3px] text-secondary-container">
                <span className="h-2 w-2 animate-pulse rounded-full bg-secondary-container" />
                {currentStep + 1}단계 · {current.message}
              </div>
              <h2 className="break-keep text-2xl sm:text-4xl font-bold tracking-[-0.9px] text-[#0a192f]">
                {current.message}
              </h2>
              <p className="break-keep text-sm font-medium tracking-[0.35px] text-slate-500">
                수만 건의 학과·진로 데이터를 기반으로 최적의 맞춤 경로를 도출합니다
              </p>
            </div>

            <div className="flex w-full max-w-[448px] flex-col gap-3">
              <div className="flex items-center justify-between px-1 text-xs">
                <span className="font-medium text-slate-500">분석 진행률</span>
                <span className="font-headline font-bold text-secondary-container">{percent}%</span>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full border border-slate-200/60 bg-slate-100">
                <div
                  className="absolute inset-y-[2px] left-[2px] rounded-full bg-gradient-to-r from-secondary-container to-[#3a7bd5] transition-all duration-200"
                  style={{ width: `calc(${percent}% - 4px)` }}
                />
              </div>
              <p className="text-xs font-medium text-slate-400">잠시만 기다려주세요, 최적의 추천 경로를 도출 중입니다</p>
            </div>

            <div className="grid w-full max-w-[512px] grid-cols-3 sm:grid-cols-6 gap-2 pt-2">
              {ANALYSIS_STEPS.map((s, i) => {
                const done = i < currentStep;
                const active = i === currentStep;
                return (
                  <div key={s.label} className="flex flex-col items-center gap-1.5">
                    <div
                      className={`h-1.5 w-full rounded-full ${
                        active
                          ? 'bg-secondary-container shadow-[0_0_8px_rgba(0,210,255,0.8)]'
                          : done
                          ? 'bg-secondary-container'
                          : 'bg-slate-200'
                      }`}
                    />
                    <span
                      className={`text-[11px] leading-[16.5px] ${
                        active ? 'font-bold text-secondary' : done ? 'font-bold text-slate-700' : 'font-medium text-slate-400'
                      }`}
                    >
                      {i + 1}. {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 하단 분석 흐름 */}
        <div className="mt-8 flex w-full max-w-[512px] flex-col items-center gap-4">
          <div className="flex w-full items-center justify-center gap-2 border-y border-slate-200 py-[13px]">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-secondary-container" />
            <p className="break-keep text-xs font-medium text-slate-600">
              {ANALYSIS_STEPS.map((s, i) => (
                <span key={s.flow}>
                  {i > 0 && ' → '}
                  <span className={i === currentStep ? 'font-semibold text-secondary' : ''}>{s.flow}</span>
                </span>
              ))}
            </p>
          </div>
          <p className="max-w-[384px] break-keep text-center text-xs leading-[19.5px] text-slate-400">
            진로온 AI가 학생의 검사 결과와 교육과정 데이터를 다각도로 분석하여 최적화된 맞춤 전공 경로를 설계하고 있습니다.
          </p>
        </div>
      </main>

      {/* 왼쪽 플로팅 카드 */}
      <div className="fixed left-12 top-24 hidden w-64 rounded-2xl border border-slate-200 bg-white/70 p-[21px] shadow-sm backdrop-blur-md xl:block">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-1.5 w-1.5 rounded-full bg-secondary-container" />
          <span className="text-[10px] font-bold uppercase tracking-[0.5px] text-secondary-container">
            Real-time Stream
          </span>
        </div>
        <div className="space-y-3">
          <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-[85%] bg-secondary-container" />
          </div>
          <div className="h-1 w-[142px] overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-[45%] bg-secondary-container" />
          </div>
        </div>
      </div>

      {/* 오른쪽 플로팅 카드 */}
      <div className="fixed bottom-24 right-12 hidden w-72 rounded-2xl border border-slate-200 bg-white/70 p-[21px] shadow-sm backdrop-blur-md xl:block">
        <div className="mb-3 flex items-start justify-between">
          <span className="text-xs font-bold tracking-[0.3px] text-[#0a192f]">결과를 준비하고 있어요</span>
          <span className="material-symbols-outlined text-sm text-secondary-container">auto_awesome</span>
        </div>
        <div className="flex items-center gap-[14px]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
            <span className="material-symbols-outlined text-lg text-secondary-container">monitoring</span>
          </div>
          <p className="text-[11px] font-medium leading-[15px] text-slate-600">
            분석 완료 후 맞춤형 결과 리포트로 바로 연결됩니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisLoading;
