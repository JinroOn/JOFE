import { create } from 'zustand';
import {
  advanceExplorationStage,
  completeExplorationSession,
  createMutationId,
  getExplorationSession,
  requestNextQuestions,
  saveExplorationAnswer,
  startExplorationSession,
  toExplorationErrorCode,
} from '../api/exploration';
import type {
  ExplorationErrorCode,
  ExplorationNextAction,
  ExplorationProgress,
  ExplorationSession,
  IssuedQuestionState,
  StageNotice,
} from '../types/exploration';

// 04 문서 상태 머신: IDLE → STARTING → ANSWERING_STAGE_1~3 → COMPLETING → RESULT_READY
// 단계 번호는 session.stage에서 읽고, 화면 분기용으로 STAGE_NOTICE·READY_TO_COMPLETE를 둔다.
export type ExplorationPhase =
  | 'IDLE'
  | 'STARTING'
  | 'RESUMING'
  | 'ANSWERING'
  | 'STAGE_NOTICE'
  | 'READY_TO_COMPLETE'
  | 'COMPLETING'
  | 'RESULT_READY'
  | 'LOAD_FAILED';

export type ExplorationSaveState = 'IDLE' | 'SAVING' | 'SAVE_FAILED' | 'STALE_REVISION' | 'OFFLINE';

type PendingOp = 'save' | 'next' | 'advance' | 'complete';

interface PendingAnswer {
  issuedId: number;
  optionCode: string;
  clientMutationId: string;
}

interface ExplorationState {
  phase: ExplorationPhase;
  saveState: ExplorationSaveState;
  errorCode: ExplorationErrorCode | null;
  session: ExplorationSession | null;
  issued: IssuedQuestionState[];
  cursor: number;
  progress: ExplorationProgress | null;
  nextAction: ExplorationNextAction | null;
  notice: StageNotice | null;
  adjustedNotice: boolean;
  affectedCount: number;
  pending: PendingAnswer | null;
  failedOp: PendingOp | null;
  resultId: number | null;

  start: () => Promise<number | null>;
  load: (sessionId: number) => Promise<void>;
  select: (optionCode: string) => Promise<void>;
  goPrev: () => void;
  goNextAnswered: () => void;
  retry: () => Promise<void>;
  reloadLatest: () => Promise<void>;
  continueAfterNotice: () => Promise<void>;
  complete: () => Promise<void>;
  dismissAdjusted: () => void;
  reset: () => void;
}

const initial = {
  phase: 'IDLE' as ExplorationPhase,
  saveState: 'IDLE' as ExplorationSaveState,
  errorCode: null,
  session: null,
  issued: [],
  cursor: 0,
  progress: null,
  nextAction: null,
  notice: null,
  adjustedNotice: false,
  affectedCount: 0,
  pending: null,
  failedOp: null,
  resultId: null,
};

// 이전 단계 답변은 단계 전환 후 수정하지 않는다
const currentStageIndexes = (
  issued: IssuedQuestionState[],
  stage: ExplorationSession['stage'] | undefined,
  from: number,
  to: number,
) => {
  const result: number[] = [];
  for (let i = from; i <= to; i += 1) if (issued[i]?.effective && issued[i].stage === stage) result.push(i);
  return result;
};

