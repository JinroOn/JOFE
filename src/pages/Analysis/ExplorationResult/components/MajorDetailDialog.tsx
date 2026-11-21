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

// 결과 화면의 resultId를 모든 상세창에 전달합니다.
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
  <ExplanationContext.Provider value={{ resultId, enabled }}>
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

// 백엔드에서 응답 근거 부족을 422로 반환하는 경우
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

// 실제 API와 통신하는 전공별 AI 설명 컴포넌트
const ActiveMajorExplanation = ({
  resultId,
  majorCode,
}: {
  resultId: number;
  majorCode: string;
}) => {
  const [data, setData] =
    useState<MajorExplanationResponse | null>(null);
  const [checking, setChecking] = useState(true);
  const [readError, setReadError] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [revision, setRevision] = useState(0);

  const requestInFlight = useRef(false);
  const postController = useRef<AbortController | null>(null);
  const mounted = useRef(false);

  // api의 baseURL에 이미 /api가 포함되어 있습니다.
  const endpoint =
    `/exploration/v1/results/${resultId}` +
    `/majors/${encodeURIComponent(majorCode)}/explanation`;

  // 상세창을 닫으면 진행 중인 POST의 응답도 무시합니다.
  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
      postController.current?.abort();
    };
  }, []);

  // 최초 진입 시 GET으로 상태 조회
  // GENERATING일 때만 3초 간격으로 추가 GET 수행
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
            { signal: controller.signal },
          );

        if (!active) return;

        // 다른 전공의 설명이 섞이지 않도록 확인
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

        if (response.data.status === 'GENERATING') {
          timer = setTimeout(
            () => void check(),
            3000,
          );
        }
      } catch (error) {
        if (!active || axios.isCancel(error)) {
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

  // 사용자가 명시적으로 버튼을 눌렀을 때만 생성 요청
  const requestExplanation = async () => {
    if (
      requestInFlight.current ||
      requesting ||
      data?.status !== 'NOT_REQUESTED'
    ) {
      return;
    }

    // 더블클릭 등으로 인한 중복 POST 방지
    requestInFlight.current = true;
    setRequesting(true);

    const controller = new AbortController();
    postController.current = controller;

    try {
      // POST 본문 없음
      const response =
        await api.post<MajorExplanationResponse>(
          endpoint,
          undefined,
          { signal: controller.signal },
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

      if (response.data.status === 'GENERATING') {
        // 이후에는 재생성 POST가 아니라 GET으로 확인
        setRevision((previous) => previous + 1);
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
        // 요청 실패 원인을 확신할 수 없을 때는
        // 중복 POST 대신 GET 상태 확인만 허용
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

      {/* 최초 저장 상태 확인 */}
      {checking && !data && !readError && (
        <p
          role="status"
          className="text-sm text-on-surface-variant"
        >
          저장된 AI 설명을 확인하고 있어요…
        </p>
      )}

      {/* GET / POST 네트워크 오류 */}
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
              setRevision(
                (previous) => previous + 1,
              );
            }}
          >
            상태 다시 확인
          </button>
        </div>
      )}

      {/* NOT_REQUESTED: 명시적으로 생성 요청 */}
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

      {/* GENERATING: 생성 중에는 버튼 제거 */}
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

      {/* READY: 저장된 AI 설명과 실제 문항·답변 */}
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

                  {/* AI가 작성한 연결 설명 */}
                  <p className="text-sm text-primary-container leading-relaxed whitespace-pre-line break-words">
                    {item.connection}
                  </p>

                  {/* 실제 문항·답변은 요청 시 펼쳐서 확인 */}
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

      {/* 최종 실패 상태: 재생성 버튼 없음 */}
      {!readError &&
        data &&
        EXPLANATION_MESSAGE[data.status] && (
          <p
            role="status"
            className="rounded-lg bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant leading-relaxed"
          >
            {EXPLANATION_MESSAGE[data.status]}
          </p>
        )}
    </div>
  );
};

// 선택한 결과·전공마다 AI 설명 상태를 별도로 관리합니다.
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

// 기존 전공 상세창
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
        if (alive) setFailed(true);
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

          {/* 기존 관심·활동·학습 응답 요약 유지 */}
          <ul className="list-disc pl-4 space-y-1 text-sm text-on-surface-variant">
            {major.reasons.map((r) => (
              <li key={`${r.kind}-${r.reasonCode}`}>
                {r.text}
              </li>
            ))}
          </ul>

          {/* 새 기능: 전공별 AI 설명 */}
          <MajorExplanationSection
            majorCode={major.majorCode}
          />
        </section>

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

        {!failed && !profile && (
          <p
            role="status"
            className="text-sm text-on-surface-variant"
          >
            전공 정보를 불러오는 중이에요…
          </p>
        )}

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

      {/* 기존 전공 비교 버튼 유지 */}
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