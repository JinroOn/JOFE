import axios from 'axios';
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';

import api from '../../../../api/axios';
import { getExplorationMajorProfile } from '../../../../api/exploration';

import type {
  ExplorationMajorCard,
  ExplorationMajorProfile,
} from '../../../../types/exploration';

interface MajorDetailDialogProps {
  major: ExplorationMajorCard;
  groupName: string;
  picked: boolean;
  compareFull: boolean;
  compareMax: number;
  onToggleCompare: () => void;
  onClose: () => void;
}

interface ExplanationContextValue {
  resultId: number;
  enabled: boolean;
}

const ExplanationContext =
  createContext<ExplanationContextValue | null>(null);

export const MajorExplanationProvider = ({
  children,
  resultId,
  enabled,
}: ExplanationContextValue & {
  children: ReactNode;
}) => (
  <ExplanationContext.Provider
    value={{ resultId, enabled }}
  >
    {children}
  </ExplanationContext.Provider>
);

type ExplanationStatus =
  | 'NOT_REQUESTED'
  | 'GENERATING'
  | 'READY'
  | 'INSUFFICIENT_EVIDENCE'
  | 'FAILED'
  | 'UNAVAILABLE';

interface ExplanationConnection {
  kind: string;
  question: string;
  answer: string;
  connection: string;
}

interface MajorExplanationResponse {
  majorCode: string;
  status: ExplanationStatus;
  connections?: ExplanationConnection[];

  // 신규 JOBE API에서 제공하는 재시도 가능 여부.
  // 구버전 서버에서는 없을 수 있으므로 선택 필드로 둡니다.
  retryAvailable?: boolean;
}

const isExplanationResponse = (
  value: unknown,
  majorCode: string,
): value is MajorExplanationResponse => {
  if (
    typeof value !== 'object' ||
    value === null
  ) {
    return false;
  }

  const data = value as Record<string, unknown>;

  return (
    data.majorCode === majorCode &&
    (
      data.status === 'NOT_REQUESTED' ||
      data.status === 'GENERATING' ||
      data.status === 'READY' ||
      data.status === 'INSUFFICIENT_EVIDENCE' ||
      data.status === 'FAILED' ||
      data.status === 'UNAVAILABLE'
    )
  );
};

const isEvidenceUnavailable = (
  error: unknown,
): boolean => {
  if (
    !axios.isAxiosError(error) ||
    error.response?.status !== 422
  ) {
    return false;
  }

  const data: unknown = error.response.data;

  return (
    typeof data === 'object' &&
    data !== null &&
    'code' in data &&
    data.code ===
      'EXPLANATION_ANSWER_EVIDENCE_UNAVAILABLE'
  );
};

const KIND_LABEL: Record<string, string> = {
  INTEREST: '관심',
  ACTIVITY: '활동',
  LEARNING: '학습',
};

const EXPLANATION_MESSAGE: Partial<
  Record<ExplanationStatus, string>
> = {
  INSUFFICIENT_EVIDENCE:
    '이 전공과 연결할 수 있는 응답 근거가 충분하지 않아요. 위의 기존 응답 요약은 계속 확인할 수 있어요.',

  FAILED:
    'AI 설명을 생성하지 못했어요. 기존 응답 요약과 전공 정보는 계속 확인할 수 있어요.',

  UNAVAILABLE:
    '현재 AI 설명을 제공할 수 없어요. 기존 응답 요약과 전공 정보는 그대로 이용할 수 있어요.',
};

// --------------------------------------------------
// 전공별 AI 설명
//
// GET  /explanation
// POST /explanation
// POST /explanation/retry
//
// resultId는 진단 결과 ID이며 sessionId가 아닙니다.
// --------------------------------------------------

