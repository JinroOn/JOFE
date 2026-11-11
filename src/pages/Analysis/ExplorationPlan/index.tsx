import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  createExplorationPlan,
  getExplorationPlan,
  listExplorationPlans,
  toExplorationErrorCode,
} from '../../../api/exploration';
import { isExplorationMock } from '../../../config/features';
import useExplorationResult from '../../../hooks/useExplorationResult';
import type { ExplorationPlan, ExplorationPlanSummary, PlanStatus } from '../../../types/exploration';
import MockBanner from '../../Diagnosis/Exploration/components/MockBanner';
import PlanDetail from './components/PlanDetail';

const STATUS_LABEL: Record<PlanStatus, string> = {
  GENERATING: '만드는 중',
  READY: '완성',
  FAILED: '만들지 못함',
};

const MAX_INTERVAL_MS = 5_000;

const Shell = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-surface">
    <div className="max-w-[1040px] w-full mx-auto px-4 sm:px-8 pt-8 pb-24">
      {isExplorationMock && <MockBanner />}
      {children}
    </div>
  </div>
);

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
};

// 계획 생성은 비동기라 GENERATING이면 간격을 늘려가며 다시 조회한다
const usePlan = (planId: number | null) => {
  const [plan, setPlan] = useState<ExplorationPlan | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (planId === null) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let interval = 800;
    const poll = async () => {
      try {
        const res = await getExplorationPlan(planId);
        if (!alive) return;
        setPlan(res);
        setError(false);
        if (res.status === 'GENERATING') {
          interval = Math.min(interval * 1.5, MAX_INTERVAL_MS);
          timer = setTimeout(poll, interval);
        }
      } catch {
        if (alive) setError(true);
      }
    };
    void poll();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [planId, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  return { plan: plan && plan.planId === planId ? plan : null, error, reload };
};

const ExplorationPlanPage = () => {
  const { sessionId } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const id = Number(sessionId);
  const planIdParam = Number(params.get('planId'));
  const planId = Number.isFinite(planIdParam) && planIdParam > 0 ? planIdParam : null;

  const { state: resultState, retry: retryResult } = useExplorationResult(id);
  const result = resultState.kind === 'READY' ? resultState.result : null;
  const resultId = result?.resultId ?? null;

  const [plans, setPlans] = useState<ExplorationPlanSummary[]>([]);
  const [listVersion, setListVersion] = useState(0);
  const [selectedMajor, setSelectedMajor] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const { plan, error: planError, reload: reloadPlan } = usePlan(planId);

  useEffect(() => {
    if (resultId === null) return;
    let alive = true;
    listExplorationPlans(resultId)
      .then((res) => alive && setPlans(res))
      .catch(() => alive && setPlans([]));
    return () => {
      alive = false;
    };
  }, [resultId, listVersion, plan?.status]);

  const openPlan = (pid: number) => setParams({ planId: String(pid) });

  const create = async (majorCode: string) => {
    if (resultId === null || creating) return;
    setCreating(true);
    setCreateError(null);
    try {
      const res = await createExplorationPlan(resultId, majorCode, null);
      setListVersion((v) => v + 1);
      if (res.planId === planId) reloadPlan();
      else openPlan(res.planId);
    } catch (e) {
      setCreateError(
        toExplorationErrorCode(e) === 'INVALID_REQUEST'
          ? '이 결과에 있는 전공으로만 계획을 만들 수 있어요.'
          : '계획 만들기를 요청하지 못했어요. 잠시 후 다시 시도해주세요.',
      );
    } finally {
      setCreating(false);
    }
  };

  const majors = result ? result.groups.flatMap((g) => g.majors.map((m) => ({ ...m, groupName: g.name }))) : [];
  const existingFor = (code: string) => plans.find((p) => p.majorCode === code && p.status !== 'FAILED');
  const backToResult = () => navigate(`/analysis/exploration/${id}`);
  const resultFailed = resultState.kind === 'ERROR' || resultState.kind === 'TIMEOUT';

  return (
    <Shell>
      <header className="mb-8">
        <button type="button" onClick={backToResult} className="min-h-[44px] inline-flex items-center gap-1 text-sm font-semibold text-secondary mb-2">
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_back</span>
          결과로 돌아가기
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary-container">12주 탐색 계획</h1>
        <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
          더 알아보고 싶은 전공 하나를 고르면 정보 확인 → 기초 학습 → 작은 활동 순서로 12주 계획을 만들어드려요. 계획을
          만들어도 검사 결과는 바뀌지 않아요.
        </p>
      </header>

      {resultFailed && (
        <div role="alert" className="rounded-brand bg-error-container px-5 py-4 text-sm text-on-error-container mb-8">
          <p className="mb-3">결과를 불러오지 못했어요.</p>
          <button type="button" onClick={retryResult} className="min-h-[44px] px-4 rounded-lg bg-primary-container text-white text-sm font-bold">
            다시 시도
          </button>
        </div>
      )}
      {!resultFailed && !result && <p role="status" className="text-sm text-on-surface-variant">결과를 불러오는 중이에요…</p>}

      {result && majors.length === 0 && (
        <p className="rounded-brand bg-surface-container-low px-5 py-4 text-sm text-on-surface-variant">
          이 결과에는 먼저 탐색해볼 전공이 아직 없어서 계획을 만들 수 없어요. 탐색 활동을 해본 뒤 다시 검사해보세요.
        </p>
      )}

      {result && majors.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
          <aside className="space-y-8">
            {plans.length > 0 && (
              <section aria-labelledby="my-plans">
                <h2 id="my-plans" className="font-bold text-primary-container mb-3">이 결과로 만든 계획</h2>
                <ul className="space-y-2">
                  {plans.map((p) => (
                    <li key={p.planId}>
                      <button
                        type="button"
                        aria-current={p.planId === planId ? 'true' : undefined}
                        onClick={() => openPlan(p.planId)}
                        className={`w-full min-h-[44px] text-left rounded-lg border px-4 py-3 ${
                          p.planId === planId ? 'border-secondary bg-secondary/5' : 'border-outline-variant/30 bg-surface-container-lowest'
                        }`}
                      >
                        <span className="block font-semibold text-primary-container">{p.majorName}</span>
                        <span className="block text-xs text-on-surface-variant">
                          {formatDate(p.createdAt)} · {STATUS_LABEL[p.status]}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section aria-labelledby="new-plan">
              <h2 id="new-plan" className="font-bold text-primary-container mb-3">새 계획 만들기</h2>
              <div role="radiogroup" aria-labelledby="new-plan" className="space-y-2">
                {majors.map((m) => {
                  const checked = selectedMajor === m.majorCode;
                  return (
                    <button
                      key={m.majorCode}
                      type="button"
                      role="radio"
                      aria-checked={checked}
                      onClick={() => setSelectedMajor(m.majorCode)}
                      className={`w-full min-h-[44px] flex items-center gap-3 text-left rounded-lg border-2 px-4 py-2.5 ${
                        checked ? 'border-secondary bg-secondary/5' : 'border-outline-variant/30 bg-surface-container-lowest'
                      }`}
                    >
                      <span aria-hidden="true" className={`flex-none w-4 h-4 rounded-full border-2 ${checked ? 'border-secondary bg-secondary' : 'border-outline'}`} />
                      <span>
                        <span className={`block text-sm ${checked ? 'font-bold text-secondary' : 'text-primary-container'}`}>{m.name}</span>
                        <span className="block text-[11px] text-on-surface-variant">{m.groupName}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {selectedMajor && existingFor(selectedMajor) && (
                <p className="mt-3 text-xs text-on-surface-variant">
                  이 전공으로 만든 계획이 이미 있어요.{' '}
                  <button type="button" className="font-semibold text-secondary underline" onClick={() => openPlan(existingFor(selectedMajor)!.planId)}>
                    그 계획 보기
                  </button>
                </p>
              )}
              {createError && (
                <p role="alert" className="mt-3 text-sm text-error">{createError}</p>
              )}
              <button
                type="button"
                disabled={!selectedMajor || creating || Boolean(selectedMajor && existingFor(selectedMajor))}
                onClick={() => selectedMajor && void create(selectedMajor)}
                className="mt-4 w-full min-h-[44px] rounded-lg bg-primary-container text-white font-bold disabled:opacity-50"
              >
                {creating ? '요청하는 중…' : '계획 만들기'}
              </button>
            </section>
          </aside>

          <div aria-live="polite">
            {planId === null && (
              <p className="rounded-brand bg-surface-container-low px-5 py-8 text-center text-sm text-on-surface-variant">
                전공을 고르고 계획 만들기를 누르면 여기에 계획이 나와요.
              </p>
            )}
            {planId !== null && planError && (
              <div role="alert" className="rounded-brand bg-error-container px-5 py-4 text-sm text-on-error-container">
                <p className="mb-3">계획을 불러오지 못했어요.</p>
                <button type="button" onClick={reloadPlan} className="min-h-[44px] px-4 rounded-lg bg-primary-container text-white text-sm font-bold">
                  다시 시도
                </button>
              </div>
            )}
            {planId !== null && !planError && (!plan || plan.status === 'GENERATING') && (
              <div role="status" className="rounded-brand bg-surface-container-low px-5 py-8 text-center">
                <span className="material-symbols-outlined text-[32px] text-secondary motion-safe:animate-spin" aria-hidden="true">
                  progress_activity
                </span>
                <p className="mt-2 text-sm text-on-surface-variant">
                  {plan ? `${plan.majorName} 계획을 만들고 있어요. 이 화면을 나가도 계속 만들어져요.` : '계획을 불러오는 중이에요…'}
                </p>
              </div>
            )}
            {plan?.status === 'FAILED' && (
              <div role="alert" className="rounded-brand bg-error-container px-5 py-4 text-sm text-on-error-container">
                <p className="mb-3">{plan.majorName} 계획을 만들지 못했어요. 검사 결과는 그대로 남아 있어요.</p>
                <button
                  type="button"
                  disabled={creating}
                  onClick={() => void create(plan.majorCode)}
                  className="min-h-[44px] px-4 rounded-lg bg-primary-container text-white text-sm font-bold disabled:opacity-50"
                >
                  계획만 다시 만들기
                </button>
              </div>
            )}
            {plan?.status === 'READY' && <PlanDetail plan={plan} />}
          </div>
        </div>
      )}
    </Shell>
  );
};

export default ExplorationPlanPage;
