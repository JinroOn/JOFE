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
  ExplorationResult,
  ExplorationSession,
  IssuedQuestionState,
  SaveAnswerBranchChanges,
  StageNotice,
} from '../types/exploration';

export type ExplorationPhase =
  | 'IDLE' | 'STARTING' | 'RESUMING' | 'ANSWERING'
  | 'STAGE_NOTICE' | 'READY_TO_COMPLETE' | 'COMPLETING'
  | 'RESULT_READY' | 'LOAD_FAILED';

export type ExplorationSaveState =
  | 'IDLE' | 'SAVING' | 'SAVE_FAILED' | 'STALE_REVISION' | 'OFFLINE';

type PendingAnswer = { issuedId: number; optionCode: string; clientMutationId: string };
type PendingOp = 'save' | 'next' | 'advance' | 'complete';

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
  branchChanges: SaveAnswerBranchChanges | null;
  fixedCandidates: unknown;
  pending: PendingAnswer | null;
  failedOp: PendingOp | null;
  resultId: number | null;
  // complete 응답이 결과 DTO 전체를 주므로 결과 화면이 다시 조회하지 않도록 보관한다 (JOFE#113)
  result: ExplorationResult | null;

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
  branchChanges: null,
  fixedCandidates: null,
  pending: null,
  failedOp: null,
  resultId: null,
  result: null,
};

const currentStageIndexes = (
  issued: IssuedQuestionState[],
  stage: ExplorationSession['stage'] | undefined,
  from: number,
  to: number,
) => {
  const result: number[] = [];
  for (let i = from; i <= to; i += 1) {
    if (issued[i]?.effective && issued[i].stage === stage) result.push(i);
  }
  return result;
};