const ActiveMajorExplanation = ({
  resultId,
  majorCode,
}: {
  resultId: number;
  majorCode: string;
}) => {
  const [data, setData] =
    useState<MajorExplanationResponse | null>(null);

  const [checking, setChecking] =
    useState(true);

  const [readError, setReadError] =
    useState(false);

  const [requesting, setRequesting] =
    useState(false);

  const [revision, setRevision] =
    useState(0);

  // 같은 상세창에서 재시도 POST를 한 번만 시도합니다.
  const [retryAttempted, setRetryAttempted] =
    useState(false);

  const requestInFlight = useRef(false);

  const postController =
    useRef<AbortController | null>(null);

  const mounted = useRef(false);

  // axios baseURL에 /api가 포함되어 있으므로
  // 이 경로에는 /api를 다시 붙이지 않습니다.
  const endpoint =
    `/exploration/v1/results/${resultId}` +
    `/majors/${encodeURIComponent(majorCode)}/explanation`;

  const retryEndpoint = `${endpoint}/retry`;

  // 상세창을 닫으면 진행 중인 요청을 중단합니다.
  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
      postController.current?.abort();
    };
  }, []);

  // --------------------------------------------------
  // GET: 최초 조회 및 생성 상태 확인
  // --------------------------------------------------

  useEffect(() => {
    let active = true;

    let timer: ReturnType<typeof setTimeout> | null =
      null;

    const controller = new AbortController();

    const check = async () => {
      try {
        const response =
          await api.get<MajorExplanationResponse>(
            endpoint,
            {
              signal: controller.signal,
            },
          );

        if (!active) return;

        if (
          !isExplanationResponse(
            response.data,
            majorCode,
          )
        ) {
          setReadError(true);
          setChecking(false);
          return;
        }

        setData(response.data);
        setReadError(false);
        setChecking(false);

        // 생성 중일 때만 GET으로 상태를 조회합니다.
        // 재시도 POST를 반복하지 않습니다.
        if (
          response.data.status === 'GENERATING'
        ) {
          timer = setTimeout(
            () => void check(),
            3000,
          );
        }
      } catch (error) {
        if (
          !active ||
          axios.isCancel(error)
        ) {
          return;
        }

        setChecking(false);

        if (isEvidenceUnavailable(error)) {
          setData({
            majorCode,
            status: 'INSUFFICIENT_EVIDENCE',
          });

          setReadError(false);
        } else {
          setReadError(true);
        }
      }
    };

    void check();

    return () => {
      active = false;

      if (timer !== null) {
        clearTimeout(timer);
      }

      controller.abort();
    };
  }, [endpoint, majorCode, revision]);

  // --------------------------------------------------
  // 최초 AI 설명 생성 요청
  // NOT_REQUESTED에서만 사용합니다.
  // --------------------------------------------------

  const requestExplanation = async () => {
    if (
      requestInFlight.current ||
      requesting ||
      data?.status !== 'NOT_REQUESTED'
    ) {
      return;
    }

    requestInFlight.current = true;
    setRequesting(true);

    const controller = new AbortController();
    postController.current = controller;

    try {
      const response =
        await api.post<MajorExplanationResponse>(
          endpoint,
          undefined,
          {
            signal: controller.signal,
          },
        );

      if (!mounted.current) return;

      if (
        !isExplanationResponse(
          response.data,
          majorCode,
        )
      ) {
        setReadError(true);
        return;
      }

      setData(response.data);
      setReadError(false);

      if (
        response.data.status === 'GENERATING'
      ) {
        // 이후에는 GET으로만 상태를 확인합니다.
        setRevision(
          (previous) => previous + 1,
        );
      }
    } catch (error) {
      if (
        !mounted.current ||
        axios.isCancel(error)
      ) {
        return;
      }

      if (isEvidenceUnavailable(error)) {
        setData({
          majorCode,
          status: 'INSUFFICIENT_EVIDENCE',
        });

        setReadError(false);
      } else {
        // 요청 성공 여부를 모를 때는
        // 중복 POST 대신 GET 재확인만 허용합니다.
        setReadError(true);
      }
    } finally {
      requestInFlight.current = false;
      postController.current = null;

      if (mounted.current) {
        setRequesting(false);
      }
    }
  };

  // --------------------------------------------------
  // 신규 기능: FAILED 설명 재시도
  //
  // FAILED + retryAvailable === true 조건에서만 호출
  // POST 본문 없음
  // --------------------------------------------------

  const retryExplanation = async () => {
    if (
      requestInFlight.current ||
      requesting ||
      retryAttempted ||
      data?.status !== 'FAILED' ||
      data.retryAvailable !== true
    ) {
      return;
    }

    // 더블클릭이나 상태 갱신에 따른 중복 호출 방지
    requestInFlight.current = true;

    setRetryAttempted(true);
    setRequesting(true);
    setReadError(false);

    const controller = new AbortController();
    postController.current = controller;

    try {
      const response =
        await api.post<MajorExplanationResponse>(
          retryEndpoint,
          undefined,
          {
            signal: controller.signal,
          },
        );

      if (!mounted.current) return;

      if (
        !isExplanationResponse(
          response.data,
          majorCode,
        )
      ) {
        setReadError(true);
        return;
      }

      setData(response.data);
      setReadError(false);

      if (
        response.data.status === 'GENERATING'
      ) {
        // 202 GENERATING 이후에는
        // 기존 GET 상태 조회 흐름을 다시 시작합니다.
        setRevision(
          (previous) => previous + 1,
        );
      }

      // READY이면 저장된 설명을 바로 표시합니다.
      // FAILED이면 기존 실패 안내를 유지합니다.
      // 실패 후 재시도 버튼은 다시 보여주지 않습니다.
    } catch (error) {
      if (
        !mounted.current ||
        axios.isCancel(error)
      ) {
        return;
      }

      if (isEvidenceUnavailable(error)) {
        setData({
          majorCode,
          status: 'INSUFFICIENT_EVIDENCE',
        });

        setReadError(false);
      } else {
        // 서버에서 재시도가 접수됐는지 알 수 없는 경우
        // POST를 다시 보내지 않고 GET으로 상태를 확인합니다.
        setReadError(true);
      }
    } finally {
      requestInFlight.current = false;
      postController.current = null;

      if (mounted.current) {
        setRequesting(false);
      }
    }
  };

  // --------------------------------------------------
  // READY 응답의 AI 설명
  // --------------------------------------------------

  const connections =
    data?.status === 'READY' &&
    Array.isArray(data.connections)
      ? data.connections.filter(
          (item) =>
            item !== null &&
            typeof item === 'object' &&
            typeof item.connection === 'string' &&
            item.connection.trim().length > 0,
        )
      : [];

  // 백엔드의 명시적인 true일 때만 재시도 허용
  const canRetryExplanation =
    !readError &&
    !retryAttempted &&
    data?.status === 'FAILED' &&
    data.retryAvailable === true;

  return (
    <div className="mt-4 min-w-0 border-t border-secondary/20 pt-4">
      <h4 className="mb-2 text-sm font-bold text-primary-container">
        AI로 살펴보는 나의 응답과 전공의 연결
      </h4>

      <p className="mb-3 text-xs text-on-surface-variant leading-relaxed">
        실제 검사 응답을 바탕으로 전공에서 살펴볼
        학습 내용을 연결해 설명해요.
        진단 결과나 전공 순위가 바뀌지는 않아요.
      </p>

      {/* 저장된 AI 설명 상태 확인 */}
      {checking && !data && !readError && (
        <p
          role="status"
          className="text-sm text-on-surface-variant"
        >
          저장된 AI 설명을 확인하고 있어요…
        </p>
      )}

      {/* 네트워크 또는 상태 조회 오류 */}
      {readError && (
        <div
          role="alert"
          className="rounded-lg bg-surface-container-low p-3 text-sm text-on-surface-variant"
        >
          <p>
            AI 설명의 현재 상태를 확인하지 못했어요.
          </p>

          <button
            type="button"
            className="mt-2 min-h-[44px] font-semibold text-secondary underline underline-offset-2"
            onClick={() => {
              setReadError(false);
              setData(null);
              setChecking(true);

              // POST가 아니라 GET을 다시 실행합니다.
              setRevision(
                (previous) => previous + 1,
              );
            }}
          >
            상태 다시 확인
          </button>
        </div>
      )}

      {/* 설명 최초 생성 */}
      {!readError &&
        data?.status === 'NOT_REQUESTED' && (
          <button
            type="button"
            disabled={requesting}
            onClick={() =>
              void requestExplanation()
            }
            className="min-h-[44px] w-full sm:w-auto rounded-lg bg-secondary px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {requesting
              ? 'AI 설명을 요청하고 있어요…'
              : 'AI로 내 응답과 전공의 연결 보기'}
          </button>
        )}

      {/* 설명 생성 중 */}
      {!readError &&
        data?.status === 'GENERATING' && (
          <p
            role="status"
            aria-live="polite"
            className="rounded-lg bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant"
          >
            AI 설명을 만들고 있어요.
            완료되면 이곳에 표시됩니다.
          </p>
        )}

      {/* READY: AI 설명 및 실제 문항·답변 */}
      {!readError &&
        data?.status === 'READY' &&
        (
          connections.length === 0 ? (
            <p className="text-sm text-on-surface-variant">
              저장된 설명에 표시할 연결 내용이 없어요.
            </p>
          ) : (
            <ol className="space-y-3">
              {connections.map((item, index) => (
                <li
                  key={`${majorCode}-${index}`}
                  className="min-w-0 rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-3 sm:p-4"
                >
                  <p className="mb-2 text-xs font-bold text-secondary">
                    {KIND_LABEL[item.kind] ?? '응답'}
                  </p>

                  <p className="text-sm text-primary-container leading-relaxed whitespace-pre-line break-words">
                    {item.connection}
                  </p>

                  <details className="mt-3 rounded-lg bg-surface-container-low px-3 py-2">
                    <summary className="min-h-[44px] flex cursor-pointer items-center text-sm font-semibold text-secondary">
                      사용한 응답 보기
                    </summary>

                    <dl className="space-y-3 border-t border-outline-variant/20 pt-3 pb-2">
                      <div>
                        <dt className="text-xs font-bold text-primary-container">
                          실제 진단 문항
                        </dt>

                        <dd className="mt-1 text-sm text-on-surface-variant leading-relaxed whitespace-pre-line break-words">
                          {item.question}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-xs font-bold text-primary-container">
                          내가 선택한 답변
                        </dt>

                        <dd className="mt-1 text-sm text-on-surface-variant leading-relaxed whitespace-pre-line break-words">
                          {item.answer}
                        </dd>
                      </div>
                    </dl>
                  </details>
                </li>
              ))}
            </ol>
          )
        )}

      {/* FAILED / 근거 부족 / 사용 불가 안내 */}
      {!readError &&
        data &&
        EXPLANATION_MESSAGE[data.status] && (
          <div
            role="status"
            className="rounded-lg bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant leading-relaxed"
          >
            <p>
              {EXPLANATION_MESSAGE[data.status]}
            </p>

            {/* 신규 기능: 재시도 가능한 FAILED만 표시 */}
            {canRetryExplanation && (
              <button
                type="button"
                disabled={requesting}
                onClick={() =>
                  void retryExplanation()
                }
                className="mt-3 min-h-[44px] w-full sm:w-auto rounded-lg bg-secondary px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {requesting
                  ? '다시 요청하는 중…'
                  : '다시 시도'}
              </button>
            )}

            {requesting &&
              data.status === 'FAILED' &&
              retryAttempted && (
                <p className="mt-2 text-xs text-on-surface-variant">
                  AI 설명을 다시 요청하고 있어요…
                </p>
              )}
          </div>
        )}
    </div>
  );
};

