
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

import {
  createMutationId,
  getExplorationSession,
} from '../../../api/exploration';

import api from '../../../api/axios';
import { isExplorationMock } from '../../../config/features';
import useExplorationStore from '../../../store/useExplorationStore';

import type {
  ExplorationSessionDetail,
} from '../../../types/exploration';

import ExplorationQuestion from './Question';
import StageStepper from './Question/components/StageStepper';

interface PresentedMajor {
  majorCode: string;
  majorName: string;
}

interface CandidateCheckpoint {
  checkpointId: number;
  shownCandidates: PresentedMajor[];
  presentation: {
    source: 'NOT_COLLECTED' | 'USER_REPORTED';
    shownMajorCodes: string[];
  };
}

type Probe =
  | {
      sessionId: number;
      revision: number;
      kind: 'READY';
      checkpoint: CandidateCheckpoint;
    }
  | {
      sessionId: number;
      revision: number;
      kind: 'ERROR' | 'STALE';
    };

interface Selection {
  checkpointId: number;
  unexpected: string[];
  unfamiliar: string[];
}

interface PendingRequest {
  key: string;
  sessionId: number;
  expectedRevision: number;
  checkpointId: number;
  unexpected: string[];
  unfamiliar: string[];
}

interface ConfirmedPresentation {
  sessionId: number;
  checkpointId: number;
}

const primaryBtn =
  'min-h-[44px] rounded-lg bg-primary-container px-6 py-3 font-bold text-white disabled:opacity-50';

const secondaryBtn =
  'min-h-[44px] rounded-lg border border-outline-variant px-5 py-3 font-semibold text-primary-container bg-surface-container-lowest';

// 서버가 실제로 제시한 체크포인트와 후보 코드만 사용합니다.
const parseCheckpoint = (
  value: unknown,
): CandidateCheckpoint | null => {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    return null;
  }

  const data = value as Record<string, unknown>;
  const checkpointId = data.checkpointId;
  const preview = data.shownCandidates;
  const presentation = data.presentation;

  if (
    typeof checkpointId !== 'number' ||
    !Number.isSafeInteger(checkpointId) ||
    checkpointId <= 0 ||
    !Array.isArray(preview) ||
    preview.length > 7 ||
    !presentation ||
    typeof presentation !== 'object' ||
    Array.isArray(presentation)
  ) {
    return null;
  }

  const saved = presentation as Record<string, unknown>;

  if (
    saved.source !== 'NOT_COLLECTED' &&
    saved.source !== 'USER_REPORTED'
  ) {
    return null;
  }

  if (
    !Array.isArray(saved.shownMajorCodes) ||
    saved.shownMajorCodes.length !== preview.length
  ) {
    return null;
  }

  const shownCandidates: PresentedMajor[] = [];

  for (const item of preview) {
    if (
      !item ||
      typeof item !== 'object' ||
      Array.isArray(item)
    ) {
      return null;
    }

    const major = item as Record<string, unknown>;

    if (
      typeof major.majorCode !== 'string' ||
      !major.majorCode.trim() ||
      typeof major.majorName !== 'string' ||
      !major.majorName.trim()
    ) {
      return null;
    }

    shownCandidates.push({
      majorCode: major.majorCode,
      majorName: major.majorName,
    });
  }

  const codes = shownCandidates.map(
    (major) => major.majorCode,
  );

  if (
    new Set(codes).size !== codes.length ||
    !saved.shownMajorCodes.every(
      (code, index) => code === codes[index],
    )
  ) {
    return null;
  }

  return {
    checkpointId,
    shownCandidates,
    presentation: {
      source: saved.source,
      shownMajorCodes: codes,
    },
  };
};

// 후보 저장이 성공했지만 최신 문항을 아직
// 불러오는 중일 때 표시할 화면입니다.
const QuestionPreparation = () => (
  <div className="min-h-screen bg-surface">
    <div className="mx-auto w-full max-w-[760px] px-4 pb-24 pt-8 sm:px-8">
      <div className="mb-8">
        <StageStepper stage={2} />
      </div>

      <section className="cloud-shadow rounded-brand border border-outline-variant/20 bg-surface-container-lowest p-6 sm:p-10">
        <p
          role="status"
          className="text-sm text-on-surface-variant"
        >
          후보 반응을 저장했습니다.
          다음 질문을 불러오는 중이에요…
        </p>
      </section>
    </div>
  </div>
);