const useExplorationStore = create<ExplorationState>((set, get) => {
  const failWith = (op: PendingOp, error: unknown) => {
    const code = toExplorationErrorCode(error);
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
    set({
      errorCode: code,
      failedOp: op,
      saveState:
        code === 'STALE_REVISION' ? 'STALE_REVISION' : code === 'NETWORK' && offline ? 'OFFLINE' : 'SAVE_FAILED',
    });
  };

  const setRevision = (revision: number) => {
    const { session } = get();
    if (session) set({ session: { ...session, revision } });
  };

  const followNextAction = async (action: ExplorationNextAction) => {
    if (action === 'NEXT') await fetchNext();
    else if (action === 'ADVANCE') await doAdvance();
    else if (action === 'COMPLETE') set({ phase: 'READY_TO_COMPLETE', saveState: 'IDLE' });
  };

  const fetchNext = async () => {
    const { session } = get();
    if (!session) return;
    set({ saveState: 'SAVING', errorCode: null });
    try {
      const res = await requestNextQuestions(session.sessionId, session.revision);
      setRevision(res.revision);
      const { issued } = get();
      const known = new Set(issued.map((i) => i.question.issuedId));
      const added = res.issuedQuestions
        .filter((q) => !known.has(q.issuedId))
        .map((question) => ({ question, stage: session.stage, answerCode: null, effective: true }));
      const merged = [...issued, ...added];
      set({
        issued: merged,
        progress: res.progress,
        nextAction: res.nextAction,
        adjustedNotice: get().adjustedNotice || res.adjusted,
        saveState: 'IDLE',
        failedOp: null,
      });
      if (res.issuedQuestions.length > 0) {
        const firstId = res.issuedQuestions[0].issuedId;
        set({ cursor: merged.findIndex((i) => i.question.issuedId === firstId), phase: 'ANSWERING' });
      } else {
        await followNextAction(res.nextAction);
      }
    } catch (e) {
      failWith('next', e);
    }
  };

  const doAdvance = async () => {
    const { session } = get();
    if (!session) return;
    set({ saveState: 'SAVING', errorCode: null });
    try {
      const res = await advanceExplorationStage(session.sessionId, session.revision);
      set({
        session: { ...session, revision: res.revision, stage: res.stage },
        nextAction: res.nextAction,
        saveState: 'IDLE',
        failedOp: null,
      });
      if (res.notice) set({ phase: 'STAGE_NOTICE', notice: res.notice });
      else await fetchNext();
    } catch (e) {
      failWith('advance', e);
    }
  };

  const doSave = async () => {
    const { session, pending } = get();
    if (!session || !pending) return;
    set({ saveState: 'SAVING', errorCode: null });
    try {
      const res = await saveExplorationAnswer(session.sessionId, pending.issuedId, {
        optionCode: pending.optionCode,
        expectedRevision: session.revision,
        clientMutationId: pending.clientMutationId,
      });
      setRevision(res.revision);
      const excluded = new Set(res.excludedIssuedIds);
      const issued = get().issued.map((i) =>
        i.question.issuedId === res.issuedId
          ? { ...i, answerCode: res.optionCode }
          : excluded.has(i.question.issuedId)
            ? { ...i, effective: false }
            : i,
      );
      set({
        issued,
        progress: res.progress,
        nextAction: res.nextAction,
        pending: null,
        saveState: 'IDLE',
        failedOp: null,
        affectedCount: res.affectedCount,
        adjustedNotice: get().adjustedNotice || res.excludedIssuedIds.length > 0,
      });

      // 이미 받아둔 이후 문항이 있으면 그 문항으로, 없으면 서버가 정한 다음 행동을 따른다
      const { cursor } = get();
      const later = currentStageIndexes(issued, session.stage, cursor + 1, issued.length - 1).filter(
        (i) => issued[i].answerCode === null,
      );
      if (later.length > 0) set({ cursor: later[0] });
      else if (res.nextAction === 'ANSWER') {
        const firstOpen = issued.findIndex((i) => i.effective && i.answerCode === null);
        if (firstOpen !== -1) set({ cursor: firstOpen });
      } else await followNextAction(res.nextAction);
    } catch (e) {
      failWith('save', e);
    }
  };

  const doComplete = async () => {
    const { session } = get();
    if (!session) return;
    set({ phase: 'COMPLETING', saveState: 'SAVING', errorCode: null });
    try {
      const res = await completeExplorationSession(session.sessionId, session.revision);
      set({
        session: { ...session, revision: res.revision, status: 'completed', resultId: res.resultId },
        resultId: res.resultId,
        phase: 'RESULT_READY',
        saveState: 'IDLE',
        failedOp: null,
      });
    } catch (e) {
      set({ phase: 'READY_TO_COMPLETE' });
      failWith('complete', e);
    }
  };

  const load = async (sessionId: number) => {
    set({ ...initial, phase: 'RESUMING' });
    try {
      const detail = await getExplorationSession(sessionId);
      const firstOpen = detail.issued.findIndex((i) => i.effective && i.answerCode === null);
      set({
        session: detail.session,
        issued: detail.issued,
        progress: detail.progress,
        nextAction: detail.nextAction,
        cursor: firstOpen !== -1 ? firstOpen : Math.max(detail.issued.length - 1, 0),
        resultId: detail.session.resultId,
      });
      if (detail.session.status === 'completed') {
        set({ phase: 'RESULT_READY' });
        return;
      }
      if (detail.nextAction === 'ANSWER') set({ phase: 'ANSWERING' });
      else await followNextAction(detail.nextAction);
    } catch (e) {
      set({ phase: 'LOAD_FAILED', errorCode: toExplorationErrorCode(e) });
    }
  };

  return {
    ...initial,

    start: async () => {
      set({ ...initial, phase: 'STARTING' });
      try {
        const session = await startExplorationSession();
        return session.sessionId;
      } catch (e) {
        set({ phase: 'LOAD_FAILED', errorCode: toExplorationErrorCode(e) });
        return null;
      }
    },

    load,

    select: async (optionCode) => {
      const { issued, cursor, saveState, phase } = get();
      const current = issued[cursor];
      if (!current || phase !== 'ANSWERING' || saveState === 'SAVING') return;
      if (current.answerCode === optionCode) {
        get().goNextAnswered();
        return;
      }
      set({
        pending: { issuedId: current.question.issuedId, optionCode, clientMutationId: createMutationId() },
        affectedCount: 0,
      });
      await doSave();
    },

    goPrev: () => {
      const { issued, cursor, saveState, session } = get();
      if (saveState === 'SAVING') return;
      const prev = currentStageIndexes(issued, session?.stage, 0, cursor - 1);
      if (prev.length > 0) set({ cursor: prev[prev.length - 1], pending: null, saveState: 'IDLE', affectedCount: 0 });
    },

    goNextAnswered: () => {
      const { issued, cursor, nextAction, session } = get();
      const later = currentStageIndexes(issued, session?.stage, cursor + 1, issued.length - 1);
      if (later.length > 0) {
        set({ cursor: later[0], affectedCount: 0 });
        return;
      }
      if (nextAction && nextAction !== 'ANSWER') void followNextAction(nextAction);
    },

    retry: async () => {
      const op = get().failedOp;
      if (op === 'save') await doSave();
      else if (op === 'next') await fetchNext();
      else if (op === 'advance') await doAdvance();
      else if (op === 'complete') await doComplete();
    },

    // 409: 최신 회차를 다시 읽고, 사용자가 확인한 뒤 다시 선택하게 한다
    reloadLatest: async () => {
      const { session, pending } = get();
      if (!session) return;
      const keepIssuedId = pending?.issuedId ?? get().issued[get().cursor]?.question.issuedId;
      await load(session.sessionId);
      const idx = get().issued.findIndex((i) => i.question.issuedId === keepIssuedId && i.effective);
      if (idx !== -1 && get().phase === 'ANSWERING') set({ cursor: idx });
    },

    continueAfterNotice: async () => {
      set({ notice: null, phase: 'ANSWERING' });
      await fetchNext();
    },

    complete: doComplete,

    dismissAdjusted: () => set({ adjustedNotice: false }),

    reset: () => set({ ...initial }),
  };
});

export default useExplorationStore;