// --------------------------------------------------
// 결과·전공별 설명 상태 분리
// --------------------------------------------------

const MajorExplanationSection = ({
  majorCode,
}: {
  majorCode: string;
}) => {
  const context = useContext(ExplanationContext);

  if (!context?.enabled) {
    return null;
  }

  return (
    <ActiveMajorExplanation
      key={`${context.resultId}:${majorCode}`}
      resultId={context.resultId}
      majorCode={majorCode}
    />
  );
};

// --------------------------------------------------
// 기존 전공 상세창
// --------------------------------------------------

const MajorDetailDialog = ({
  major,
  groupName,
  picked,
  compareFull,
  compareMax,
  onToggleCompare,
  onClose,
}: MajorDetailDialogProps) => {
  const ref = useRef<HTMLDialogElement>(null);

  const [profile, setProfile] =
    useState<ExplorationMajorProfile | null>(null);

  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const dialog = ref.current;

    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  useEffect(() => {
    let alive = true;

    getExplorationMajorProfile(major.majorCode)
      .then((res) => {
        if (!alive) return;

        setProfile(res);
        setFailed(false);
      })
      .catch(() => {
        if (alive) {
          setFailed(true);
        }
      });

    return () => {
      alive = false;
    };
  }, [major.majorCode, attempt]);

  const titleId =
    `major-detail-${major.majorCode}`;

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) {
          ref.current?.close();
        }
      }}
      className="w-[min(640px,calc(100vw-32px))] max-h-[calc(100vh-48px)] overflow-y-auto rounded-brand bg-surface-container-lowest p-0 text-on-surface backdrop:bg-black/40"
    >
      {/* 상세창 상단 */}
      <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-outline-variant/20 bg-surface-container-lowest px-5 py-4 sm:px-6">
        <div>
          <p className="text-xs text-on-surface-variant">
            {groupName}
            {profile?.category &&
              ` · ${profile.category}`}
          </p>

          <h2
            id={titleId}
            className="text-xl font-bold text-primary-container"
          >
            {major.name}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => ref.current?.close()}
          aria-label="닫기"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low"
        >
          <span
            className="material-symbols-outlined"
            aria-hidden="true"
          >
            close
          </span>
        </button>
      </div>

      {/* 상세창 본문 */}
      <div className="space-y-6 px-5 py-5 sm:px-6">
        <section
          aria-labelledby={`${titleId}-mine`}
          className="rounded-lg bg-secondary-container/10 p-4"
        >
          <h3
            id={`${titleId}-mine`}
            className="mb-2 text-sm font-bold text-secondary"
          >
            내 응답에서 나타난 점
          </h3>

          {/* 기존 관심·활동·학습 요약 유지 */}
          <ul className="list-disc pl-4 space-y-1 text-sm text-on-surface-variant">
            {major.reasons.map((r) => (
              <li key={`${r.kind}-${r.reasonCode}`}>
                {r.text}
              </li>
            ))}
          </ul>

          {/* AI 설명과 재시도 기능 */}
          <MajorExplanationSection
            majorCode={major.majorCode}
          />
        </section>

        {/* 전공 프로필 조회 실패 */}
        {failed && (
          <div
            role="alert"
            className="rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container"
          >
            전공 정보를 불러오지 못했어요.{' '}

            <button
              type="button"
              onClick={() =>
                setAttempt((n) => n + 1)
              }
              className="font-bold underline"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* 전공 프로필 로딩 */}
        {!failed && !profile && (
          <p
            role="status"
            className="text-sm text-on-surface-variant"
          >
            전공 정보를 불러오는 중이에요…
          </p>
        )}

        {/* 기존 전공 정보 */}
        {profile && (
          <>
            {profile.description && (
              <section
                aria-labelledby={`${titleId}-about`}
              >
                <h3
                  id={`${titleId}-about`}
                  className="mb-1 text-sm font-bold text-primary-container"
                >
                  어떤 전공인가요
                </h3>

                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {profile.description}
                </p>
              </section>
            )}

            {profile.keywords.length > 0 && (
              <section
                aria-labelledby={`${titleId}-kw`}
              >
                <h3
                  id={`${titleId}-kw`}
                  className="mb-2 text-sm font-bold text-primary-container"
                >
                  핵심 키워드
                </h3>

                <ul className="flex flex-wrap gap-1.5">
                  {profile.keywords.map((k) => (
                    <li
                      key={k}
                      className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-semibold text-primary-container"
                    >
                      {k}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {profile.bestFor && (
              <section
                aria-labelledby={`${titleId}-for`}
              >
                <h3
                  id={`${titleId}-for`}
                  className="mb-1 text-sm font-bold text-primary-container"
                >
                  이런 학생이 먼저 살펴보면 좋아요
                </h3>

                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {profile.bestFor}
                </p>
              </section>
            )}

            {(profile.comparisonNote ||
              profile.lessCentral.length > 0) && (
              <section
                aria-labelledby={`${titleId}-diff`}
              >
                <h3
                  id={`${titleId}-diff`}
                  className="mb-1 text-sm font-bold text-primary-container"
                >
                  비슷한 전공과의 차이
                </h3>

                {profile.comparisonNote && (
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    {profile.comparisonNote}
                  </p>
                )}

                {profile.lessCentral.length > 0 && (
                  <p className="mt-2 text-xs text-on-surface-variant">
                    <span className="font-semibold text-primary-container">
                      상대적으로 덜 다루는 것 ·{' '}
                    </span>
                    {profile.lessCentral.join(', ')}
                  </p>
                )}
              </section>
            )}

            {profile.relatedCareers.length > 0 && (
              <section
                aria-labelledby={`${titleId}-career`}
              >
                <h3
                  id={`${titleId}-career`}
                  className="mb-2 text-sm font-bold text-primary-container"
                >
                  관련 진로 예시
                </h3>

                <ul className="flex flex-wrap gap-1.5">
                  {profile.relatedCareers.map((c) => (
                    <li
                      key={c}
                      className="rounded-lg border border-outline-variant/30 px-3 py-1 text-xs text-on-surface-variant"
                    >
                      {c}
                    </li>
                  ))}
                </ul>

                <p className="mt-2 text-[11px] text-on-surface-variant">
                  진로는 예시일 뿐, 이 전공을 고르면
                  이렇게 된다는 뜻은 아니에요.
                </p>
              </section>
            )}

            <p className="text-[11px] text-outline">
              전공 정보 출처: 등록된 전공 프로필
              ({profile.profileVersion})
            </p>
          </>
        )}
      </div>

      {/* 기존 전공 비교 버튼 */}
      <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-outline-variant/20 bg-surface-container-lowest px-5 py-3 sm:px-6">
        <button
          type="button"
          aria-pressed={picked}
          disabled={compareFull}
          onClick={onToggleCompare}
          className={`min-h-[44px] rounded-lg px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
            picked
              ? 'bg-secondary text-white'
              : 'bg-surface-container-low text-secondary'
          }`}
        >
          {picked
            ? '비교에 담음'
            : compareFull
              ? `비교는 최대 ${compareMax}개`
              : '비교에 담기'}
        </button>

        <button
          type="button"
          onClick={() => ref.current?.close()}
          className="min-h-[44px] rounded-lg bg-primary-container px-5 text-sm font-bold text-white"
        >
          닫기
        </button>
      </div>
    </dialog>
  );
};

export default MajorDetailDialog;