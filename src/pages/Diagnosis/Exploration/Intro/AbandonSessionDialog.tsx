import { useEffect, useId, useRef, useState } from 'react';
import {
  abandonExplorationSession, createMutationId, getExplorationSession, toExplorationErrorCode,
} from '../../../../api/exploration';
import useAuthStore from '../../../../store/useAuthStore';
import type { ExplorationSessionSummary } from '../../../../types/exploration';

type Confirmation = { revision: number; mutationId: string };
type State =
  | { kind: 'LOADING' | 'LOAD_FAILED' | 'CONFLICT' }
  | { kind: 'TERMINAL'; message: string }
  | { kind: 'CONFIRM' | 'SENDING' | 'RETRY'; confirmation: Confirmation };

interface Props {
  session: ExplorationSessionSummary;
  onClose: (terminal?: boolean) => void;
  onAbandoned: (sessionId: number) => void;
}

const AbandonSessionDialog = ({ session, onClose, onAbandoned }: Props) => {
  const [state, setState] = useState<State>({ kind: 'LOADING' });
  const [attempt, setAttempt] = useState(0);
  const [authVersion] = useState(() => useAuthStore.getState().sessionVersion);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const active = useRef(false);
  const sending = useRef(false);
  const titleId = useId();
  const descriptionId = useId();
  const currentAuth = () => {
    const auth = useAuthStore.getState();
    return auth.isLoggedIn && auth.sessionVersion === authVersion;
  };

  useEffect(() => {
    active.current = true;
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => { active.current = false; dialog?.close(); };
  }, []);

  useEffect(() => {
    let alive = true;
    getExplorationSession(session.sessionId).then(({ session: latest }) => {
      const auth = useAuthStore.getState();
      if (!alive || !auth.isLoggedIn || auth.sessionVersion !== authVersion) return;
      if (latest.sessionId !== session.sessionId || !Number.isSafeInteger(latest.revision) || latest.revision < 0) {
        throw new Error('Invalid session response');
      }
      if (latest.status !== 'in_progress') {
        setState({ kind: 'TERMINAL', message: latest.status === 'completed'
          ? '이미 완료된 검사예요. 완료 결과는 그대로 남아 있어요.'
          : '이미 중단된 검사예요. 목록에서 현재 상태를 확인해주세요.' });
      } else {
        setState({ kind: 'CONFIRM', confirmation: { revision: latest.revision, mutationId: createMutationId() } });
      }
    }).catch((error: unknown) => {
      if (!alive) return;
      setState(toExplorationErrorCode(error) === 'NOT_FOUND'
        ? { kind: 'TERMINAL', message: '검사를 찾을 수 없어요. 목록에서 현재 상태를 확인해주세요.' }
        : { kind: 'LOAD_FAILED' });
    });
    return () => { alive = false; };
  }, [session.sessionId, attempt, authVersion]);

  const reload = () => {
    setState({ kind: 'LOADING' });
    setAttempt((value) => value + 1);
  };

  const confirm = async () => {
    if (sending.current || !currentAuth() || (state.kind !== 'CONFIRM' && state.kind !== 'RETRY')) return;
    const confirmation = state.confirmation;
    sending.current = true;
    setState({ kind: 'SENDING', confirmation });
    try {
      const response = await abandonExplorationSession(session.sessionId, confirmation.revision, confirmation.mutationId);
      if (!active.current || !currentAuth()) return;
      if (response.sessionId !== session.sessionId || response.status !== 'abandoned') throw new Error('Invalid abandon response');
      onAbandoned(session.sessionId);
    } catch (error: unknown) {
      if (!active.current || !currentAuth()) return;
      const code = toExplorationErrorCode(error);
      if (code === 'STALE_REVISION' || code === 'IDEMPOTENCY_CONFLICT') setState({ kind: 'CONFLICT' });
      else if (code === 'SESSION_ALREADY_COMPLETED' || code === 'SESSION_ABANDONED' || code === 'NOT_FOUND') {
        setState({ kind: 'TERMINAL', message: '검사 상태가 바뀌었어요. 목록에서 현재 상태를 확인해주세요.' });
      } else setState({ kind: 'RETRY', confirmation });
    } finally {
      sending.current = false;
    }
  };

  const busy = state.kind === 'SENDING';
  const buttonClass = 'min-h-[44px] px-5 py-3 rounded-lg font-semibold disabled:opacity-50';
  return (
    <dialog ref={dialogRef} aria-labelledby={titleId} aria-describedby={descriptionId}
      onCancel={(event) => { event.preventDefault(); if (!sending.current) onClose(state.kind === 'TERMINAL'); }}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (!first) { event.preventDefault(); return; }
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }}
      className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md max-h-[calc(100%-2rem)] overflow-y-auto rounded-2xl bg-surface-container-lowest p-6 shadow-xl backdrop:bg-primary-container/40">
      <h2 id={titleId} className="text-xl font-bold text-primary-container mb-3">이 검사를 중단할까요?</h2>
      <div id={descriptionId} className="text-sm text-on-surface-variant leading-relaxed mb-5 space-y-2">
        <p>전공 탐색 진단 #{session.sessionId}</p>
        <p>중단하면 이 검사는 더 이상 이어할 수 없어요. 완료된 결과와 이전 방식 진단은 그대로 남아 있어요.</p>
      </div>
      {state.kind === 'LOADING' && <p role="status" className="text-sm mb-5">최신 검사 상태를 확인하는 중이에요…</p>}
      {state.kind === 'LOAD_FAILED' && <p role="alert" className="text-sm text-error mb-5">검사 상태를 확인하지 못했어요. 중단 요청은 보내지 않았어요.</p>}
      {state.kind === 'RETRY' && <p role="alert" className="text-sm text-error mb-5">중단 여부를 확인하지 못했어요. 같은 요청으로 다시 확인하거나, 창을 닫고 목록을 확인해주세요.</p>}
      {state.kind === 'CONFLICT' && <p role="alert" className="text-sm text-error mb-5">다른 창에서 검사가 바뀌었어요. 최신 상태를 확인한 뒤 중단할지 다시 결정해주세요.</p>}
      {state.kind === 'TERMINAL' && <p role="status" className="text-sm mb-5">{state.message}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <button autoFocus type="button" disabled={busy} onClick={() => { if (!sending.current) onClose(state.kind === 'TERMINAL'); }}
          className={`${buttonClass} border border-outline-variant text-primary-container`}>
          {state.kind === 'TERMINAL' ? '목록 새로고침' : '취소'}
        </button>
        {(state.kind === 'CONFLICT' || state.kind === 'LOAD_FAILED') && (
          <button type="button" onClick={reload} className={`${buttonClass} bg-primary-container text-white`}>최신 상태 확인</button>
        )}
        {(state.kind === 'CONFIRM' || state.kind === 'RETRY' || busy) && (
          <button type="button" disabled={busy} onClick={() => void confirm()} className={`${buttonClass} bg-error text-white`}>
            {busy ? '중단하는 중…' : state.kind === 'RETRY' ? '중단 요청 다시 확인' : '검사 중단하기'}
          </button>
        )}
      </div>
    </dialog>
  );
};

export default AbandonSessionDialog;
