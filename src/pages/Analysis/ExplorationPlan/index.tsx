import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';

import {
  cancelExplorationPlan,
  createExplorationPlan,
  ensurePlanSupport,
  getExplorationPlan,
  listExplorationPlans,
  retryExplorationPlan,
  toExplorationErrorCode,
} from '../../../api/exploration';

import { isExplorationMock } from '../../../config/features';
import useExplorationResult from '../../../hooks/useExplorationResult';

import type {
  ExplorationPlan,
  ExplorationPlanSummary,
  PlanStatus,
} from '../../../types/exploration';

import MockBanner from '../../Diagnosis/Exploration/components/MockBanner';
import PlanDetail from './components/PlanDetail';

const STATUS_LABEL: Record<PlanStatus, string> = {
  GENERATING: '만드는 중',
  READY: '완성',
  FAILED: '만들지 못함',
};

const MAX_INTERVAL_MS = 5_000;

const failureReason = (
  code: string | null | undefined,
) => {
  switch (code) {
    case 'CANCELLED':
      return '만들기를 취소했어요.';

    case 'EVIDENCE_UNAVAILABLE':
      return '이 전공은 계획에 쓸 수 있는 확인된 자료가 아직 부족해요.';

    case 'MODEL_DECLINED':
    case 'OUTPUT_INVALID':
    case 'INVALID_RESPONSE':
      return '만든 계획이 안내 기준에 맞지 않아 보여드리지 않았어요.';

    case 'ATTEMPTS_EXHAUSTED':
      return '여러 번 시도했지만 만들지 못했어요.';

    case 'LEASE_EXPIRED':
    case 'TRANSIENT':
      return '만드는 도중 연결이 끊겼어요.';

    default:
      return '잠시 문제가 생겨 만들지 못했어요.';
  }
};

const createErrorMessage = (error: unknown) => {
  switch (toExplorationErrorCode(error)) {
    case 'PLAN_GENERATION_UNAVAILABLE':
      return '지금은 계획 만들기를 쓸 수 없어요. 나중에 다시 시도해주세요.';

    case 'PLAN_TARGET_UNAVAILABLE':
      return '이 결과로는 계획을 만들 수 없어요.';

    case 'INVALID_INPUT':
    case 'TARGET_MAJOR_NOT_IN_RESULT':
    case 'TARGET_MAJOR_REQUIRED':
      return '이 결과에 있는 전공으로만 계획을 만들 수 있어요.';

    case 'STALE_REVISION':
    case 'PLAN_SUPPORT_REQUIRED':
    case 'SUPPORT_TARGET_MISMATCH':
      return '다른 화면에서 결과 후 선택이 바뀌었어요. 다시 시도해주세요.';

    case 'NETWORK':
      return '인터넷 연결을 확인한 뒤 다시 시도해주세요.';

    default:
      return '계획 만들기를 요청하지 못했어요. 잠시 후 다시 시도해주세요.';
  }
};

const Shell = ({
  children,
}: {
  children: ReactNode;
}) => (
  <div className="min-h-screen bg-surface">
    <div className="max-w-[1040px] w-full mx-auto px-4 sm:px-8 pt-8 pb-24">
      {isExplorationMock && <MockBanner />}
      {children}
    </div>
  </div>
);

