import { useEffect, useRef, useState } from 'react';
import type {
  FormEvent,
  KeyboardEvent,
  ReactNode,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  askExplorationConsultation,
  cancelExplorationConsultationMessage,
  createMutationId,
  openExplorationConsultation,
  toExplorationErrorCode,
} from '../../../api/exploration';
import { isExplorationMock } from '../../../config/features';
import useExplorationResult from '../../../hooks/useExplorationResult';
import type {
  ExplorationChatMessage,
  ExplorationErrorCode,
  ExplorationResult,
} from '../../../types/exploration';
import MockBanner from '../../Diagnosis/Exploration/components/MockBanner';
import AssistantMessage from './components/AssistantMessage';

const MAX_LENGTH = 500;

const Shell = ({
  children,
}: {
  children: ReactNode;
}) => (
  <div className="min-h-screen bg-surface">
    <div className="max-w-[880px] w-full mx-auto px-4 sm:px-8 pt-8 pb-24">
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

const suggestionsFor = (result: ExplorationResult) => {
  const majors = result.groups
    .flatMap((group) => group.majors)
    .filter((major) => !major.collapsed);

  const list = [
    '이 전공군들이 왜 나왔는지 설명해줘',
  ];

  if (majors.length >= 2) {
    list.push(
      `${majors[0].name}와 ${majors[1].name}의 차이를 알려줘`,
    );
  }

  list.push(
    '추천 활동은 무엇을 알아보려는 거야?',
  );

  return list;
};

interface PendingQuestion {
  content: string;
  id: string;
  retryKey?: string;
}

const sendErrorMessage = (
  code: ExplorationErrorCode,
) => {
  switch (code) {
    case 'CONSULTATION_GENERATION_UNAVAILABLE':
      return '지금은 AI 답변을 만들 수 없어요. 질문은 그대로 남아 있어요. 잠시 후 다시 보내보세요.';

    case 'CONSULTATION_BUSY':
      return '앞선 질문의 답변을 아직 만들고 있어요. 잠시 후 다시 보내주세요.';

    case 'NETWORK':
      return '인터넷 연결이 끊겨 답변을 받지 못했어요. 질문은 그대로 남아 있어요.';

    default:
      return '답변을 받지 못했어요. 질문은 그대로 남아 있어요.';
  }
};

// 접근 권한이 없는 결과는 사용자에게 노출하지 않습니다.
const isInaccessibleResult = (error: unknown): boolean => {
  if (
    typeof error !== 'object' ||
    error === null ||
    !('response' in error)
  ) {
    return false;
  }

  const response = (
    error as {
      response?: {
        status?: number;
      };
    }
  ).response;

  return (
    response?.status === 403 ||
    response?.status === 404
  );
};

const ExplorationAsk = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const id = Number(sessionId);

  const {
    state: resultState,
    retry: retryResult,
  } = useExplorationResult(id);

  // sessionId가 아니라 API 결과의 resultId를 사용합니다.
  const resultId =
    resultState.kind === 'READY'
      ? resultState.result.resultId
      : null;

  const [consultationId, setConsultationId] =
    useState<number | null>(null);

  const [messages, setMessages] =
    useState<ExplorationChatMessage[]>([]);

  const [openError, setOpenError] =
    useState<ExplorationErrorCode | null>(null);

  const [inaccessible, setInaccessible] =
    useState(false);

  const [openAttempt, setOpenAttempt] = useState(0);
  const [draft, setDraft] = useState('');

  const [pending, setPending] =
    useState<PendingQuestion | null>(null);

  const [sending, setSending] = useState(false);

  const [sendError, setSendError] =
    useState<ExplorationErrorCode | null>(null);

  const [cancelling, setCancelling] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // 상담 시작 시 저장된 상태를 가져옵니다.
  useEffect(() => {
    if (resultId === null) return;

    let alive = true;

    openExplorationConsultation(resultId)
      .then((response) => {
        if (!alive) return;

        setConsultationId(response.consultationId);
        setMessages(response.messages);
        setOpenError(null);
        setInaccessible(false);

        const left = response.pendingRequest;

        setPending(
          left
            ? {
                content: left.content,
                id: createMutationId(),
                retryKey: left.retryKey,
              }
            : null,
        );

        setSendError(null);
      })
      .catch((error) => {
        if (!alive) return;

        const code =
          toExplorationErrorCode(error);

        setConsultationId(null);
        setMessages([]);
        setOpenError(code);

        setInaccessible(
          code === 'NOT_FOUND' ||
          isInaccessibleResult(error),
        );
      });

    return () => {
      alive = false;
    };
  }, [resultId, openAttempt]);

  useEffect(() => {
    endRef.current?.scrollIntoView({
      block: 'end',
    });
  }, [messages.length, pending, sending]);

  const send = async (
    question: PendingQuestion,
  ) => {
    if (consultationId === null) return;

    setPending(question);
    setSending(true);
    setSendError(null);

    try {
      const response =
        await askExplorationConsultation(
          consultationId,
          question.content,
          question.id,
        );

      setMessages((previous) => [
        ...previous,
        response.userMessage,
        response.assistantMessage,
      ]);

      setPending(null);
    } catch (error) {
      setSendError(
        toExplorationErrorCode(error),
      );
    } finally {
      setSending(false);
    }
  };

  const cancelLeftQuestion = async (
    question: PendingQuestion,
  ) => {
    if (
      consultationId === null ||
      !question.retryKey ||
      cancelling
    ) {
      return;
    }

    setCancelling(true);

    try {
      await cancelExplorationConsultationMessage(
        consultationId,
        question.retryKey,
      );

      setDraft(question.content);
      setPending(null);
      setSendError(null);
    } catch {
      setOpenAttempt(
        (previous) => previous + 1,
      );
    } finally {
      setCancelling(false);
    }
  };

  const submit = (text: string) => {
    const content = text.trim();

    if (
      !content ||
      sending ||
      consultationId === null
    ) {
      return;
    }

    setDraft('');

    void send({
      content,
      id: createMutationId(),
    });
  };

  const onSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    submit(draft);
  };

  const onKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      submit(draft);
    }
  };

  const backToResult = () =>
    navigate(
      `/analysis/exploration/${id}`,
    );

  const resultNotFound =
    (
      resultState.kind === 'ERROR' &&
      resultState.code === 'NOT_FOUND'
    ) ||
    openError === 'NOT_FOUND' ||
    inaccessible;

  const failed =
    resultState.kind === 'ERROR' ||
    resultState.kind === 'TIMEOUT' ||
    openError !== null;

  const result =
    resultState.kind === 'READY'
      ? resultState.result
      : null;

  return (
    <Shell>
      <header className="mb-6">
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
          결과에 대해 AI에게 묻기
        </h1>

        {result && !resultNotFound && (
          <div className="mt-3 rounded-brand bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant leading-relaxed">
            <p>
              <span className="font-semibold text-primary-container">
                {formatDate(result.createdAt)} 완료한 결과
              </span>
              를 바탕으로 답해요
              {result.groups.length > 0 && (
                <>
                  {' · '}
                  {result.groups
                    .map((group) => group.name)
                    .join(', ')}
                </>
              )}
            </p>

            <p className="text-xs mt-1">
              AI는 점수나 순위를 새로 계산하지 않고,
              합격·취업 가능성이나 능력은 판단하지 않아요.
              질문 문장만 전달되고 검사 답변 원문은
              보내지 않아요.
            </p>
          </div>
        )}
      </header>

      {/* 접근할 수 없는 결과: 재시도 버튼 없음 */}
      {resultNotFound && (
        <div
          role="alert"
          className="rounded-brand bg-surface-container-low px-5 py-5 text-sm text-primary-container mb-6"
        >
          <h2 className="font-bold text-lg mb-2">
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
            className="mt-4 min-h-[44px] px-4 rounded-lg bg-primary-container text-white text-sm font-bold"
          >
            내 진단 이력 보기
          </button>
        </div>
      )}

      {/* 실제 네트워크·상담 오류에는 재시도 허용 */}
      {failed && !resultNotFound && (
        <div
          role="alert"
          className="rounded-brand bg-error-container px-5 py-4 text-sm text-on-error-container mb-6"
        >
          <p className="mb-3">
            상담을 열지 못했어요.
            잠시 후 다시 시도해주세요.
          </p>

          <button
            type="button"
            className="min-h-[44px] px-4 rounded-lg bg-primary-container text-white text-sm font-bold"
            onClick={() => {
              setOpenError(null);
              setInaccessible(false);

              if (resultState.kind !== 'READY') {
                retryResult();
              }

              setOpenAttempt(
                (previous) => previous + 1,
              );
            }}
          >
            다시 시도
          </button>
        </div>
      )}

      {!failed &&
        consultationId === null && (
          <p
            role="status"
            className="text-sm text-on-surface-variant"
          >
            상담을 준비하는 중이에요…
          </p>
        )}

      {/* 상담이 정상적으로 열린 경우 */}
      {result &&
        !failed &&
        consultationId !== null && (
          <>
            <div
              role="log"
              aria-live="polite"
              aria-label="AI와 주고받은 메시지"
              className="space-y-6 mb-6"
            >
              {messages.length === 0 && !pending && (
                <p className="text-sm text-on-surface-variant">
                  결과가 나온 이유, 두 전공의 차이,
                  탐색 활동에 대해 물어볼 수 있어요.
                </p>
              )}

              {messages.map((message) =>
                message.role === 'user' ? (
                  <div
                    key={message.id}
                    className="flex justify-end"
                  >
                    <p className="max-w-[560px] rounded-2xl rounded-br-md bg-primary-container px-5 py-3 text-sm text-white break-words">
                      {message.content}
                    </p>
                  </div>
                ) : (
                  <AssistantMessage
                    key={message.id}
                    message={message}
                  />
                ),
              )}

              {pending && (
                <div className="flex justify-end">
                  <p className="max-w-[560px] rounded-2xl rounded-br-md bg-primary-container/80 px-5 py-3 text-sm text-white break-words">
                    {pending.content}
                  </p>
                </div>
              )}

              {sending && (
                <p
                  role="status"
                  className="text-sm text-on-surface-variant pl-11"
                >
                  답변을 정리하고 있어요…
                </p>
              )}

              {!sending &&
                pending?.retryKey && (
                  <div
                    role="status"
                    className="ml-11 rounded-lg bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant"
                  >
                    <p className="mb-2">
                      이 질문의 답변이 아직 오지 않았어요.
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenAttempt(
                            (previous) => previous + 1,
                          )
                        }
                        className="min-h-[44px] px-4 rounded-lg bg-primary-container text-white text-sm font-bold"
                      >
                        답변 확인하기
                      </button>

                      <button
                        type="button"
                        disabled={cancelling}
                        onClick={() =>
                          void cancelLeftQuestion(pending)
                        }
                        className="min-h-[44px] px-4 rounded-lg border border-outline-variant text-sm font-semibold text-primary-container bg-surface-container-lowest disabled:opacity-50"
                      >
                        질문 취소하고 고쳐 쓰기
                      </button>
                    </div>
                  </div>
                )}

              {sendError &&
                pending &&
                !pending.retryKey && (
                  <div
                    role="alert"
                    className="ml-11 rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container"
                  >
                    <p className="mb-2">
                      {sendErrorMessage(sendError)}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void send(pending)
                        }
                        className="min-h-[44px] px-4 rounded-lg bg-primary-container text-white text-sm font-bold"
                      >
                        다시 보내기
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDraft(pending.content);
                          setPending(null);
                          setSendError(null);
                        }}
                        className="min-h-[44px] px-4 rounded-lg border border-outline-variant text-sm font-semibold text-primary-container bg-surface-container-lowest"
                      >
                        고쳐서 보내기
                      </button>
                    </div>
                  </div>
                )}

              <div ref={endRef} />
            </div>

            {/* 추천 질문 */}
            <div
              className="flex flex-wrap gap-2 mb-3"
              aria-label="추천 질문"
            >
              {suggestionsFor(result).map(
                (question) => (
                  <button
                    key={question}
                    type="button"
                    disabled={
                      sending || pending !== null
                    }
                    onClick={() =>
                      submit(question)
                    }
                    className="min-h-[44px] rounded-full border border-secondary/30 bg-surface-container-lowest px-4 text-sm text-secondary disabled:opacity-50"
                  >
                    {question}
                  </button>
                ),
              )}
            </div>

            {/* 질문 입력 */}
            <form
              onSubmit={onSubmit}
              className="flex items-end gap-2 rounded-brand border border-outline-variant/30 bg-surface-container-lowest p-2"
            >
              <label
                htmlFor="ask-input"
                className="sr-only"
              >
                AI에게 보낼 질문
              </label>

              <textarea
                id="ask-input"
                rows={2}
                maxLength={MAX_LENGTH}
                value={draft}
                onChange={(event) =>
                  setDraft(event.target.value)
                }
                onKeyDown={onKeyDown}
                disabled={pending !== null}
                placeholder="결과에 대해 궁금한 점을 적어주세요"
                className="min-w-0 flex-1 resize-none bg-transparent px-3 py-2 text-sm text-on-surface outline-none placeholder:text-outline"
              />

              <button
                type="submit"
                disabled={
                  !draft.trim() || pending !== null
                }
                aria-label="보내기"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-container text-white disabled:opacity-40"
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  aria-hidden="true"
                >
                  send
                </span>
              </button>
            </form>

            <p className="mt-1 text-right text-[11px] text-outline">
              {draft.length}/{MAX_LENGTH}
              {' · '}
              Enter 보내기, Shift+Enter 줄바꿈
            </p>
          </>
        )}
    </Shell>
  );
};

export default ExplorationAsk;