const QuestionWithPresentation = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const id = Number(sessionId);

  const session = useExplorationStore(
    (state) => state.session,
  );

  const phase = useExplorationStore(
    (state) => state.phase,
  );

  // 수정 1:
  // /next 응답을 기다리는 동안 SAVING 상태를 확인합니다.
  const saveState = useExplorationStore(
    (state) => state.saveState,
  );

  const reloadLatest = useExplorationStore(
    (state) => state.reloadLatest,
  );

  const [probe, setProbe] = useState<Probe | null>(
    null,
  );

  const [refreshVersion, setRefreshVersion] =
    useState(0);

  const [selection, setSelection] =
    useState<Selection | null>(null);

  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  // 수정 2:
  // 서버의 USER_REPORTED 확인 또는
  // PUT /presentation 성공 이후에만 완료 상태를 저장합니다.
  //
  // 이 상태는 revision과 분리되어 있습니다.
  // 따라서 2단계 문항 저장으로 revision이 증가해도
  // 후보 화면으로 돌아가지 않습니다.
  const [
    confirmedPresentation,
    setConfirmedPresentation,
  ] = useState<ConfirmedPresentation | null>(
    null,
  );

  // 응답을 받지 못한 요청은
  // 동일한 멱등 키와 본문으로 재시도합니다.
  const pendingRequest =
    useRef<PendingRequest | null>(null);

  // React 상태 업데이트 이전에 들어오는
  // 연속 클릭도 차단합니다.
  const submittingRef = useRef(false);

  const validId =
    Number.isSafeInteger(id) && id > 0;

  const stageTwo =
    !isExplorationMock &&
    validId &&
    session?.sessionId === id &&
    session.stage === 2 &&
    session.status === 'in_progress' &&
    phase !== 'IDLE' &&
    phase !== 'STARTING' &&
    phase !== 'RESUMING' &&
    phase !== 'LOAD_FAILED' &&
    phase !== 'RESULT_READY';

  const revision =
    session?.sessionId === id
      ? session.revision
      : null;

  // 수정 3:
  // 후보 확인 완료 여부는 saveState와 관계없습니다.
  // 2단계 문항을 저장할 때 SAVING으로 바뀌어도
  // confirmedForSession은 그대로 true입니다.
  const confirmedForSession =
    stageTwo &&
    confirmedPresentation?.sessionId === id;

  const preparingNext =
    saveState === 'SAVING';

  useEffect(() => {
    // 수정 4:
    // 이미 후보 반응이 서버에 저장되었다면
    // 이후 문항 저장으로 revision이 증가해도
    // 후보 정보를 다시 조회하지 않습니다.
    if (
      !stageTwo ||
      revision === null ||
      confirmedForSession
    ) {
      return;
    }

    let active = true;

    void getExplorationSession(id)
      .then((detail: ExplorationSessionDetail) => {
        if (!active) return;

        // 다른 창에서 회차가 먼저 변경되었을 수 있습니다.
        if (
          detail.session.revision !== revision
        ) {
          setProbe({
            sessionId: id,
            revision,
            kind: 'STALE',
          });

          return;
        }

        const response =
          detail as ExplorationSessionDetail & {
            fixedCandidates?: unknown;
          };

        const checkpoint = parseCheckpoint(
          response.fixedCandidates,
        );

        if (!checkpoint) {
          setProbe({
            sessionId: id,
            revision,
            kind: 'ERROR',
          });

          return;
        }

        // 이어하기 등으로 들어왔을 때
        // 서버가 이미 후보 반응 제출을 확인했다면
        // 후보 화면을 거치지 않고 문항 화면으로 이동합니다.
        if (
          checkpoint.presentation.source ===
          'USER_REPORTED'
        ) {
          pendingRequest.current = null;

          setConfirmedPresentation({
            sessionId: id,
            checkpointId: checkpoint.checkpointId,
          });

          return;
        }

        setProbe({
          sessionId: id,
          revision,
          kind: 'READY',
          checkpoint,
        });
      })
      .catch(() => {
        if (!active) return;

        setProbe({
          sessionId: id,
          revision,
          kind: 'ERROR',
        });
      });

    return () => {
      active = false;
    };
  }, [
    id,
    stageTwo,
    revision,
    refreshVersion,
    confirmedForSession,
  ]);

  // 1단계, 3단계, Mock 모드,
  // 진행 중이 아닌 회차는 기존 질문 화면을 사용합니다.
  if (!stageTwo || revision === null) {
    return <ExplorationQuestion />;
  }

  // 수정 5: 화면 깜빡임 방지 핵심
  //
  // 후보 반응 저장이 확인된 회차에서는
  // revision 또는 saveState가 바뀌어도
  // 후보 화면으로 다시 돌아가지 않습니다.
  //
  // presentation 저장 직후에는 최신 문항 동기화가
  // 끝날 때까지 준비 화면을 표시해
  // 오래된 revision으로 답변하지 못하게 합니다.
  if (confirmedForSession) {
    if (saving || syncing) {
      return <QuestionPreparation />;
    }

    return <ExplorationQuestion />;
  }

  const current =
    probe?.sessionId === id &&
    probe.revision === revision
      ? probe
      : null;

  const checkpoint =
    current?.kind === 'READY'
      ? current.checkpoint
      : null;

  const selected: Selection =
    checkpoint &&
    selection?.checkpointId ===
      checkpoint.checkpointId
      ? selection
      : {
          checkpointId:
            checkpoint?.checkpointId ?? 0,
          unexpected: [],
          unfamiliar: [],
        };

  const exit = () =>
    navigate('/diagnosis/exploration');

  const syncLatest = async () => {
    if (
      syncing ||
      saving ||
      submittingRef.current ||
      useExplorationStore.getState().saveState ===
        'SAVING'
    ) {
      return;
    }

    pendingRequest.current = null;

    setSyncing(true);
    setError(null);

    try {
      await reloadLatest();
    } finally {
      setRefreshVersion(
        (previous) => previous + 1,
      );

      setSyncing(false);
    }
  };

  const toggle = (
    kind: 'unexpected' | 'unfamiliar',
    majorCode: string,
  ) => {
    if (
      !checkpoint ||
      saving ||
      syncing ||
      preparingNext
    ) {
      return;
    }

    const allowed = new Set(
      checkpoint.presentation.shownMajorCodes,
    );

    if (!allowed.has(majorCode)) return;

    // 선택이 달라지면 이전 실패 요청의
    // 멱등 키는 사용하지 않습니다.
    pendingRequest.current = null;

    setError(null);

    setSelection((previous) => {
      const base: Selection =
        previous?.checkpointId ===
        checkpoint.checkpointId
          ? previous
          : {
              checkpointId:
                checkpoint.checkpointId,
              unexpected: [],
              unfamiliar: [],
            };

      const existing = base[kind];

      const next = existing.includes(majorCode)
        ? existing.filter(
            (code) => code !== majorCode,
          )
        : existing.length < 7
          ? [...existing, majorCode]
          : existing;

      return {
        ...base,
        [kind]: next,
      };
    });
  };

  const submit = async () => {
    // 수정 6:
    // 렌더링 시점의 값이 아니라
    // 제출 시점의 최신 Zustand 상태를 확인합니다.
    //
    // /next 요청이 아직 처리 중이면
    // PUT /presentation을 실행하지 않습니다.
    const latestState =
      useExplorationStore.getState();

    if (
      !checkpoint ||
      saving ||
      syncing ||
      submittingRef.current ||
      latestState.saveState === 'SAVING'
    ) {
      return;
    }

    const latest = latestState.session;

    if (
      latest?.sessionId !== id ||
      latest.status !== 'in_progress' ||
      latest.stage !== 2 ||
      latest.revision !== revision
    ) {
      setError(
        '검사 정보가 변경되었습니다. 최신 회차를 확인해주세요.',
      );

      await syncLatest();
      return;
    }

    const unexpected = [
      ...new Set(selected.unexpected),
    ].sort();

    const unfamiliar = [
      ...new Set(selected.unfamiliar),
    ].sort();

    const allowed = new Set(
      checkpoint.presentation.shownMajorCodes,
    );

    if (
      unexpected.length > 7 ||
      unfamiliar.length > 7 ||
      [...unexpected, ...unfamiliar].some(
        (code) => !allowed.has(code),
      )
    ) {
      setError(
        '현재 제시된 후보만 최대 7개까지 선택할 수 있어요.',
      );

      return;
    }

    const previous = pendingRequest.current;

    const sameRequest =
      previous?.sessionId === id &&
      previous.expectedRevision === revision &&
      previous.checkpointId ===
        checkpoint.checkpointId &&
      JSON.stringify(previous.unexpected) ===
        JSON.stringify(unexpected) &&
      JSON.stringify(previous.unfamiliar) ===
        JSON.stringify(unfamiliar);

    const request: PendingRequest =
      sameRequest && previous
        ? previous
        : {
            key: createMutationId(),
            sessionId: id,
            expectedRevision: revision,
            checkpointId:
              checkpoint.checkpointId,
            unexpected,
            unfamiliar,
          };

    pendingRequest.current = request;
    submittingRef.current = true;

    setSaving(true);
    setError(null);

    try {
      await api.put(
        `/exploration/v1/sessions/${id}/presentation`,
        {
          expectedRevision:
            request.expectedRevision,
          checkpointId:
            request.checkpointId,
          unexpected:
            request.unexpected,
          unfamiliar:
            request.unfamiliar,
        },
        {
          headers: {
            'Idempotency-Key': request.key,
          },
        },
      );

      pendingRequest.current = null;

      // 수정 7:
      // 서버가 후보 반응 저장을 승인한 사실을
      // 최신 문항 재조회 전에 먼저 기록합니다.
      //
      // 이후 reloadLatest로 revision이 바뀌어도
      // 후보 확인 화면이 다시 나타나지 않습니다.
      setConfirmedPresentation({
        sessionId: id,
        checkpointId: request.checkpointId,
      });

      // 다음 질문은 반드시 최신 revision으로 불러옵니다.
      await reloadLatest();

      setRefreshVersion(
        (previous) => previous + 1,
      );
    } catch (caught) {
      const status =
        axios.isAxiosError(caught)
          ? caught.response?.status
          : undefined;

      if (status === 409 || status === 422) {
        // 기존 충돌 복구 동작 유지:
        // 오래된 요청을 버리고 서버 최신 상태를 조회합니다.
        pendingRequest.current = null;

        setError(
          '검사 정보가 변경되었습니다. 최신 후보를 다시 확인해주세요.',
        );

        setSyncing(true);

        try {
          await reloadLatest();
        } finally {
          setRefreshVersion(
            (previous) => previous + 1,
          );

          setSyncing(false);
        }
      } else {
        // 서버 응답 유실 가능성이 있으므로
        // 동일한 멱등 키와 본문으로 재시도합니다.
        setError(
          '후보 반응을 저장하지 못했어요. 같은 내용으로 다시 시도할 수 있어요.',
        );
      }
    } finally {
      submittingRef.current = false;
      setSaving(false);
    }
  };

  const loading = !current;

  const failed =
    current?.kind === 'ERROR' ||
    current?.kind === 'STALE';

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto w-full max-w-[760px] px-4 pb-24 pt-8 sm:px-8">
        <div className="mb-8">
          <StageStepper stage={2} />
        </div>

        <section className="cloud-shadow rounded-brand border border-outline-variant/20 bg-surface-container-lowest p-6 sm:p-10">
          <p className="mb-3 text-xs font-bold text-secondary">
            2단계 · 후보 확인
          </p>

          <h1 className="mb-4 text-xl font-bold text-primary-container sm:text-2xl">
            지금 제시된 전공을 살펴봐 주세요
          </h1>

          {loading && (
            <p
              role="status"
              className="text-sm text-on-surface-variant"
            >
              제시된 후보를 불러오는 중이에요…
            </p>
          )}

          {failed && (
            <div role="alert">
              <p className="mb-5 text-sm text-on-surface-variant">
                {current.kind === 'STALE'
                  ? '다른 창에서 검사 정보가 변경되었어요. 최신 상태를 불러와 주세요.'
                  : '후보 정보를 불러오지 못했어요. 다시 확인해주세요.'}
              </p>

              <button
                type="button"
                className={primaryBtn}
                disabled={
                  syncing ||
                  saving ||
                  preparingNext
                }
                onClick={() => {
                  void syncLatest();
                }}
              >
                {syncing
                  ? '최신 상태 확인 중…'
                  : preparingNext
                    ? '다음 질문 준비 중…'
                    : '최신 상태 불러오기'}
              </button>
            </div>
          )}

          {checkpoint && (
            <>
              <p className="mb-6 text-sm leading-relaxed text-on-surface-variant">
                예상과 달랐던 전공이나 아직 낯선 전공을
                선택할 수 있어요.
                선택하지 않고 넘어가도 괜찮습니다.
                이 반응은 후보 점수나 추천 순위를
                변경하지 않습니다.
              </p>

              {checkpoint.shownCandidates.length === 0 ? (
                <p className="mb-6 rounded-xl bg-surface-container-low p-5 text-sm text-on-surface-variant">
                  현재 제시된 후보가 없습니다.
                  확인 후 다음 질문을 진행할 수 있어요.
                </p>
              ) : (
                <div className="mb-6 space-y-3">
                  {checkpoint.shownCandidates.map(
                    (major) => {
                      const unexpected =
                        selected.unexpected.includes(
                          major.majorCode,
                        );

                      const unfamiliar =
                        selected.unfamiliar.includes(
                          major.majorCode,
                        );

                      return (
                        <div
                          key={major.majorCode}
                          className="rounded-xl border border-outline-variant/30 p-4"
                        >
                          <h2 className="mb-3 font-bold text-primary-container">
                            {major.majorName}
                          </h2>

                          <div className="flex flex-wrap gap-4">
                            <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-on-surface-variant">
                              <input
                                type="checkbox"
                                checked={unexpected}
                                disabled={
                                  saving ||
                                  syncing ||
                                  preparingNext
                                }
                                onChange={() =>
                                  toggle(
                                    'unexpected',
                                    major.majorCode,
                                  )
                                }
                                className="h-5 w-5 accent-secondary"
                              />

                              예상과 달랐어요
                            </label>

                            <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-on-surface-variant">
                              <input
                                type="checkbox"
                                checked={unfamiliar}
                                disabled={
                                  saving ||
                                  syncing ||
                                  preparingNext
                                }
                                onChange={() =>
                                  toggle(
                                    'unfamiliar',
                                    major.majorCode,
                                  )
                                }
                                className="h-5 w-5 accent-secondary"
                              />

                              아직 낯설어요
                            </label>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              )}

              <p className="mb-5 text-xs text-on-surface-variant">
                예상과 다른 후보{' '}
                {selected.unexpected.length}개
                {' · '}
                낯선 후보{' '}
                {selected.unfamiliar.length}개
              </p>

              {error && (
                <p
                  role="alert"
                  className="mb-4 text-sm font-medium text-error"
                >
                  {error}
                </p>
              )}

              {/* /next 응답 대기 중 확인 버튼 비활성화 */}
              <button
                type="button"
                onClick={() => {
                  void submit();
                }}
                disabled={
                  saving ||
                  syncing ||
                  preparingNext
                }
                className={`${primaryBtn} w-full`}
              >
                {preparingNext
                  ? '다음 질문 준비 중…'
                  : saving || syncing
                    ? '반응을 저장하고 질문을 준비하는 중…'
                    : '확인하고 다음 질문으로'}
              </button>
            </>
          )}

          <button
            type="button"
            onClick={exit}
            disabled={saving || syncing}
            className={`${secondaryBtn} mt-3 w-full`}
          >
            나중에 이어하기
          </button>
        </section>
      </div>
    </div>
  );
};

export default QuestionWithPresentation;