// 백엔드 /api/exploration/v1 구현 전 화면 개발용 mock 어댑터.
// 문항은 실제 187문항이 아닌 임시 샘플이며, 점수·분기 규칙을 계산하지 않는다.
// 서버 응답 흐름(revision, 409, 조건부 문항 추가·제외, 단계 전환)만 흉내 낸다.
import type {
  AdvanceResponse,
  CompleteResponse,
  ExplorationOption,
  ExplorationProgress,
  ExplorationSession,
  ExplorationSessionDetail,
  ExplorationSessionSummary,
  ExplorationStage,
  IssuedQuestion,
  IssuedQuestionState,
  NextQuestionsResponse,
  SaveAnswerRequest,
  SaveAnswerResponse,
  StageNotice,
} from '../types/exploration';

const STORAGE_KEY = 'jinroon.exploration.mock.v1';
const STAGES: ExplorationStage[] = ['STAGE_1', 'STAGE_2', 'STAGE_3'];
const STAGE_MAX: Record<ExplorationStage, number> = { STAGE_1: 42, STAGE_2: 24, STAGE_3: 12 };

const SCALE: ExplorationOption[] = [
  { code: 'STRONGLY_DISAGREE', text: '전혀 그렇지 않다', order: 1 },
  { code: 'DISAGREE', text: '그렇지 않은 편이다', order: 2 },
  { code: 'NEUTRAL', text: '보통이다', order: 3 },
  { code: 'AGREE', text: '그런 편이다', order: 4 },
  { code: 'STRONGLY_AGREE', text: '매우 그렇다', order: 5 },
  { code: 'UNKNOWN', text: '잘 모르겠음', order: 6 },
  { code: 'NO_EXPERIENCE', text: '경험이 없어 판단하기 어려움', order: 7 },
];

interface SampleQuestion {
  questionId: string;
  stage: ExplorationStage;
  text: string;
  options?: ExplorationOption[];
  comparisonSet?: string;
}

const BANK: SampleQuestion[] = [
  { questionId: 'MOCK-S1-01', stage: 'STAGE_1', text: '생물이 자라고 변하는 과정을 알아보는 일에 관심이 간다.' },
  { questionId: 'MOCK-S1-02', stage: 'STAGE_1', text: '숫자나 자료에서 규칙을 찾아보는 일이 흥미롭다.' },
  { questionId: 'MOCK-S1-03', stage: 'STAGE_1', text: '사람들이 왜 그렇게 행동하는지 이야기 나누는 것이 재미있다.' },
  { questionId: 'MOCK-S1-04', stage: 'STAGE_1', text: '그림·영상·디자인처럼 눈에 보이는 결과물을 만드는 일에 끌린다.' },
  { questionId: 'MOCK-S1-05', stage: 'STAGE_1', text: '직접 무언가를 만들거나 고쳐본 경험이 있다면, 그 과정이 즐거웠다.' },
  { questionId: 'MOCK-S1-06', stage: 'STAGE_1', text: '다른 사람에게 무언가를 설명하거나 가르쳐 본 시간이 즐거웠다.' },
  { questionId: 'MOCK-S2-01', stage: 'STAGE_2', text: '자료를 모아 정리하고 그 안에서 의미를 찾는 활동을 더 해보고 싶다.' },
  {
    questionId: 'MOCK-S2-02',
    stage: 'STAGE_2',
    comparisonSet: 'MOCK-CMP-DATA',
    text: '다음 중 더 해보고 싶은 공부 방식에 가까운 것을 골라주세요.',
    options: [
      { code: 'DIR_APPLICATION', text: '실제 데이터를 모아 문제를 풀어보는 공부', order: 1 },
      { code: 'DIR_THEORY', text: '개념의 원리를 차근차근 증명하며 이해하는 공부', order: 2 },
      { code: 'DIR_INFERENCE', text: '자료로 낸 결론을 얼마나 믿을 수 있는지 따져보는 공부', order: 3 },
      { code: 'UNKNOWN', text: '잘 모르겠음', order: 4 },
    ],
  },
  { questionId: 'MOCK-S2-03', stage: 'STAGE_2', text: '혼자 깊이 파고드는 시간보다 여럿이 함께 만드는 시간이 더 잘 맞는다.' },
  { questionId: 'MOCK-S3-01', stage: 'STAGE_3', text: '실험·실습 수업이 많은 환경도 괜찮을 것 같다.' },
  { questionId: 'MOCK-S3-02', stage: 'STAGE_3', text: '탐색 활동에 쓸 수 있는 시간이 일주일에 2시간 이상 있다.' },
];

// MOCK-S2-01에 긍정 응답하면 추가되는 조건부 문항
const CONDITIONAL: SampleQuestion = {
  questionId: 'MOCK-S2-01A',
  stage: 'STAGE_2',
  text: '정리한 자료를 그래프나 표로 보여주는 작업을 해보고 싶다.',
};
const TRIGGER_ID = 'MOCK-S2-01';
const TRIGGER_CODES = ['AGREE', 'STRONGLY_AGREE'];

