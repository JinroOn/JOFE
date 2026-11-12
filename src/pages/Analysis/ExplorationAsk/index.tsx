import { useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent, ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  askExplorationConsultation,
  createMutationId,
  openExplorationConsultation,
  toExplorationErrorCode,
} from '../../../api/exploration';
import { isExplorationMock } from '../../../config/features';
import useExplorationResult from '../../../hooks/useExplorationResult';
import type { ExplorationChatMessage, ExplorationErrorCode, ExplorationResult } from '../../../types/exploration';
import MockBanner from '../../Diagnosis/Exploration/components/MockBanner';
import AssistantMessage from './components/AssistantMessage';

const MAX_LENGTH = 500;

const Shell = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-surface">
    <div className="max-w-[880px] w-full mx-auto px-4 sm:px-8 pt-8 pb-24">
      {isExplorationMock && <MockBanner />}
      {children}
    </div>
  </div>
);

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
};

const suggestionsFor = (result: ExplorationResult) => {
  const majors = result.groups.flatMap((g) => g.majors).filter((m) => !m.collapsed);
  const list = ['이 전공군들이 왜 나왔는지 설명해줘'];
  if (majors.length >= 2) list.push(`${majors[0].name}와 ${majors[1].name}의 차이를 알려줘`);
  list.push('추천 활동은 무엇을 알아보려는 거야?');
  return list;
};

interface PendingQuestion {
  content: string;
  id: string;
}

const ExplorationAsk = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const id = Number(sessionId);
  const { state: resultState, retry: retryResult } = useExplorationResult(id);
  const resultId = resultState.kind === 'READY' ? resultState.result.resultId : null;

  const [consultationId, setConsultationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ExplorationChatMessage[]>([]);
  const [openError, setOpenError] = useState<ExplorationErrorCode | null>(null);
  const [openAttempt, setOpenAttempt] = useState(0);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState<PendingQuestion | null>(null);
  const [sending, setSending] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (resultId === null) return;
    let alive = true;
    openExplorationConsultation(resultId)
      .then((res) => {
        if (!alive) return;
        setConsultationId(res.consultationId);
        setMessages(res.messages);
        setOpenError(null);
      })
      .catch((e) => alive && setOpenError(toExplorationErrorCode(e)));
    return () => {
      alive = false;
    };
  }, [resultId, openAttempt]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, pending, sending]);

  // 재시도 시 같은 mutation id를 보내 중복 질문이 쌓이지 않게 한다
  const send = async (question: PendingQuestion) => {
    if (consultationId === null) return;
    setPending(question);
    setSending(true);
    setSendFailed(false);
    try {
      const res = await askExplorationConsultation(consultationId, question.content, question.id);
      setMessages((prev) => [...prev, res.userMessage, res.assistantMessage]);
      setPending(null);
    } catch {
      setSendFailed(true);
    } finally {
      setSending(false);
    }
  };

  const submit = (text: string) => {
    const content = text.trim();
    if (!content || sending || consultationId === null) return;
    setDraft('');
    void send({ content, id: createMutationId() });
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submit(draft);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit(draft);
    }
  };

  const backToResult = () => navigate(`/analysis/exploration/${id}`);
  const failed = resultState.kind === 'ERROR' || resultState.kind === 'TIMEOUT' || openError !== null;
  const result = resultState.kind === 'READY' ? resultState.result : null;

  return (
    <Shell>
      <header className="mb-6">
        <button type="button" onClick={backToResult} className="min-h-[44px] inline-flex items-center gap-1 text-sm font-semibold text-secondary mb-2">
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_back</span>
          결과로 돌아가기
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary-container">결과에 대해 AI에게 묻기</h1>
        {result && (
          <div className="mt-3 rounded-brand bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant leading-relaxed">
            <p>
              <span className="font-semibold text-primary-container">{formatDate(result.createdAt)} 완료한 결과</span>를 바탕으로 답해요
              {result.groups.length > 0 && <> · {result.groups.map((g) => g.name).join(', ')}</>}
            </p>
            <p className="text-xs mt-1">
              AI는 점수나 순위를 새로 계산하지 않고, 합격·취업 가능성이나 능력은 판단하지 않아요. 질문 문장만 전달되고
              검사 답변 원문은 보내지 않아요.
            </p>
          </div>
        )}
      </header>

      {failed && (
        <div role="alert" className="rounded-brand bg-error-container px-5 py-4 text-sm text-on-error-container mb-6">
          <p className="mb-3">상담을 열지 못했어요. 잠시 후 다시 시도해주세요.</p>
          <button
            type="button"
            className="min-h-[44px] px-4 rounded-lg bg-primary-container text-white text-sm font-bold"
            onClick={() => {
              setOpenError(null);
              if (resultState.kind !== 'READY') retryResult();
              setOpenAttempt((n) => n + 1);
            }}
          >
            다시 시도
          </button>
        </div>
      )}

      {!failed && consultationId === null && (
        <p role="status" className="text-sm text-on-surface-variant">상담을 준비하는 중이에요…</p>
      )}

      {result && consultationId !== null && (
        <>
          <div role="log" aria-live="polite" aria-label="AI와 주고받은 메시지" className="space-y-6 mb-6">
            {messages.length === 0 && !pending && (
              <p className="text-sm text-on-surface-variant">
                결과가 나온 이유, 두 전공의 차이, 탐색 활동에 대해 물어볼 수 있어요.
              </p>
            )}
            {messages.map((m) =>
              m.role === 'user' ? (
                <div key={m.id} className="flex justify-end">
                  <p className="max-w-[560px] rounded-2xl rounded-br-md bg-primary-container px-5 py-3 text-sm text-white break-words">{m.content}</p>
                </div>
              ) : (
                <AssistantMessage key={m.id} message={m} />
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
              <p role="status" className="text-sm text-on-surface-variant pl-11">
                답변을 정리하고 있어요…
              </p>
            )}
            {sendFailed && pending && (
              <div role="alert" className="ml-11 rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container">
                <p className="mb-2">답변을 받지 못했어요. 질문은 그대로 남아 있어요.</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => void send(pending)} className="min-h-[44px] px-4 rounded-lg bg-primary-container text-white text-sm font-bold">
                    다시 보내기
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDraft(pending.content);
                      setPending(null);
                      setSendFailed(false);
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

          <div className="flex flex-wrap gap-2 mb-3" aria-label="추천 질문">
            {suggestionsFor(result).map((q) => (
              <button
                key={q}
                type="button"
                disabled={sending || pending !== null}
                onClick={() => submit(q)}
                className="min-h-[44px] rounded-full border border-secondary/30 bg-surface-container-lowest px-4 text-sm text-secondary disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="flex items-end gap-2 rounded-brand border border-outline-variant/30 bg-surface-container-lowest p-2">
            <label htmlFor="ask-input" className="sr-only">AI에게 보낼 질문</label>
            <textarea
              id="ask-input"
              rows={2}
              maxLength={MAX_LENGTH}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={pending !== null}
              placeholder="결과에 대해 궁금한 점을 적어주세요"
              className="min-w-0 flex-1 resize-none bg-transparent px-3 py-2 text-sm text-on-surface outline-none placeholder:text-outline"
            />
            <button
              type="submit"
              disabled={!draft.trim() || pending !== null}
              aria-label="보내기"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-container text-white disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">send</span>
            </button>
          </form>
          <p className="mt-1 text-right text-[11px] text-outline">
            {draft.length}/{MAX_LENGTH} · Enter 보내기, Shift+Enter 줄바꿈
          </p>
        </>
      )}
    </Shell>
  );
};

export default ExplorationAsk;
