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
import type { ExplorationSessionDetail } from '../../../types/exploration';
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

const primaryBtn =
  'min-h-[44px] rounded-lg bg-primary-container px-6 py-3 font-bold text-white disabled:opacity-50';

const secondaryBtn =
  'min-h-[44px] rounded-lg border border-outline-variant px-5 py-3 font-semibold text-primary-container bg-surface-container-lowest';

// 서버가 실제로 제시한 후보 코드와 체크포인트만 사용합니다.
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

  // 응답을 받지 못한 요청은 동일한 키와 본문으로 재시도합니다.
  const pendingRequest = useRef<PendingRequest | null>(
    null,
  );

  // 상태 업데이트 이전에 발생하는 연속 클릭도 차단합니다.
  const submittingRef = useRef(false);

  const validId = Number.isSafeInteger(id) && id > 0;

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

  useEffect(() => {
    if (!stageTwo || revision === null) {
      return;
    }

    let active = true;

    void getExplorationSession(id)
      .then((detail: ExplorationSessionDetail) => {
        if (!active) return;

        // 다른 창에서 회차가 먼저 변경되었을 수 있습니다.
        if (detail.session.revision !== revision) {
          setProbe({
            sessionId: id,
            revision,
            kind: 'STALE',
          });
          return;
        }

        const response = detail as ExplorationSessionDetail & {
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
  }, [id, stageTwo, revision, refreshVersion]);

  // 1단계·3단계 및 Mock 모드는 기존 질문 화면을 그대로 사용합니다.
  if (!stageTwo || revision === null) {
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

  // 이미 반응을 제출한 체크포인트는 중복 입력받지 않습니다.
  if (
    checkpoint?.presentation.source === 'USER_REPORTED'
  ) {
    return <ExplorationQuestion />;
  }

  const selected: Selection =
    checkpoint &&
    selection?.checkpointId === checkpoint.checkpointId
      ? selection
      : {
          checkpointId: checkpoint?.checkpointId ?? 0,
          unexpected: [],
          unfamiliar: [],
        };

  const exit = () =>
    navigate('/diagnosis/exploration');

  const syncLatest = async () => {
    if (syncing || saving) return;

    pendingRequest.current = null;
    setSyncing(true);
    setError(null);

    try {
      await reloadLatest();
    } finally {
      setRefreshVersion((previous) => previous + 1);
      setSyncing(false);
    }
  };

  const toggle = (
    kind: 'unexpected' | 'unfamiliar',
    majorCode: string,
  ) => {
    if (!checkpoint || saving || syncing) return;

    const allowed = new Set(
      checkpoint.presentation.shownMajorCodes,
    );

    if (!allowed.has(majorCode)) return;

    // 선택이 달라지면 이전 실패 요청의 멱등 키는 사용하지 않습니다.
    pendingRequest.current = null;
    setError(null);

    setSelection((previous) => {
      const base: Selection =
        previous?.checkpointId === checkpoint.checkpointId
          ? previous
          : {
              checkpointId: checkpoint.checkpointId,
              unexpected: [],
              unfamiliar: [],
            };

      const existing = base[kind];

      const next = existing.includes(majorCode)
        ? existing.filter((code) => code !== majorCode)
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
    if (
      !checkpoint ||
      saving ||
      syncing ||
      submittingRef.current
    ) {
      return;
    }

    const latest = useExplorationStore.getState().session;

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
      previous.checkpointId === checkpoint.checkpointId &&
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
            checkpointId: checkpoint.checkpointId,
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
          expectedRevision: request.expectedRevision,
          checkpointId: request.checkpointId,
          unexpected: request.unexpected,
          unfamiliar: request.unfamiliar,
        },
        {
          headers: {
            'Idempotency-Key': request.key,
          },
        },
      );

      // 서버에 반영된 뒤 최신 revision과 조건부 질문을 다시 조회합니다.
      pendingRequest.current = null;

      await reloadLatest();

      setRefreshVersion(
        (previousVersion) => previousVersion + 1,
      );
    } catch (caught) {
      const status = axios.isAxiosError(caught)
        ? caught.response?.status
        : undefined;

      if (status === 409 || status === 422) {
        // revision 충돌 또는 유효하지 않은 후보.
        // 오래된 요청을 버리고 Zustand까지 최신화합니다.
        pendingRequest.current = null;

        setError(
          '검사 정보가 변경되었습니다. 최신 후보를 다시 확인해주세요.',
        );

        setSyncing(true);

        try {
          await reloadLatest();
        } finally {
          setRefreshVersion(
            (previousVersion) => previousVersion + 1,
          );
          setSyncing(false);
        }
      } else {
        // 응답 유실 가능성이 있으므로 동일한 키로 재시도할 수 있습니다.
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
      <div className="max-w-[760px] w-full mx-auto px-4 sm:px-8 pt-8 pb-24">
        <div className="mb-8">
          <StageStepper stage={2} />
        </div>

        <section className="rounded-brand bg-surface-container-lowest border border-outline-variant/20 p-6 sm:p-10 cloud-shadow">
          <p className="text-xs font-bold text-secondary mb-3">
            2단계 · 후보 확인
          </p>

          <h1 className="text-xl sm:text-2xl font-bold text-primary-container mb-4">
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
              <p className="text-sm text-on-surface-variant mb-5">
                {current.kind === 'STALE'
                  ? '다른 창에서 검사 정보가 변경되었어요. 최신 상태를 불러와 주세요.'
                  : '후보 정보를 불러오지 못했어요. 다시 확인해주세요.'}
              </p>

              <button
                type="button"
                className={primaryBtn}
                disabled={syncing}
                onClick={() => {
                  void syncLatest();
                }}
              >
                {syncing
                  ? '최신 상태 확인 중…'
                  : '최신 상태 불러오기'}
              </button>
            </div>
          )}

          {checkpoint && (
            <>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                예상과 달랐던 전공이나 아직 낯선 전공을
                선택할 수 있어요.
                선택하지 않고 넘어가도 괜찮습니다.
                이 반응은 후보 점수나 추천 순위를 변경하지 않습니다.
              </p>

              {checkpoint.shownCandidates.length === 0 ? (
                <p className="rounded-xl bg-surface-container-low p-5 text-sm text-on-surface-variant mb-6">
                  현재 제시된 후보가 없습니다.
                  확인 후 다음 질문을 진행할 수 있어요.
                </p>
              ) : (
                <div className="space-y-3 mb-6">
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
                          <h2 className="font-bold text-primary-container mb-3">
                            {major.majorName}
                          </h2>

                          <div className="flex flex-wrap gap-4">
                            <label className="inline-flex min-h-[44px] items-center gap-2 text-sm text-on-surface-variant cursor-pointer">
                              <input
                                type="checkbox"
                                checked={unexpected}
                                disabled={saving || syncing}
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

                            <label className="inline-flex min-h-[44px] items-center gap-2 text-sm text-on-surface-variant cursor-pointer">
                              <input
                                type="checkbox"
                                checked={unfamiliar}
                                disabled={saving || syncing}
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

              <p className="text-xs text-on-surface-variant mb-5">
                예상과 다른 후보 {selected.unexpected.length}개
                {' · '}
                낯선 후보 {selected.unfamiliar.length}개
              </p>

              {error && (
                <p
                  role="alert"
                  className="mb-4 text-sm font-medium text-error"
                >
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={() => {
                  void submit();
                }}
                disabled={saving || syncing}
                className={`${primaryBtn} w-full`}
              >
                {saving || syncing
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