const NOTICES: Partial<Record<ExplorationStage, StageNotice>> = {
  STAGE_2: {
    title: '조금 더 확인해볼 부분이 있어요.',
    description:
      '앞선 응답에서 관심이 비슷하게 나타난 분야가 있어요. 어떤 공부와 활동 방식이 더 끌리는지 몇 가지 더 여쭤볼게요. (mock 안내 문구)',
    expectedMaxQuestions: 24,
  },
  STAGE_3: {
    title: '거의 다 왔어요.',
    description:
      '탐색을 시작할 때 미리 알아두면 좋은 점을 확인합니다. 이 응답은 추천 순서를 바꾸지 않아요. (mock 안내 문구)',
    expectedMaxQuestions: 12,
  },
};

interface MockSession {
  session: ExplorationSession;
  issued: IssuedQuestionState[];
  queue: string[];
  adjustPending: boolean;
  mutations: Record<string, SaveAnswerResponse>;
}

interface MockDb {
  seq: number;
  issuedSeq: number;
  sessions: Record<number, MockSession>;
}

const load = (): MockDb => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as MockDb;
  } catch { /* 저장소 접근 불가 시 빈 상태 */ }
  return { seq: 100, issuedSeq: 500, sessions: {} };
};

const save = (db: MockDb) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch { /* 저장 실패는 mock이라 무시 */ }
};

const fail = (status: number, code: string) => ({ response: { status, data: { code } } });

const delay = <T,>(fn: () => T): Promise<T> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        reject(new Error('offline'));
        return;
      }
      try {
        resolve(fn());
      } catch (e) {
        reject(e);
      }
    }, 250);
  });

const findQuestion = (id: string) =>
  id === CONDITIONAL.questionId ? CONDITIONAL : BANK.find((q) => q.questionId === id)!;

const toIssued = (q: SampleQuestion, issuedId: number): IssuedQuestion => ({
  issuedId,
  questionId: q.questionId,
  questionVersion: '0.0-mock',
  comparisonSet: q.comparisonSet ?? null,
  optionVariantVersion: q.comparisonSet ? 'MOCK' : null,
  text: q.text,
  options: q.options ?? SCALE,
  required: true,
});

const queueFor = (stage: ExplorationStage) =>
  BANK.filter((q) => q.stage === stage).map((q) => q.questionId);

const getMock = (db: MockDb, sessionId: number) => {
  const s = db.sessions[sessionId];
  if (!s) throw fail(404, 'RESOURCE_NOT_FOUND');
  return s;
};

const checkRevision = (s: MockSession, expected: number) => {
  if (s.session.status === 'completed') throw fail(409, 'SESSION_ALREADY_COMPLETED');
  if (s.session.revision !== expected) throw fail(409, 'STALE_REVISION');
};

const progressOf = (s: MockSession): ExplorationProgress => {
  const stage = s.session.stage;
  const inStage = s.issued.filter((i) => i.stage === stage && i.effective);
  return {
    stage: (STAGES.indexOf(stage) + 1) as 1 | 2 | 3,
    answered: inStage.filter((i) => i.answerCode !== null).length,
    issued: inStage.length,
    stageMax: STAGE_MAX[stage],
    remainingMax: s.queue.length,
  };
};

const nextActionOf = (s: MockSession) => {
  const stage = s.session.stage;
  const pending = s.issued.some((i) => i.stage === stage && i.effective && i.answerCode === null);
  if (pending) return 'ANSWER' as const;
  if (s.queue.length > 0) return 'NEXT' as const;
  return stage === 'STAGE_3' ? ('COMPLETE' as const) : ('ADVANCE' as const);
};

export const startSession = () =>
  delay((): ExplorationSession => {
    const db = load();
    const sessionId = ++db.seq;
    const session: ExplorationSession = {
      sessionId,
      diagnosisType: 'EXPLORATION_V1',
      status: 'in_progress',
      stage: 'STAGE_1',
      revision: 1,
      versions: {
        questionCatalog: 'MOCK_QUESTION_CATALOG',
        optionCatalog: 'MOCK_OPTION_CATALOG',
        majorMapping: 'MOCK_MAJOR_MAPPING',
        ruleset: 'MOCK_RULESET',
      },
      startedAt: new Date().toISOString(),
      resultId: null,
    };
    db.sessions[sessionId] = { session, issued: [], queue: queueFor('STAGE_1'), adjustPending: false, mutations: {} };
    save(db);
    return session;
  });

export const getSession = (sessionId: number) =>
  delay((): ExplorationSessionDetail => {
    const s = getMock(load(), sessionId);
    return {
      session: s.session,
      issued: s.issued,
      progress: progressOf(s),
      nextAction: s.session.status === 'completed' ? 'COMPLETE' : nextActionOf(s),
    };
  });