const formatDate = (iso: string) => {
  const date = new Date(iso);

  return Number.isNaN(date.getTime())
    ? ''
    : `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
};

const usePlan = (planId: number | null) => {
  const [plan, setPlan] =
    useState<ExplorationPlan | null>(null);

  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (planId === null) return;

    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null =
      null;

    let interval = 800;

    const poll = async () => {
      try {
        const response =
          await getExplorationPlan(planId);

        if (!alive) return;

        setPlan(response);
        setError(false);

        if (response.status === 'GENERATING') {
          interval = Math.min(
            interval * 1.5,
            MAX_INTERVAL_MS,
          );

          timer = setTimeout(poll, interval);
        }
      } catch {
        if (alive) {
          setError(true);
        }
      }
    };

    void poll();

    return () => {
      alive = false;

      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [planId, attempt]);

  const reload = useCallback(() => {
    setAttempt((previous) => previous + 1);
  }, []);

  return {
    plan:
      plan && plan.planId === planId
        ? plan
        : null,
    error,
    reload,
  };
};

const ExplorationPlanPage = () => {
  const { sessionId } = useParams();

  const [params, setParams] =
    useSearchParams();

  const navigate = useNavigate();
  const id = Number(sessionId);

  const planIdParam =
    Number(params.get('planId'));

  const planId =
    Number.isFinite(planIdParam) &&
    planIdParam > 0
      ? planIdParam
      : null;

  const {
    state: resultState,
    retry: retryResult,
  } = useExplorationResult(id);

  const result =
    resultState.kind === 'READY'
      ? resultState.result
      : null;

  const resultId =
    result?.resultId ?? null;

  const [plans, setPlans] =
    useState<ExplorationPlanSummary[]>([]);

  const [listVersion, setListVersion] =
    useState(0);

  const [selectedMajor, setSelectedMajor] =
    useState<string | null>(null);

  const [creating, setCreating] =
    useState(false);

  const [createError, setCreateError] =
    useState<string | null>(null);

  const [planActing, setPlanActing] =
    useState(false);

  const [planActionError, setPlanActionError] =
    useState<string | null>(null);

  const {
    plan,
    error: planError,
    reload: reloadPlan,
  } = usePlan(resultId === null ? null : planId);

  useEffect(() => {
    if (resultId === null) return;

    let alive = true;

    listExplorationPlans(resultId)
      .then((response) => {
        if (alive) {
          setPlans(response);
        }
      })
      .catch(() => {
        if (alive) {
          setPlans([]);
        }
      });

    return () => {
      alive = false;
    };
  }, [resultId, listVersion, plan?.status]);

  const openPlan = (pid: number) => {
    setParams({ planId: String(pid) });
  };

  const create = async (majorCode: string) => {
    if (resultId === null || creating) return;

    setCreating(true);
    setCreateError(null);

    try {
      const support =
        await ensurePlanSupport(
          resultId,
          majorCode,
        );

      const response =
        await createExplorationPlan(
          resultId,
          majorCode,
          support.supportRevision,
        );

      setListVersion(
        (previous) => previous + 1,
      );

      if (response.planId === planId) {
        reloadPlan();
      } else {
        openPlan(response.planId);
      }
    } catch (error) {
      setCreateError(
        createErrorMessage(error),
      );
    } finally {
      setCreating(false);
    }
  };

  const retryPlan = async (pid: number) => {
    if (planActing) return;

    setPlanActing(true);
    setPlanActionError(null);

    try {
      await retryExplorationPlan(pid);

      setListVersion(
        (previous) => previous + 1,
      );

      reloadPlan();
    } catch (error) {
      setPlanActionError(
        createErrorMessage(error),
      );
    } finally {
      setPlanActing(false);
    }
  };

  const cancelPlan = async (pid: number) => {
    if (planActing) return;

    setPlanActing(true);
    setPlanActionError(null);

    try {
      await cancelExplorationPlan(pid);
    } catch {
      setPlanActionError(
        '취소하지 못했어요. 계획 상태를 다시 불러왔어요.',
      );
    } finally {
      setPlanActing(false);

      setListVersion(
        (previous) => previous + 1,
      );

      reloadPlan();
    }
  };

  const majors = result
    ? result.groups.flatMap((group) =>
        group.majors.map((major) => ({
          ...major,
          groupName: group.name,
        })),
      )
    : [];

  const existingFor = (code: string) =>
    plans.find(
      (plan) =>
        plan.majorCode === code &&
        plan.status !== 'FAILED',
    );

  const backToResult = () =>
    navigate(`/analysis/exploration/${id}`);

  // 수정: 없는 결과 / 다른 계정의 결과
  const resultNotFound =
    resultState.kind === 'ERROR' &&
    resultState.code === 'NOT_FOUND';

  const resultFailed =
    resultState.kind === 'ERROR' ||
    resultState.kind === 'TIMEOUT';

  return (
    <Shell>
      <header className="mb-8">
        <button
          type="button"
          onClick={backToResult}
          className="min-h-[44px] inline-flex items-center gap-1 text-sm font-semibold text-secondary mb-2"
        >
          <span
            className="material-symbols-outlined text-[18px]"
            aria-hidden="true"
          >
            arrow_back
          </span>
          결과로 돌아가기
        </button>

        <h1 className="text-2xl sm:text-3xl font-bold text-primary-container">
          12주 탐색 계획
        </h1>

        <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
          더 알아보고 싶은 전공 하나를 고르면 정보 확인
          → 기초 학습 → 작은 활동 순서로 12주 계획을
          만들어드려요. 계획을 만들어도 검사 결과는
          바뀌지 않아요.
        </p>
      </header>

      {/* 수정: NOT_FOUND는 재시도 대신 확인 안내 */}
      {resultNotFound && (
        <div
          role="alert"
          className="rounded-brand bg-surface-container-low px-5 py-5 mb-8 text-sm text-primary-container"
        >
          <h2 className="mb-2 text-lg font-bold">
            결과를 찾을 수 없어요
          </h2>

          <p className="text-on-surface-variant leading-relaxed">
            결과 주소가 올바르지 않거나
            확인할 수 없는 결과예요.
            내 진단 이력에서 다시 확인해 주세요.
          </p>

          <button
            type="button"
            onClick={() => navigate('/mypage')}
            className="mt-4 min-h-[44px] rounded-lg bg-primary-container px-4 text-sm font-bold text-white"
          >
            내 진단 이력 보기
          </button>
        </div>
      )}

      {/* 네트워크 등의 일시적인 오류만 재시도 허용 */}
      {resultFailed && !resultNotFound && (
        <div
          role="alert"
          className="rounded-brand bg-error-container px-5 py-4 text-sm text-on-error-container mb-8"
        >
          <p className="mb-3">
            결과를 불러오지 못했어요.
          </p>

          <button
            type="button"
            onClick={retryResult}
            className="min-h-[44px] px-4 rounded-lg bg-primary-container text-white text-sm font-bold"
          >
            다시 시도
          </button>
        </div>
      )}

      {!resultFailed && !result && (
        <p
          role="status"
          className="text-sm text-on-surface-variant"
        >
          결과를 불러오는 중이에요…
        </p>
      )}

      {result && majors.length === 0 && (
        <p className="rounded-brand bg-surface-container-low px-5 py-4 text-sm text-on-surface-variant">
          이 결과에는 먼저 탐색해볼 전공이 아직 없어서
          계획을 만들 수 없어요. 탐색 활동을 해본 뒤
          다시 검사해보세요.
        </p>
      )}

      {result && majors.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
          <aside className="space-y-8">
            {plans.length > 0 && (
              <section aria-labelledby="my-plans">
                <h2
                  id="my-plans"
                  className="font-bold text-primary-container mb-3"
                >
                  이 결과로 만든 계획
                </h2>

                <ul className="space-y-2">
                  {plans.map((item) => (
                    <li key={item.planId}>
                      <button
                        type="button"
                        aria-current={
                          item.planId === planId
                            ? 'true'
                            : undefined
                        }
                        onClick={() =>
                          openPlan(item.planId)
                        }
                        className={`w-full min-h-[44px] text-left rounded-lg border px-4 py-3 ${
                          item.planId === planId
                            ? 'border-secondary bg-secondary/5'
                            : 'border-outline-variant/30 bg-surface-container-lowest'
                        }`}
                      >
                        <span className="block font-semibold text-primary-container">
                          {item.majorName}
                        </span>

                        <span className="block text-xs text-on-surface-variant">
                          {formatDate(item.createdAt)}
                          {' · '}
                          {STATUS_LABEL[item.status]}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section aria-labelledby="new-plan">
              <h2
                id="new-plan"
                className="font-bold text-primary-container mb-3"
              >
                새 계획 만들기
              </h2>

              <div
                role="radiogroup"
                aria-labelledby="new-plan"
                className="space-y-2"
              >
                {majors.map((major) => {
                  const checked =
                    selectedMajor === major.majorCode;

                  return (
                    <button
                      key={major.majorCode}
                      type="button"
                      role="radio"
                      aria-checked={checked}
                      onClick={() =>
                        setSelectedMajor(
                          major.majorCode,
                        )
                      }
                      className={`w-full min-h-[44px] flex items-center gap-3 text-left rounded-lg border-2 px-4 py-2.5 ${
                        checked
                          ? 'border-secondary bg-secondary/5'
                          : 'border-outline-variant/30 bg-surface-container-lowest'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`flex-none w-4 h-4 rounded-full border-2 ${
                          checked
                            ? 'border-secondary bg-secondary'
                            : 'border-outline'
                        }`}
                      />

                      <span>
                        <span
                          className={`block text-sm ${
                            checked
                              ? 'font-bold text-secondary'
                              : 'text-primary-container'
                          }`}
                        >
                          {major.name}
                        </span>

                        <span className="block text-[11px] text-on-surface-variant">
                          {major.groupName}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedMajor &&
                existingFor(selectedMajor) && (
                <p className="mt-3 text-xs text-on-surface-variant">
                  이 전공으로 만든 계획이 이미 있어요.{' '}

                  <button
                    type="button"
                    className="font-semibold text-secondary underline"
                    onClick={() =>
                      openPlan(
                        existingFor(selectedMajor)!.planId,
                      )
                    }
                  >
                    그 계획 보기
                  </button>
                </p>
              )}

              {createError && (
                <p
                  role="alert"
                  className="mt-3 text-sm text-error"
                >
                  {createError}
                </p>
              )}

              <p className="mt-3 text-xs text-on-surface-variant leading-relaxed">
                계획을 만들면 결과 후 질문의 목표 전공도
                이 전공으로 맞춰져요.
              </p>

              <button
                type="button"
                disabled={
                  !selectedMajor ||
                  creating ||
                  Boolean(
                    selectedMajor &&
                    existingFor(selectedMajor),
                  )
                }
                onClick={() =>
                  selectedMajor &&
                  void create(selectedMajor)
                }
                className="mt-4 w-full min-h-[44px] rounded-lg bg-primary-container text-white font-bold disabled:opacity-50"
              >
                {creating
                  ? '요청하는 중…'
                  : '계획 만들기'}
              </button>
            </section>
          </aside>

          <div aria-live="polite">
            {planId === null && (
              <p className="rounded-brand bg-surface-container-low px-5 py-8 text-center text-sm text-on-surface-variant">
                전공을 고르고 계획 만들기를 누르면
                여기에 계획이 나와요.
              </p>
            )}

            {planId !== null && planError && (
              <div
                role="alert"
                className="rounded-brand bg-error-container px-5 py-4 text-sm text-on-error-container"
              >
                <p className="mb-3">
                  계획을 불러오지 못했어요.
                </p>

                <button
                  type="button"
                  onClick={reloadPlan}
                  className="min-h-[44px] px-4 rounded-lg bg-primary-container text-white text-sm font-bold"
                >
                  다시 시도
                </button>
              </div>
            )}

            {planId !== null &&
              !planError &&
              (!plan ||
                plan.status === 'GENERATING') && (
              <div
                role="status"
                className="rounded-brand bg-surface-container-low px-5 py-8 text-center"
              >
                <span
                  className="material-symbols-outlined text-[32px] text-secondary motion-safe:animate-spin"
                  aria-hidden="true"
                >
                  progress_activity
                </span>

                <p className="mt-2 text-sm text-on-surface-variant">
                  {plan
                    ? `${plan.majorName} 계획을 만들고 있어요. 이 화면을 나가도 계속 만들어져요.`
                    : '계획을 불러오는 중이에요…'}
                </p>

                {plan && (
                  <button
                    type="button"
                    disabled={planActing}
                    onClick={() =>
                      void cancelPlan(plan.planId)
                    }
                    className="mt-4 min-h-[44px] px-4 rounded-lg border border-outline-variant/40 text-sm font-semibold text-primary-container disabled:opacity-50"
                  >
                    만들기 취소
                  </button>
                )}
              </div>
            )}

            {planActionError && (
              <p
                role="alert"
                className="mt-3 text-sm text-error"
              >
                {planActionError}
              </p>
            )}

            {plan?.status === 'FAILED' && (
              <div
                role="alert"
                className="rounded-brand bg-error-container px-5 py-4 text-sm text-on-error-container"
              >
                <p className="mb-1">
                  {plan.majorName} 계획을 만들지 못했어요.
                  검사 결과는 그대로 남아 있어요.
                </p>

                <p className="mb-3">
                  {failureReason(plan.failureCode)}
                </p>

                {plan.retryable ? (
                  <button
                    type="button"
                    disabled={planActing}
                    onClick={() =>
                      void retryPlan(plan.planId)
                    }
                    className="min-h-[44px] px-4 rounded-lg bg-primary-container text-white text-sm font-bold disabled:opacity-50"
                  >
                    이 계획 다시 시도
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={creating}
                    onClick={() =>
                      void create(plan.majorCode)
                    }
                    className="min-h-[44px] px-4 rounded-lg bg-primary-container text-white text-sm font-bold disabled:opacity-50"
                  >
                    계획 새로 만들기
                  </button>
                )}

                {createError && (
                  <p className="mt-3">
                    {createError}
                  </p>
                )}
              </div>
            )}

            {plan?.status === 'READY' && (
              <PlanDetail plan={plan} />
            )}
          </div>
        </div>
      )}
    </Shell>
  );
};

export default ExplorationPlanPage;