// 이미 진행 중인 회차의 ID 추출
const getExistingSessionId = (error: unknown): number | null => {
  const e = error as {
    response?: {
      status?: number;
      data?: {
        code?: string;
        existingSessionId?: number | string;
        data?: { existingSessionId?: number | string };
        details?: { existingSessionId?: number | string };
      };
    };
  };

  const responseData = e?.response?.data;
  if (e?.response?.status !== 409 || responseData?.code !== 'EXPLORATION_IN_PROGRESS') return null;

  const rawId = responseData.existingSessionId ?? responseData.data?.existingSessionId ?? responseData.details?.existingSessionId;
  if (rawId === undefined || rawId === null) return null;

  const id = Number(rawId);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const useExplorationStore = create<ExplorationState>((set, get) => {
  const failWith = (op: PendingOp, error: unknown) => {
    const code = toExplorationErrorCode(error);
    if (code === 'SESSION_ABANDONED') {
      set({ phase: 'LOAD_FAILED', errorCode: code, saveState: 'IDLE', failedOp: null, pending: null });
      return;
    }
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;

    set({
      errorCode: code,
      failedOp: op,
      saveState: code === 'STALE_REVISION'
        ? 'STALE_REVISION'
        : code === 'NETWORK' && offline
          ? 'OFFLINE'
          : 'SAVE_FAILED',
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
    else if (action === 'ANSWER') set({ phase: 'ANSWERING', saveState: 'IDLE' });
  };

  const fetchNext = async () => {
    const { session } = get();
    if (!session) return;

    set({ saveState: 'SAVING', errorCode: null });

    try {
      const res = await requestNextQuestions(session.sessionId, session.revision);
      setRevision(res.revision);

      const { issued } = get();
      const known = new Set(issued.map((item) => item.question.issuedId));
      const added = res.issuedQuestions
        .filter((question) => !known.has(question.issuedId))
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
        set({ cursor: merged.findIndex((item) => item.question.issuedId === firstId), phase: 'ANSWERING' });
      } else {
        await followNextAction(res.nextAction);
      }
    } catch (e) {
      failWith('next', e);
    }
  };

  // 단계 진행
  const doAdvance = async () => {
    const { session } = get();
    if (!session) return;

    set({ saveState: 'SAVING', errorCode: null });

    try {
      const res = await advanceExplorationStage(session.sessionId, session.revision);

      // 실제 백엔드 응답
      if ('session' in res) {
        set({
          session: { ...session, ...res.session },
          progress: res.progress,
          nextAction: res.nextAction,
          fixedCandidates: res.fixedCandidates,
          notice: null,
          saveState: 'IDLE',
          failedOp: null,
        });
        await followNextAction(res.nextAction);
        return;
      }

      // 기존 Mock 응답
      set({
        session: { ...session, revision: res.revision, stage: res.stage },
        nextAction: res.nextAction,
        saveState: 'IDLE',
        failedOp: null,
      });

      if (res.notice) set({ phase: 'STAGE_NOTICE', notice: res.notice });
      else await followNextAction(res.nextAction);
    } catch (e) {
      failWith('advance', e);
    }
  };

  // 답변 저장
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

      const isBackendResponse = 'branchChanges' in res;

      // 백엔드와 Mock 응답을 동일한 구조로 처리
      const branchChanges: SaveAnswerBranchChanges = isBackendResponse
        ? res.branchChanges
        : {
            excludedIssuedIds: res.excludedIssuedIds,
            restoredIssuedIds: [],
            pendingQuestionCount: 0,
            budgetLimited: false,
          };

      const responseStage = isBackendResponse ? res.stage : session.stage;
      const effective = isBackendResponse ? res.effective : true;
      const rewound = isBackendResponse ? res.rewound : false;

      const excluded = new Set(branchChanges.excludedIssuedIds);
      const restored = new Set(branchChanges.restoredIssuedIds);

      const issued = get().issued.map((item) => {
        const issuedId = item.question.issuedId;

        if (issuedId === res.issuedId) {
          return { ...item, answerCode: res.optionCode, effective, stage: responseStage };
        }
        if (excluded.has(issuedId)) return { ...item, effective: false };
        if (restored.has(issuedId)) return { ...item, effective: true };
        return item;
      });

      const affectedCount = isBackendResponse
        ? branchChanges.excludedIssuedIds.length + branchChanges.restoredIssuedIds.length
        : res.affectedCount;

      set({
        session: { ...session, revision: res.revision, stage: responseStage },
        issued,
        progress: res.progress,
        nextAction: res.nextAction,
        pending: null,
        saveState: 'IDLE',
        failedOp: null,
        affectedCount,
        branchChanges,
        adjustedNotice: get().adjustedNotice ||
          rewound ||
          branchChanges.excludedIssuedIds.length > 0 ||
          branchChanges.restoredIssuedIds.length > 0 ||
          branchChanges.budgetLimited,
      });

      const currentCursor = get().cursor;
      const later = currentStageIndexes(issued, responseStage, currentCursor + 1, issued.length - 1)
        .filter((index) => issued[index].answerCode === null);

      if (later.length > 0) {
        set({ cursor: later[0], phase: 'ANSWERING' });
      } else if (res.nextAction === 'ANSWER') {
        const firstOpen = issued.findIndex((item) =>
          item.effective && item.stage === responseStage && item.answerCode === null,
        );
        if (firstOpen !== -1) set({ cursor: firstOpen, phase: 'ANSWERING' });
        else await followNextAction(res.nextAction);
      } else {
        await followNextAction(res.nextAction);
      }
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
      // 완료 응답에는 revision이 없다. 완료 후에는 낙관적 잠금 대상이 아니므로 마지막 값을 유지한다.
      // 결과 DTO는 그대로 보관해 결과 화면이 다시 조회하지 않게 한다. (JOFE#113)
      set({
        session: { ...session, status: 'completed', resultId: res.resultId },
        resultId: res.resultId,
        result: res,
        phase: 'RESULT_READY',
        saveState: 'IDLE',
        failedOp: null,
      });
    } catch (e) {
      set({ phase: 'READY_TO_COMPLETE' });
      failWith('complete', e);
    }
  };

  let inflight: { sessionId: number; promise: Promise<void> } | null = null;

  const doLoad = async (sessionId: number) => {
    set({ ...initial, phase: 'RESUMING' });

    try {
      const detail = await getExplorationSession(sessionId);
      const firstOpen = detail.issued.findIndex((item) => item.effective && item.answerCode === null);

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

      if (detail.session.status === 'abandoned') {
        set({ phase: 'LOAD_FAILED', errorCode: 'SESSION_ABANDONED' });
        return;
      }

      if (detail.nextAction === 'ANSWER') set({ phase: 'ANSWERING' });
      else await followNextAction(detail.nextAction);
    } catch (e) {
      set({ phase: 'LOAD_FAILED', errorCode: toExplorationErrorCode(e) });
    }
  };

  const load = (sessionId: number) => {
    if (inflight && inflight.sessionId === sessionId) return inflight.promise;

    const promise = doLoad(sessionId).finally(() => {
      if (inflight?.promise === promise) inflight = null;
    });

    inflight = { sessionId, promise };
    return promise;
  };

  return {
    ...initial,

    // 검사 시작
    start: async () => {
      set({ ...initial, phase: 'STARTING' });

      try {
        const session = await startExplorationSession();
        return session.sessionId;
      } catch (e) {
        const existingSessionId = getExistingSessionId(e);

        // 이미 진행 중인 검사가 있으면 해당 회차로 이동
        if (existingSessionId !== null) {
          set({ ...initial });
          return existingSessionId;
        }

        set({ phase: 'LOAD_FAILED', errorCode: toExplorationErrorCode(e) });
        return null;
      }
    },

    load,

    // 선택지 저장
    select: async (optionCode) => {
      const { issued, cursor, saveState, phase } = get();
      const current = issued[cursor];

      if (!current || phase !== 'ANSWERING' || saveState === 'SAVING') return;
      if (current.answerCode === optionCode) {
        get().goNextAnswered();
        return;
      }

      set({
        pending: {
          issuedId: current.question.issuedId,
          optionCode,
          clientMutationId: createMutationId(),
        },
        affectedCount: 0,
      });

      await doSave();
    },

    goPrev: () => {
      const { issued, cursor, saveState, session } = get();
      if (saveState === 'SAVING') return;

      const prev = currentStageIndexes(issued, session?.stage, 0, cursor - 1);
      if (prev.length > 0) {
        set({ cursor: prev[prev.length - 1], pending: null, saveState: 'IDLE', affectedCount: 0 });
      }
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

    // 최신 회차 정보 다시 불러오기
    reloadLatest: async () => {
      const { session, pending } = get();
      if (!session) return;

      const keepIssuedId = pending?.issuedId ?? get().issued[get().cursor]?.question.issuedId;
      await load(session.sessionId);

      const idx = get().issued.findIndex((item) =>
        item.question.issuedId === keepIssuedId && item.effective,
      );

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
