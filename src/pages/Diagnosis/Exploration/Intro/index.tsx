import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listExplorationSessions } from '../../../../api/exploration';
import { getInProgressSession } from '../../../../api/diagnosis';
import { isExplorationMock } from '../../../../config/features';
import useExplorationStore from '../../../../store/useExplorationStore';
import type { ExplorationSessionSummary } from '../../../../types/exploration';
import type { DiagnosisSession } from '../../../../types/diagnosis';
import MockBanner from '../components/MockBanner';

const STEPS = [
  { no: '01', title: '공통 탐색', desc: '관심 있는 분야와 해본 활동을 확인해요' },
  { no: '02', title: '맞춤 탐색', desc: '필요할 때만 공부·활동 방식을 더 비교해요' },
  { no: '03', title: '탐색 전 확인', desc: '시작할 때 알아두면 좋은 점을 확인해요' },
  { no: '04', title: '결과 확인', desc: '먼저 살펴볼 전공군과 다음 행동을 안내해요' },
];

const STAGE_LABEL: Record<string, string> = { STAGE_1: '1단계', STAGE_2: '2단계', STAGE_3: '3단계' };

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
};

const ExplorationIntro = () => {
  const navigate = useNavigate();
  const start = useExplorationStore((s) => s.start);
  const phase = useExplorationStore((s) => s.phase);
  const errorCode = useExplorationStore((s) => s.errorCode);
  const [sessions, setSessions] = useState<ExplorationSessionSummary[]>([]);
  const [legacy, setLegacy] = useState<DiagnosisSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([listExplorationSessions().catch(() => []), getInProgressSession()]).then(([list, legacyData]) => {
      if (!alive) return;
      setSessions(list.filter((s) => s.diagnosisType === 'EXPLORATION_V1' && s.status === 'in_progress'));
      setLegacy(legacyData?.session ?? null);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const handleStart = async () => {
    const id = await start();
    if (id !== null) navigate(`/diagnosis/exploration/session/${id}`);
  };

  const starting = phase === 'STARTING';
  const hasResume = sessions.length > 0 || legacy !== null;

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-[880px] w-full mx-auto px-4 sm:px-8 pt-10 pb-24">
        {isExplorationMock && <MockBanner />}

        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-secondary-container/20 text-secondary mb-4">
            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">explore</span>
            전공 탐색 진단
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-container mb-3 leading-snug">
            나에게 맞는 전공 방향을
            <br />
            함께 탐색해볼까요?
          </h1>
          <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
            관심 분야와 해본 활동, 공부하고 싶은 방식을 바탕으로 먼저 살펴볼 전공을 찾아봐요.
            <br className="hidden sm:block" />
            필요한 경우에만 질문을 조금 더 드려요.
          </p>
        </div>

        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {STEPS.map((step) => (
            <li key={step.no} className="bg-surface-container-lowest rounded-brand border border-outline-variant/20 p-5">
              <p className="text-xs font-bold text-secondary mb-1">{step.no}</p>
              <p className="font-bold text-primary-container mb-1">{step.title}</p>
              <p className="text-sm text-on-surface-variant leading-relaxed">{step.desc}</p>
            </li>
          ))}
        </ol>

        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <div className="bg-surface-container-low rounded-brand p-5">
            <dt className="text-xs font-semibold text-on-surface-variant mb-1">질문 수</dt>
            <dd className="font-bold text-primary-container">최대 78문항</dd>
            <dd className="text-xs text-on-surface-variant mt-1">응답에 따라 더 적게 끝날 수 있어요</dd>
          </div>
          <div className="bg-surface-container-low rounded-brand p-5">
            <dt className="text-xs font-semibold text-on-surface-variant mb-1">진행 방식</dt>
            <dd className="font-bold text-primary-container">사용자별 맞춤 질문</dd>
            <dd className="text-xs text-on-surface-variant mt-1">앞선 답변에 따라 다음 질문이 정해져요</dd>
          </div>
          <div className="bg-surface-container-low rounded-brand p-5">
            <dt className="text-xs font-semibold text-on-surface-variant mb-1">저장</dt>
            <dd className="font-bold text-primary-container">자동 저장 · 이어하기</dd>
            <dd className="text-xs text-on-surface-variant mt-1">중간에 나가도 답변이 남아 있어요</dd>
          </div>
        </dl>

        {!loading && hasResume && (
          <section aria-labelledby="resume-title" className="mb-8">
            <h2 id="resume-title" className="text-sm font-bold text-primary-container mb-3">
              진행 중인 검사
            </h2>
            <ul className="space-y-2">
              {sessions.map((s) => (
                <li key={s.sessionId}>
                  <button
                    type="button"
                    onClick={() => navigate(`/diagnosis/exploration/session/${s.sessionId}`)}
                    className="w-full min-h-[44px] flex items-center justify-between gap-3 text-left bg-surface-container-lowest border border-outline-variant/30 rounded-brand px-5 py-4 hover:border-secondary/50 motion-safe:transition-colors"
                  >
                    <span>
                      <span className="block font-semibold text-primary-container">전공 탐색 진단 이어하기</span>
                      <span className="block text-xs text-on-surface-variant mt-0.5">
                        {formatDate(s.startedAt)} 시작 · {s.stage ? STAGE_LABEL[s.stage] : ''} 진행 중
                      </span>
                    </span>
                    <span className="material-symbols-outlined text-secondary" aria-hidden="true">arrow_forward</span>
                  </button>
                </li>
              ))}
              {legacy && (
                <li>
                  <button
                    type="button"
                    onClick={() => navigate('/diagnosis')}
                    className="w-full min-h-[44px] flex items-center justify-between gap-3 text-left bg-surface-container-lowest border border-outline-variant/30 rounded-brand px-5 py-4 hover:border-secondary/50 motion-safe:transition-colors"
                  >
                    <span>
                      <span className="block font-semibold text-primary-container">이전 방식 진단 이어하기</span>
                      <span className="block text-xs text-on-surface-variant mt-0.5">
                        {formatDate(legacy.startedAt)} 시작 · 성향·역량 진단
                      </span>
                    </span>
                    <span className="material-symbols-outlined text-secondary" aria-hidden="true">arrow_forward</span>
                  </button>
                </li>
              )}
            </ul>
          </section>
        )}

        <p className="text-xs sm:text-sm text-on-surface-variant bg-surface-container-low rounded-brand p-4 mb-8 leading-relaxed">
          이 검사는 능력이나 적성을 판정하거나 합격 가능성을 예측하지 않아요. 지금의 관심과 경험을 바탕으로 먼저
          탐색해볼 전공을 찾는 참고 자료로 활용해주세요.
        </p>

        {phase === 'LOAD_FAILED' && (
          <p role="alert" className="text-sm text-error text-center mb-4">
            {errorCode === 'NO_ACTIVE_CATALOG'
              ? '지금은 새 검사를 시작할 수 없어요. 진행 중인 검사와 이전 결과는 그대로 볼 수 있어요.'
              : '검사를 시작하지 못했어요. 잠시 후 다시 시도해주세요.'}
          </p>
        )}

        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleStart}
            disabled={starting}
            className="min-h-[44px] w-full sm:w-auto px-10 py-4 rounded-lg bg-primary-container text-white font-bold shadow-lg motion-safe:transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:hover:scale-100"
          >
            {starting ? '검사를 준비하는 중…' : hasResume ? '새로 시작하기' : '검사 시작하기'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExplorationIntro;