export const listSessions = () =>
  delay((): ExplorationSessionSummary[] =>
    Object.values(load().sessions)
      .map(({ session }) => ({
        sessionId: session.sessionId,
        diagnosisType: session.diagnosisType,
        status: session.status,
        stage: session.stage,
        startedAt: session.startedAt,
      }))
      .sort((a, b) => b.sessionId - a.sessionId),
  );

export const next = (sessionId: number, expectedRevision: number) =>
  delay((): NextQuestionsResponse => {
    const db = load();
    const s = getMock(db, sessionId);
    checkRevision(s, expectedRevision);
    const stage = s.session.stage;
    const pending = s.issued.filter((i) => i.stage === stage && i.effective && i.answerCode === null);
    let issuedQuestions = pending.map((i) => i.question);
    if (issuedQuestions.length === 0 && s.queue.length > 0) {
      const q = findQuestion(s.queue.shift()!);
      const issued = toIssued(q, ++db.issuedSeq);
      s.issued.push({ question: issued, answerCode: null, effective: true, stage });
      s.session.revision += 1;
      issuedQuestions = [issued];
    }
    const adjusted = s.adjustPending;
    s.adjustPending = false;
    save(db);
    return {
      revision: s.session.revision,
      issuedQuestions,
      progress: progressOf(s),
      nextAction: nextActionOf(s),
      adjusted,
    };
  });

export const saveAnswer = (sessionId: number, issuedId: number, body: SaveAnswerRequest) =>
  delay((): SaveAnswerResponse => {
    const db = load();
    const s = getMock(db, sessionId);
    const replay = s.mutations[body.clientMutationId];
    if (replay) return replay;
    checkRevision(s, body.expectedRevision);
    const target = s.issued.find((i) => i.question.issuedId === issuedId);
    if (!target) throw fail(404, 'RESOURCE_NOT_FOUND');
    if (!target.effective || target.stage !== s.session.stage) throw fail(422, 'QUESTION_NOT_EFFECTIVE');
    if (!target.question.options.some((o) => o.code === body.optionCode)) throw fail(422, 'OPTION_NOT_ISSUED');

    target.answerCode = body.optionCode;
    const excludedIssuedIds: number[] = [];
    if (target.question.questionId === TRIGGER_ID) {
      const triggered = TRIGGER_CODES.includes(body.optionCode);
      const extra = s.issued.find((i) => i.question.questionId === CONDITIONAL.questionId);
      const queued = s.queue.includes(CONDITIONAL.questionId);
      if (triggered) {
        if (extra && !extra.effective) {
          extra.effective = true;
          s.adjustPending = true;
        } else if (!extra && !queued) {
          s.queue.unshift(CONDITIONAL.questionId);
          s.adjustPending = true;
        }
      } else if (extra?.effective) {
        extra.effective = false;
        excludedIssuedIds.push(extra.question.issuedId);
        s.adjustPending = true;
      } else if (queued) {
        s.queue = s.queue.filter((id) => id !== CONDITIONAL.questionId);
        s.adjustPending = true;
      }
    }
    s.session.revision += 1;
    const response: SaveAnswerResponse = {
      revision: s.session.revision,
      issuedId,
      optionCode: body.optionCode,
      affectedCount: excludedIssuedIds.length,
      excludedIssuedIds,
      progress: progressOf(s),
      nextAction: nextActionOf(s),
    };
    s.mutations[body.clientMutationId] = response;
    save(db);
    return response;
  });

export const advance = (sessionId: number, expectedRevision: number) =>
  delay((): AdvanceResponse => {
    const db = load();
    const s = getMock(db, sessionId);
    checkRevision(s, expectedRevision);
    if (nextActionOf(s) !== 'ADVANCE') throw fail(422, 'STAGE_INCOMPLETE');
    const stage = STAGES[STAGES.indexOf(s.session.stage) + 1];
    s.session.stage = stage;
    s.queue = queueFor(stage);
    s.session.revision += 1;
    save(db);
    return { revision: s.session.revision, stage, nextAction: nextActionOf(s), notice: NOTICES[stage] ?? null };
  });

export const complete = (sessionId: number, expectedRevision: number) =>
  delay((): CompleteResponse => {
    const db = load();
    const s = getMock(db, sessionId);
    if (s.session.status === 'completed' && s.session.resultId) {
      return { revision: s.session.revision, resultId: s.session.resultId, status: 'completed' };
    }
    checkRevision(s, expectedRevision);
    if (nextActionOf(s) !== 'COMPLETE') throw fail(422, 'STAGE_INCOMPLETE');
    s.session.status = 'completed';
    s.session.resultId = 9000 + sessionId;
    s.session.revision += 1;
    save(db);
    return { revision: s.session.revision, resultId: s.session.resultId, status: 'completed' };
  });
