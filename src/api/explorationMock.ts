// 백엔드 /api/exploration/v1 구현 전 화면 개발용 mock 어댑터.
// 문항은 실제 187문항이 아닌 임시 샘플이며, 점수·분기 규칙을 계산하지 않는다.
// 서버 응답 흐름(revision, 409, 조건부 문항 추가·제외, 단계 전환)만 흉내 낸다.
import type {
  AdvanceResponse,
  CompleteResponse,
  ExplorationOption,
  ConsultationSource,
  ExplorationActivities,
  ExplorationAskResponse,
  ExplorationChatMessage,
  ExplorationComparison,
  ExplorationPlan,
  ExplorationPlanSummary,
  ExplorationConsultation,
  ComparisonMajorProfile,
  ExplorationProgress,
  ExplorationResult,
  ExplorationResultResponse,
  ExplorationSession,
  ExplorationSessionDetail,
  ExplorationSessionSummary,
  ExplorationStage,
  IssuedQuestion,
  IssuedQuestionState,
  PlanStatus,
  PlanWeek,
  NextQuestionsResponse,
  SaveAnswerRequest,
  SaveAnswerResponse,
  StageNotice,
  SupportAnswerResponse,
  SupportPurpose,
  SupportSession,
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
  completedAt?: number;
  support?: {
    purpose: SupportPurpose;
    revision: number;
    issued: IssuedQuestion[];
    answers: Record<number, string>;
    mutations: Record<string, SupportAnswerResponse>;
  };
  consultation?: {
    messages: ExplorationChatMessage[];
    mutations: Record<string, ExplorationAskResponse>;
  };
  plans?: (ExplorationPlan & { requestedAt: number; willFail: boolean })[];
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
    s.completedAt = Date.now();
    s.session.resultId = 9000 + sessionId;
    s.session.revision += 1;
    save(db);
    return { revision: s.session.revision, resultId: s.session.resultId, status: 'completed' };
  });

// ---- 결과 ----
// mock 결과 상태는 1단계 응답만 보고 단순하게 고른다 (실제 추천 알고리즘이 아님)
const GENERATING_MS = 1500;

type Activity = ExplorationResult['nextActivities'][number];

// D-22: 특별한 시설·유료 장비 없이 시작, 결과물 예시 제공, 홍보 영상 시청만으로 끝나지 않음
const POOL: Record<string, Activity> = {
  INFO_CURRICULUM: {
    activityCode: 'MOCK-ACT-INFO',
    kind: 'INFO_CHECK',
    title: '학과 교육과정표 한 장 살펴보기',
    description: '관심 가는 학과 한 곳의 홈페이지에서 1~2학년 교육과정표를 찾아 과목 이름을 훑어봐요.',
    duration: '15~30분',
    outcome: '처음 2년 동안 어떤 과목을 배우는지 감을 잡을 수 있어요.',
    exampleOutput: '과목 이름 10개와 "궁금한 과목" 표시 2개가 담긴 메모',
    tags: ['FREE', 'ONLINE', 'SOLO'],
  },
  HANDS_PROJECT: {
    activityCode: 'MOCK-ACT-HANDS',
    kind: 'HANDS_ON',
    title: '공개 데이터로 표 하나 만들어보기',
    description: '공공데이터포털에서 관심 있는 주제의 자료를 받아 표나 그래프 하나를 만들어봐요.',
    duration: '1~2시간',
    outcome: '자료를 정리하는 과정이 나에게 어떻게 느껴지는지 확인할 수 있어요.',
    exampleOutput: '그래프 1장과 "알게 된 점" 세 줄',
    tags: ['FREE', 'ONLINE', 'SOLO'],
  },
  HANDS_READ: {
    activityCode: 'MOCK-ACT-HANDS-READ',
    kind: 'HANDS_ON',
    title: '공개 강의 한 편 듣고 요약 노트 쓰기',
    description: '대학 공개 강의 사이트에서 관심 전공의 입문 강의 한 편을 골라 듣고 핵심 개념을 정리해요.',
    duration: '1~2시간',
    outcome: '실제 전공 수업의 설명 방식과 난이도를 느껴볼 수 있어요.',
    exampleOutput: '핵심 개념 3개와 "이해가 안 된 부분" 1개를 적은 요약 노트',
    tags: ['FREE', 'ONLINE', 'SOLO'],
  },
  HANDS_EXPERIMENT: {
    activityCode: 'MOCK-ACT-HANDS-EXP',
    kind: 'HANDS_ON',
    title: '집에서 하는 간단한 관찰 기록',
    description: '식물이나 날씨처럼 주변에서 바뀌는 것 하나를 정해 며칠 동안 같은 시간에 관찰하고 기록해요.',
    duration: '하루 10분씩 1주',
    outcome: '관찰하고 기록하는 일이 나에게 맞는지 확인할 수 있어요.',
    exampleOutput: '날짜별 관찰 기록표와 사진 3장',
    tags: ['FREE', 'SOLO'],
  },
  HANDS_REPORT: {
    activityCode: 'MOCK-ACT-HANDS-REPORT',
    kind: 'HANDS_ON',
    title: '관련 기사 3개 읽고 한 쪽 정리하기',
    description: '관심 전공과 관련된 최근 기사 3개를 찾아 공통 주제와 내 생각을 한 쪽으로 정리해요.',
    duration: '1~2시간',
    outcome: '그 분야에서 요즘 어떤 문제를 다루는지 알 수 있어요.',
    exampleOutput: '기사 출처 3개와 요약·생각을 담은 한 쪽 글',
    tags: ['FREE', 'ONLINE', 'SOLO'],
  },
  HANDS_SHORT: {
    activityCode: 'MOCK-ACT-HANDS-SHORT',
    kind: 'HANDS_ON',
    title: '전공 용어 5개 찾아 내 말로 풀어보기',
    description: '교육과정표에서 낯선 과목 이름이나 용어 5개를 골라 뜻을 찾아보고 내 말로 한 줄씩 적어요.',
    duration: '30분',
    outcome: '짧은 시간에 그 전공에서 쓰는 말과 개념에 익숙해질 수 있어요.',
    exampleOutput: '용어 5개와 한 줄 설명',
    tags: ['FREE', 'ONLINE', 'SOLO'],
  },
  COMPARE_READ: {
    activityCode: 'MOCK-ACT-COMPARE',
    kind: 'COMPARE_ASK',
    title: '두 학과의 차이 한 가지 찾아보기',
    description: '후보 두 학과의 재학생 후기나 학과 Q&A에서 "수업에서 가장 많이 하는 활동"을 비교해봐요.',
    duration: '30분~1시간',
    outcome: '비슷해 보이는 두 학과의 실제 공부 방식 차이를 알 수 있어요.',
    exampleOutput: '두 학과를 나란히 적은 3줄짜리 비교표',
    tags: ['FREE', 'ONLINE', 'SOLO'],
  },
  COMPARE_ASK: {
    activityCode: 'MOCK-ACT-COMPARE-ASK',
    kind: 'COMPARE_ASK',
    title: '선배나 재학생에게 질문 하나 해보기',
    description: '후보 학과에 다니는 선배나 학과 온라인 상담 창구에 "1학년 때 가장 힘들었던 과목"을 물어봐요.',
    duration: '30분~1시간',
    outcome: '자료에서 찾기 어려운 실제 경험을 들을 수 있어요.',
    exampleOutput: '질문 1개와 받은 답을 정리한 메모',
    tags: ['FREE', 'ONLINE', 'WITH_OTHERS'],
  },
};

const ACTIVITIES: Activity[] = [POOL.INFO_CURRICULUM, POOL.HANDS_PROJECT, POOL.COMPARE_READ];

const RECHECK: ExplorationResult['recheckAxes'] = [
  { metricCode: 'INT_DAT', name: '데이터·정보' },
  { metricCode: 'INT_BIO', name: '생명·바이오' },
  { metricCode: 'INT_EDU', name: '교육' },
];

const READY_GROUPS: ExplorationResult['groups'] = [
  {
    groupCode: 'MOCK-GRP-DATA',
    name: '데이터·통계 전공군',
    summary: '응답에서 숫자나 자료에서 규칙을 찾는 일에 대한 관심이 나타났어요.',
    evidenceLevel: 'CONFIRMED',
    reasonCodes: ['INT_DAT', 'ACT_ANALYZE'],
    majors: [
      {
        majorCode: 'MOCK-M-DS',
        majorId: null,
        name: '데이터사이언스학과',
        evidenceLevel: 'CONFIRMED',
        collapsed: false,
        reasons: [
          { kind: 'INTEREST', reasonCode: 'INT_DAT', text: '자료에서 규칙을 찾는 일에 관심이 있다고 답했어요.' },
          { kind: 'ACTIVITY', reasonCode: 'ACT_ANALYZE', text: '자료를 모아 정리하는 활동을 더 해보고 싶다고 답했어요.' },
          { kind: 'LEARNING', reasonCode: 'DIR_APPLICATION', text: '실제 데이터로 문제를 풀어보는 공부 방식을 골랐어요.' },
        ],
      },
      {
        majorCode: 'MOCK-M-STAT',
        majorId: null,
        name: '통계학과',
        evidenceLevel: 'CONFIRMED',
        collapsed: false,
        reasons: [
          { kind: 'INTEREST', reasonCode: 'INT_DAT', text: '자료에서 규칙을 찾는 일에 관심이 있다고 답했어요.' },
          { kind: 'ACTIVITY', reasonCode: 'ACT_ANALYZE', text: '자료를 모아 정리하는 활동을 더 해보고 싶다고 답했어요.' },
        ],
      },
      {
        majorCode: 'MOCK-M-MATH',
        majorId: null,
        name: '수학과',
        evidenceLevel: 'LOW_EVIDENCE',
        collapsed: false,
        reasons: [{ kind: 'INTEREST', reasonCode: 'INT_DAT', text: '숫자에서 규칙을 찾는 일에 관심이 있다고 답했어요.' }],
      },
    ],
  },
  {
    groupCode: 'MOCK-GRP-BIO',
    name: '생명·바이오 전공군',
    summary: '응답에서 생물이 자라고 변하는 과정에 대한 관심이 나타났어요.',
    evidenceLevel: 'CONFIRMED',
    reasonCodes: ['INT_BIO'],
    majors: [
      {
        majorCode: 'MOCK-M-BIO',
        majorId: null,
        name: '생명과학과',
        evidenceLevel: 'CONFIRMED',
        collapsed: false,
        reasons: [{ kind: 'INTEREST', reasonCode: 'INT_BIO', text: '생물이 변하는 과정을 알아보는 일에 관심이 있다고 답했어요.' }],
      },
      {
        majorCode: 'MOCK-M-BIOMED',
        majorId: null,
        name: '바이오의약학과',
        evidenceLevel: 'LOW_EVIDENCE',
        collapsed: false,
        reasons: [{ kind: 'INTEREST', reasonCode: 'INT_BIO', text: '생물이 변하는 과정을 알아보는 일에 관심이 있다고 답했어요.' }],
      },
    ],
  },
  {
    groupCode: 'MOCK-GRP-EDU',
    name: '교육 전공군',
    summary: '응답에서 다른 사람에게 설명하고 가르치는 일에 대한 관심이 나타났어요.',
    evidenceLevel: 'LOW_EVIDENCE',
    reasonCodes: ['INT_EDU'],
    majors: [
      {
        majorCode: 'MOCK-M-EDU',
        majorId: null,
        name: '교육학과',
        evidenceLevel: 'LOW_EVIDENCE',
        collapsed: false,
        reasons: [{ kind: 'INTEREST', reasonCode: 'INT_EDU', text: '무언가를 설명하고 가르친 시간이 즐거웠다고 답했어요.' }],
      },
      {
        majorCode: 'MOCK-M-MATHEDU',
        majorId: null,
        name: '수학교육과',
        evidenceLevel: 'LOW_EVIDENCE',
        collapsed: true,
        reasons: [{ kind: 'INTEREST', reasonCode: 'INT_EDU', text: '무언가를 설명하고 가르친 시간이 즐거웠다고 답했어요.' }],
      },
    ],
  },
];

const CAUTIONS: ExplorationResult['cautions'] = [
  {
    tagCode: 'MOCK-TAG-LAB',
    majorCode: 'MOCK-M-BIO',
    text: '생명과학과는 실험·실습 수업 비중이 높은 편이에요.',
    checkAction: '학과 교육과정표에서 실험 과목이 몇 개인지, 한 학기에 몇 시간인지 확인해보세요.',
  },
  {
    tagCode: 'MOCK-TAG-MATH',
    majorCode: 'MOCK-M-STAT',
    text: '통계학과는 1학년부터 수학 과목을 함께 배워요.',
    checkAction: '1학년 필수 과목 중 수학 과목 이름을 찾아보고, 고등학교 때 배운 내용과 어떻게 이어지는지 살펴보세요.',
  },
];

const buildResult = (s: MockSession): ExplorationResult => {
  const stage1 = s.issued.filter((i) => i.stage === 'STAGE_1' && i.effective);
  const positive = stage1.filter((i) => i.answerCode === 'AGREE' || i.answerCode === 'STRONGLY_AGREE').length;
  const abstain = stage1.filter((i) => i.answerCode === 'UNKNOWN' || i.answerCode === 'NO_EXPERIENCE').length;
  const base = {
    resultId: s.session.resultId!,
    sessionId: s.session.sessionId,
    resultVersion: 'MOCK_RESULT_V0',
    createdAt: new Date(s.completedAt ?? Date.now()).toISOString(),
    nextActivities: ACTIVITIES,
  };
  if (positive === 0) {
    return {
      ...base,
      status: 'NO_SUPPORTED_CANDIDATE',
      groups: [],
      cautions: [],
      recheckAxes: RECHECK,
      notes: ['응답에서 뚜렷하게 나타난 관심 분야를 아직 찾지 못했어요. 작은 활동을 해본 뒤 다시 검사해보면 달라질 수 있어요.'],
    };
  }
  if (abstain >= 3) {
    return {
      ...base,
      status: 'LOW_EVIDENCE',
      groups: READY_GROUPS.slice(0, 2).map((g) => ({
        ...g,
        evidenceLevel: 'LOW_EVIDENCE',
        majors: g.majors.slice(0, 2).map((m) => ({ ...m, evidenceLevel: 'LOW_EVIDENCE' })),
      })),
      cautions: CAUTIONS.slice(0, 1),
      recheckAxes: RECHECK.slice(0, 2),
      notes: ['"잘 모르겠음"으로 답한 질문이 많아서 아직 판단할 정보가 충분하지 않은 부분이 있어요.'],
    };
  }
  return { ...base, status: 'READY', groups: READY_GROUPS, cautions: CAUTIONS, recheckAxes: [], notes: [] };
};

export const getResult = (sessionId: number) =>
  delay((): ExplorationResultResponse => {
    const s = getMock(load(), sessionId);
    if (s.session.status !== 'completed' || !s.session.resultId) throw fail(404, 'RESOURCE_NOT_FOUND');
    const elapsed = Date.now() - (s.completedAt ?? 0);
    if (elapsed < GENERATING_MS) return { state: 'GENERATING', retryAfterMs: 500 };
    return { state: 'READY', result: buildResult(s) };
  });

// ---- 후보 전공 비교 ----
// 전공 프로필 문구는 임시 샘플이다 (실제 승인된 전공 프로필 아님)
const PROFILES: Record<string, Omit<ComparisonMajorProfile, 'majorCode' | 'name' | 'groupName'>> = {
  'MOCK-M-DS': {
    learning: ['프로그래밍 기초와 데이터 처리', '통계와 머신러닝 입문', '데이터베이스'],
    activities: ['실제 데이터를 모아 정리하는 프로젝트', '분석 결과를 시각화해 발표하기'],
    careerDirections: ['데이터 분석', '서비스 기획·운영 데이터 업무', '대학원 진학(데이터·AI)'],
    checkPoints: ['코딩 과제 비중이 어느 정도인지 교육과정표로 확인해보세요.'],
  },
  'MOCK-M-STAT': {
    learning: ['확률과 통계 이론', '회귀분석·실험계획', '통계 소프트웨어 활용'],
    activities: ['조사 자료를 분석해 결론의 신뢰도 따져보기', '수식으로 모형 세우기'],
    careerDirections: ['조사·연구 기관 통계 업무', '데이터 분석', '대학원 진학(통계)'],
    checkPoints: ['1학년 수학 과목이 몇 개인지 확인해보세요.'],
  },
  'MOCK-M-MATH': {
    learning: ['해석학·대수학 등 수학 이론', '증명 중심 수업'],
    activities: ['개념을 증명하며 원리 이해하기', '문제를 오래 붙잡고 풀어보기'],
    careerDirections: ['수학 교육', '금융·보험 수리 업무', '대학원 진학(수학)'],
    checkPoints: ['증명 위주의 수업 방식이 어떤지 강의 자료를 찾아 살펴보세요.'],
  },
  'MOCK-M-BIO': {
    learning: ['세포·분자생물학', '유전학', '생화학'],
    activities: ['실험 설계와 결과 기록', '논문 읽고 정리하기'],
    careerDirections: ['생명과학 연구', '바이오 기업 연구·품질 업무', '대학원 진학(생명과학)'],
    checkPoints: ['실험 과목 수와 실험 시간이 어느 정도인지 확인해보세요.'],
  },
  'MOCK-M-BIOMED': {
    learning: ['의약품 개발 기초', '생화학·약리학 입문', '바이오 공정'],
    activities: ['실험실 실습', '신약 개발 과정 사례 조사'],
    careerDirections: ['제약·바이오 기업', '임상·품질 관리 업무', '대학원 진학'],
    checkPoints: ['화학 과목 비중이 어느 정도인지 확인해보세요.'],
  },
  'MOCK-M-EDU': {
    learning: ['교육학 이론', '교육 심리·평가', '교육 프로그램 설계'],
    activities: ['수업이나 프로그램을 직접 설계해보기', '현장 관찰과 토론'],
    careerDirections: ['교육 기관 운영·기획', '교육 콘텐츠 개발', '대학원 진학(교육학)'],
    checkPoints: ['교원 자격과 관련된 과정이 있는지 학과 안내를 확인해보세요.'],
  },
  'MOCK-M-MATHEDU': {
    learning: ['수학 내용학', '수학 교수법', '교육 실습'],
    activities: ['수학 개념을 설명하는 수업 시연', '학교 현장 실습'],
    careerDirections: ['중등 수학 교사', '수학 교육 콘텐츠 개발'],
    checkPoints: ['교육 실습 시기와 기간을 확인해보세요.'],
  },
};

export const getComparison = (resultId: number, majorCodes: string[]) =>
  delay((): ExplorationComparison => {
    const s = Object.values(load().sessions).find((x) => x.session.resultId === resultId);
    if (!s) throw fail(404, 'RESOURCE_NOT_FOUND');
    const result = buildResult(s);
    const cards = result.groups.flatMap((g) => g.majors.map((m) => ({ ...m, groupName: g.name })));
    const unique = [...new Set(majorCodes)];
    if (unique.length < 2 || unique.length > 3) throw fail(400, 'INVALID_REQUEST');
    const majors = unique.map((code) => {
      const card = cards.find((c) => c.majorCode === code);
      const profile = PROFILES[code];
      if (!card || !profile) throw fail(422, 'INVALID_REQUEST');
      return { majorCode: code, name: card.name, groupName: card.groupName, ...profile };
    });
    const sameGroup = new Set(majors.map((m) => m.groupName)).size === 1;
    return {
      resultId,
      majors,
      commonPoints: sameGroup
        ? [`모두 ${majors[0].groupName}에 속해서, 기초 과목이 겹치는 부분이 있어요.`]
        : ['모두 이번 응답에서 먼저 탐색해볼 후보로 나온 전공이에요.'],
      differences: majors.map((m) => `${m.name} · 주로 배우는 것: ${m.learning[0]} / 자주 하는 활동: ${m.activities[0]}`),
      sourceNote: '전공 프로필은 mock 샘플 문구예요. 실제 서비스에서는 검토를 거친 전공 프로필 자료를 사용해요.',
    };
  });

// ---- 결과 후 선택 질문: 탐색 활동 선호 (EXPLORATION_ACTIVITY) ----
// 문항은 임시 샘플. 응답은 활동 목록만 바꾸고 추천 전공·순서는 바꾸지 않는다.
const SUPPORT_QUESTIONS: SampleQuestion[] = [
  {
    questionId: 'MOCK-PR-TIME',
    stage: 'STAGE_3',
    text: '탐색 활동에 일주일에 쓸 수 있는 시간은 어느 정도인가요?',
    options: [
      { code: 'TIME_SHORT', text: '30분 정도', order: 1 },
      { code: 'TIME_MID', text: '1~2시간', order: 2 },
      { code: 'TIME_LONG', text: '3시간 이상', order: 3 },
      { code: 'UNKNOWN', text: '잘 모르겠음', order: 4 },
    ],
  },
  {
    questionId: 'MOCK-PR-COST',
    stage: 'STAGE_3',
    text: '비용이 드는 활동도 괜찮나요?',
    options: [
      { code: 'FREE_ONLY', text: '무료 활동만 하고 싶어요', order: 1 },
      { code: 'COST_OK', text: '조금은 괜찮아요', order: 2 },
      { code: 'UNKNOWN', text: '잘 모르겠음', order: 3 },
    ],
  },
  {
    questionId: 'MOCK-PR-PLACE',
    stage: 'STAGE_3',
    text: '어디에서 하는 활동이 편한가요?',
    options: [
      { code: 'ONLINE_ONLY', text: '온라인으로 할 수 있는 활동', order: 1 },
      { code: 'ANY_PLACE', text: '직접 가보는 활동도 괜찮아요', order: 2 },
      { code: 'UNKNOWN', text: '잘 모르겠음', order: 3 },
    ],
  },
  {
    questionId: 'MOCK-PR-PEOPLE',
    stage: 'STAGE_3',
    text: '다른 사람에게 물어보거나 함께하는 활동도 괜찮나요?',
    options: [
      { code: 'SOLO', text: '혼자 하는 활동이 편해요', order: 1 },
      { code: 'WITH_OTHERS_OK', text: '물어보거나 함께해도 좋아요', order: 2 },
      { code: 'UNKNOWN', text: '잘 모르겠음', order: 3 },
    ],
  },
  {
    questionId: 'MOCK-PR-KIND',
    stage: 'STAGE_3',
    text: '어떤 방식의 활동을 해보고 싶나요?',
    options: [
      { code: 'READ', text: '강의나 글을 보고 정리하기', order: 1 },
      { code: 'PROJECT', text: '직접 무언가 만들어보기', order: 2 },
      { code: 'EXPERIMENT', text: '관찰하거나 실험해보기', order: 3 },
      { code: 'REPORT', text: '조사해서 짧게 써보기', order: 4 },
      { code: 'UNKNOWN', text: '잘 모르겠음', order: 5 },
    ],
  },
];

const findByResult = (db: MockDb, resultId: number) => {
  const s = Object.values(db.sessions).find((x) => x.session.resultId === resultId);
  if (!s) throw fail(404, 'RESOURCE_NOT_FOUND');
  return s;
};

const toSupportSession = (resultId: number, sup: NonNullable<MockSession['support']>): SupportSession => ({
  resultId,
  purpose: sup.purpose,
  supportRevision: sup.revision,
  issuedQuestions: sup.issued,
  answers: Object.entries(sup.answers).map(([issuedId, optionCode]) => ({ issuedId: Number(issuedId), optionCode })),
});

export const startSupport = (resultId: number, purpose: SupportPurpose) =>
  delay((): SupportSession => {
    const db = load();
    const s = findByResult(db, resultId);
    if (!s.support) {
      s.support = {
        purpose,
        revision: 1,
        issued: SUPPORT_QUESTIONS.map((q) => toIssued(q, ++db.issuedSeq)),
        answers: {},
        mutations: {},
      };
      save(db);
    }
    return toSupportSession(resultId, s.support);
  });

export const saveSupportAnswer = (
  resultId: number,
  issuedId: number,
  body: { optionCode: string; expectedRevision: number; clientMutationId: string },
) =>
  delay((): SupportAnswerResponse => {
    const db = load();
    const sup = findByResult(db, resultId).support;
    if (!sup) throw fail(404, 'RESOURCE_NOT_FOUND');
    const replay = sup.mutations[body.clientMutationId];
    if (replay) return replay;
    if (sup.revision !== body.expectedRevision) throw fail(409, 'STALE_REVISION');
    const q = sup.issued.find((i) => i.issuedId === issuedId);
    if (!q) throw fail(404, 'RESOURCE_NOT_FOUND');
    if (!q.options.some((o) => o.code === body.optionCode)) throw fail(422, 'OPTION_NOT_ISSUED');
    sup.answers[issuedId] = body.optionCode;
    sup.revision += 1;
    const res: SupportAnswerResponse = {
      supportRevision: sup.revision,
      issuedId,
      optionCode: body.optionCode,
      remaining: sup.issued.filter((i) => !sup.answers[i.issuedId]).length,
    };
    sup.mutations[body.clientMutationId] = res;
    save(db);
    return res;
  });

// D-21: 시간·비용·접근 제약이 있으면 무료·온라인·혼자 하는 활동으로 교체
const personalize = (sup: MockSession['support']) => {
  const answerOf = (qid: string) => {
    const issued = sup?.issued.find((i) => i.questionId === qid);
    return issued ? sup?.answers[issued.issuedId] : undefined;
  };
  const kind = answerOf('MOCK-PR-KIND');
  const notes: string[] = [];
  let hands = POOL.HANDS_PROJECT;
  if (kind === 'READ') hands = POOL.HANDS_READ;
  else if (kind === 'EXPERIMENT') hands = POOL.HANDS_EXPERIMENT;
  else if (kind === 'REPORT') hands = POOL.HANDS_REPORT;
  if (kind && kind !== 'UNKNOWN') notes.push('해보고 싶은 활동 방식');
  if (answerOf('MOCK-PR-TIME') === 'TIME_SHORT') {
    hands = POOL.HANDS_SHORT;
    notes.push('쓸 수 있는 시간');
  }
  if (answerOf('MOCK-PR-PLACE') === 'ONLINE_ONLY' && !hands.tags.includes('ONLINE')) {
    hands = POOL.HANDS_PROJECT;
    notes.push('온라인 활동');
  }
  if (answerOf('MOCK-PR-COST') === 'FREE_ONLY') notes.push('무료 활동');
  let compare = POOL.COMPARE_READ;
  if (answerOf('MOCK-PR-PEOPLE') === 'WITH_OTHERS_OK') {
    compare = POOL.COMPARE_ASK;
    notes.push('사람에게 물어보는 활동');
  }
  return { base: [POOL.INFO_CURRICULUM, hands, compare], notes };
};

const groupCommon = (groupCode: string, groupName: string): Activity[] => [
  {
    ...POOL.INFO_CURRICULUM,
    activityCode: `${groupCode}-INFO`,
    title: `${groupName} 학과 3곳 교육과정 나란히 보기`,
    description: `${groupName}에 속한 학과 3곳의 1학년 과목을 표로 나란히 적어봐요.`,
    exampleOutput: '학과 3곳 × 과목 5개 표',
  },
  {
    ...POOL.HANDS_READ,
    activityCode: `${groupCode}-READ`,
    title: `${groupName} 입문 강의 한 편 듣고 정리하기`,
  },
  {
    ...POOL.HANDS_REPORT,
    activityCode: `${groupCode}-REPORT`,
    title: `${groupName} 분야에서 일하는 사람 인터뷰 기사 읽기`,
    description: '그 분야에서 일하는 사람의 인터뷰 기사 2개를 찾아 하는 일과 필요한 공부를 정리해요.',
    exampleOutput: '인터뷰 2개에서 뽑은 "하는 일" 목록',
  },
];

const majorActivity = (majorCode: string, name: string): Activity => ({
  ...POOL.INFO_CURRICULUM,
  activityCode: `${majorCode}-SYLLABUS`,
  title: `${name} 전공기초 과목 강의계획서 읽기`,
  description: `${name} 1학년 전공기초 과목 하나를 골라 강의계획서의 주차별 내용을 읽어봐요.`,
  outcome: '한 학기 동안 실제로 무엇을 배우는지 구체적으로 알 수 있어요.',
  exampleOutput: '주차별 주제 중 궁금한 3개를 표시한 메모',
});

export const getActivities = (resultId: number) =>
  delay((): ExplorationActivities => {
    const s = findByResult(load(), resultId);
    const result = buildResult(s);
    const answered = s.support ? Object.keys(s.support.answers).length > 0 : false;
    const { base, notes } = answered ? personalize(s.support) : { base: ACTIVITIES, notes: [] as string[] };
    return {
      resultId,
      supportRevision: s.support?.revision ?? null,
      personalized: answered,
      personalizationNote: notes.length > 0 ? `응답한 ${notes.join(', ')}에 맞춰 활동을 골랐어요.` : null,
      base,
      groups: result.groups.map((g) => ({
        groupCode: g.groupCode,
        groupName: g.name,
        common: groupCommon(g.groupCode, g.name),
        majors: g.majors.map((m) => ({ majorCode: m.majorCode, name: m.name, activity: majorActivity(m.majorCode, m.name) })),
      })),
    };
  });

// ---- 결과에 대해 AI에게 묻기 ----
// 실제 AI가 아니라 키워드로 고르는 고정 답변이다. 점수·순위를 새로 계산하지 않고,
// 능력·합격 가능성 질문에는 답하지 않는 정책(D-25)만 흉내 낸다.
const CONSULTATION_BASE = 7000;

const policySource: ConsultationSource = { kind: 'ANSWER_POLICY', title: 'AI 답변 정책', version: 'MOCK_POLICY_V0' };
const metricSource: ConsultationSource = {
  kind: 'METRIC_DEFINITION',
  title: '검사 지표 정의와 해석 제한',
  version: 'MOCK_METRIC_V0',
};
const activitySource: ConsultationSource = {
  kind: 'ACTIVITY_CATALOG',
  title: '탐색 활동 카탈로그 (mock 샘플)',
  version: 'MOCK_ACTIVITY_V0',
};
const profileSource = (name: string): ConsultationSource => ({
  kind: 'MAJOR_PROFILE',
  title: `${name} 전공 프로필 (mock 샘플)`,
  version: 'MOCK_PROFILE_V0',
});

const answerFor = (s: MockSession, question: string): Pick<ExplorationChatMessage, 'content' | 'sources' | 'evidenceStatus'> => {
  const result = buildResult(s);
  const resultSource: ConsultationSource = {
    kind: 'RESULT_SNAPSHOT',
    title: `검사 결과 스냅샷 (결과 ${result.resultId})`,
    version: result.resultVersion,
  };
  const cards = result.groups.flatMap((g) => g.majors);
  const mentioned = cards.filter((m) => question.includes(m.name.replace(/학과$|학부$/, '')));

  if (/합격|붙을|취업|연봉|잘할|재능|적성|성격|능력/.test(question)) {
    return {
      content:
        '이 검사는 합격·취업 가능성이나 능력, 적성을 판단하지 않아요. 그래서 그 부분은 답할 수 없어요.\n대신 결과에 나온 관심과 활동을 바탕으로 무엇을 먼저 확인해보면 좋을지는 함께 볼 수 있어요.',
      sources: [policySource, metricSource],
      evidenceStatus: 'GROUNDED',
    };
  }

  if (mentioned.length >= 2 || /비교|차이/.test(question)) {
    const pair = mentioned.slice(0, 2).filter((m) => PROFILES[m.majorCode]);
    if (pair.length < 2) {
      return {
        content: `어떤 두 전공을 비교할지 알려주시면 결과에 있는 전공 중에서 비교해드릴게요.\n결과에 있는 전공: ${cards.map((m) => m.name).join(', ') || '없음'}`,
        sources: [resultSource],
        evidenceStatus: 'GROUNDED',
      };
    }
    const lines = pair.map((m) => {
      const p = PROFILES[m.majorCode];
      return `· ${m.name} — 주로 배우는 것: ${p.learning[0]} / 자주 하는 활동: ${p.activities[0]}`;
    });
    return {
      content: ['두 전공의 차이를 등록된 전공 정보로 정리했어요.', ...lines, '어느 쪽이 더 낫다는 뜻은 아니에요. 직접 해보고 싶은 활동이 어느 쪽에 더 가까운지 살펴보세요.'].join('\n'),
      sources: [resultSource, ...pair.map((m) => profileSource(m.name))],
      evidenceStatus: 'GROUNDED',
    };
  }

  if (/활동/.test(question)) {
    const lines = ACTIVITIES.map((a) => `· ${a.title} (${a.duration}) — ${a.outcome}`);
    return {
      content: ['결과에 나온 탐색 활동은 이런 것을 알아보기 위한 거예요.', ...lines].join('\n'),
      sources: [activitySource, resultSource],
      evidenceStatus: 'GROUNDED',
    };
  }

  if (/왜|이유|결과|추천|나왔/.test(question)) {
    if (result.groups.length === 0) {
      return {
        content: [...result.notes, '응답에서 뚜렷하게 나타난 관심 분야가 아직 없어서 특정 전공을 고르지 않았어요.'].join('\n'),
        sources: [resultSource, metricSource],
        evidenceStatus: 'GROUNDED',
      };
    }
    const lines = result.groups.map((g) => `· ${g.name}: ${g.summary}`);
    return {
      content: ['응답에서 나타난 점을 바탕으로 먼저 탐색해볼 전공군을 골랐어요.', ...lines, '이 순서는 먼저 살펴보기 좋은 차례일 뿐, 잘하거나 못하는 정도를 뜻하지 않아요.'].join('\n'),
      sources: [resultSource, metricSource],
      evidenceStatus: 'GROUNDED',
    };
  }

  return {
    content:
      '등록된 검사 결과와 전공 정보만으로는 이 질문에 답하기 어려워요. 추가 확인이 필요해요.\n결과가 나온 이유, 두 전공의 차이, 탐색 활동에 대해서는 답할 수 있어요.',
    sources: [],
    evidenceStatus: 'INSUFFICIENT',
  };
};

export const openConsultation = (resultId: number) =>
  delay((): ExplorationConsultation => {
    const db = load();
    const s = findByResult(db, resultId);
    if (!s.consultation) {
      s.consultation = { messages: [], mutations: {} };
      save(db);
    }
    return { consultationId: CONSULTATION_BASE + s.session.sessionId, resultId, messages: s.consultation.messages };
  });

export const ask = (consultationId: number, content: string, clientMutationId: string) =>
  new Promise<ExplorationAskResponse>((resolve, reject) => {
    setTimeout(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        reject(new Error('offline'));
        return;
      }
      try {
        const db = load();
        const s = db.sessions[consultationId - CONSULTATION_BASE];
        if (!s?.consultation) throw fail(404, 'RESOURCE_NOT_FOUND');
        const replay = s.consultation.mutations[clientMutationId];
        if (replay) {
          resolve(replay);
          return;
        }
        const text = content.trim();
        if (!text) throw fail(400, 'INVALID_REQUEST');
        const now = new Date().toISOString();
        const userMessage: ExplorationChatMessage = {
          id: ++db.issuedSeq,
          role: 'user',
          content: text,
          createdAt: now,
          sources: [],
          evidenceStatus: null,
        };
        const assistantMessage: ExplorationChatMessage = {
          id: ++db.issuedSeq,
          role: 'assistant',
          createdAt: now,
          ...answerFor(s, text),
        };
        const res = { userMessage, assistantMessage };
        s.consultation.messages.push(userMessage, assistantMessage);
        s.consultation.mutations[clientMutationId] = res;
        save(db);
        resolve(res);
      } catch (e) {
        reject(e);
      }
    }, 900);
  });

// ---- 12주 탐색 계획 ----
// 실제 AI 생성이 아니라 전공 프로필 샘플로 채운 고정 틀이다.
// localStorage 'jinroon.exploration.mock.failPlan' = '1' 이면 생성 실패를 흉내 낸다.
const PLAN_GENERATING_MS = 2000;
const PLAN_BASE = 80000;

const buildWeeks = (name: string, majorCode: string): PlanWeek[] => {
  const p = PROFILES[majorCode];
  const learn = p?.learning ?? ['전공 기초 과목'];
  const acts = p?.activities ?? ['작은 프로젝트'];
  const info: PlanWeek[] = [
    { week: 1, phase: 'INFO', title: '교육과정 훑어보기', tasks: [`${name} 1~2학년 교육과정표 찾기`, '과목 이름 중 궁금한 3개 표시'], expectedOutput: '궁금한 과목 3개 메모' },
    { week: 2, phase: 'INFO', title: '학과 소개 비교', tasks: ['같은 이름의 학과 2곳 홈페이지 비교', '학과마다 강조하는 점 한 줄씩 적기'], expectedOutput: '학과 2곳 비교 메모' },
    { week: 3, phase: 'INFO', title: '졸업 후 진로 살펴보기', tasks: ['학과 홈페이지의 졸업생 진로 안내 읽기', '관심 가는 진로 1개 고르기'], expectedOutput: '진로 1개와 고른 이유' },
    { week: 4, phase: 'INFO', title: '궁금한 점 정리', tasks: ['1~3주에 알게 된 점 정리', '아직 모르는 점 3개 적기'], expectedOutput: '알게 된 점·모르는 점 목록' },
  ];
  const basic: PlanWeek[] = [0, 1, 2, 3].map((i) => ({
    week: 5 + i,
    phase: 'BASIC_LEARNING' as const,
    title: i < learn.length ? `${learn[i]} 맛보기` : '기초 개념 복습',
    tasks: ['입문 강의나 글 한 편 보기', '핵심 개념 3개를 내 말로 정리'],
    expectedOutput: '개념 요약 노트 1쪽',
  }));
  const small: PlanWeek[] = [0, 1, 2, 3].map((i) => ({
    week: 9 + i,
    phase: 'SMALL_ACTIVITY' as const,
    title: i < 2 ? `${acts[i % acts.length]} 해보기` : i === 2 ? '선배나 재학생에게 질문하기' : '12주 돌아보기',
    tasks:
      i < 3
        ? ['1~2시간 안에 끝낼 수 있는 크기로 정하기', '해보면서 느낀 점 기록']
        : ['처음 궁금했던 점이 풀렸는지 확인', '계속 탐색할지, 다른 전공을 볼지 정하기'],
    expectedOutput: i < 3 ? '활동 결과물과 느낀 점 세 줄' : '돌아보기 메모',
  }));
  return [...info, ...basic, ...small];
};

const planStatusOf = (plan: ExplorationPlan & { requestedAt: number; willFail: boolean }): PlanStatus => {
  if (Date.now() - plan.requestedAt < PLAN_GENERATING_MS) return 'GENERATING';
  return plan.willFail ? 'FAILED' : 'READY';
};

const publicPlan = (plan: ExplorationPlan & { requestedAt: number; willFail: boolean }): ExplorationPlan => {
  const status = planStatusOf(plan);
  return {
    planId: plan.planId,
    resultId: plan.resultId,
    majorCode: plan.majorCode,
    majorName: plan.majorName,
    status,
    createdAt: plan.createdAt,
    supportRevision: plan.supportRevision,
    weeks: status === 'READY' ? plan.weeks : [],
    sources: status === 'READY' ? plan.sources : [],
  };
};

const shouldFail = () => {
  try {
    return localStorage.getItem('jinroon.exploration.mock.failPlan') === '1';
  } catch {
    return false;
  }
};

export const createPlan = (resultId: number, majorCode: string, supportRevision: number | null) =>
  delay((): ExplorationPlan => {
    const db = load();
    const s = findByResult(db, resultId);
    const card = buildResult(s).groups.flatMap((g) => g.majors).find((m) => m.majorCode === majorCode);
    if (!card) throw fail(422, 'INVALID_REQUEST');
    s.plans = s.plans ?? [];
    // 같은 전공의 실패한 계획은 새로 만들지 않고 그 계획만 다시 생성한다
    const failed = s.plans.find((p) => p.majorCode === majorCode && planStatusOf(p) === 'FAILED');
    const now = Date.now();
    if (failed) {
      failed.requestedAt = now;
      failed.willFail = shouldFail();
      save(db);
      return publicPlan(failed);
    }
    const plan = {
      planId: PLAN_BASE + ++db.issuedSeq,
      resultId,
      majorCode,
      majorName: card.name,
      status: 'GENERATING' as PlanStatus,
      createdAt: new Date(now).toISOString(),
      supportRevision,
      weeks: buildWeeks(card.name, majorCode),
      sources: [
        { kind: 'RESULT_SNAPSHOT' as const, title: `검사 결과 스냅샷 (결과 ${resultId})`, version: 'MOCK_RESULT_V0' },
        { kind: 'MAJOR_PROFILE' as const, title: `${card.name} 전공 프로필 (mock 샘플)`, version: 'MOCK_PROFILE_V0' },
        { kind: 'ACTIVITY_CATALOG' as const, title: '탐색 활동 카탈로그 (mock 샘플)', version: 'MOCK_ACTIVITY_V0' },
      ],
      requestedAt: now,
      willFail: shouldFail(),
    };
    s.plans.push(plan);
    save(db);
    return publicPlan(plan);
  });

export const listPlans = (resultId: number) =>
  delay((): ExplorationPlanSummary[] => {
    const s = findByResult(load(), resultId);
    return (s.plans ?? [])
      .map((p) => publicPlan(p))
      .map(({ planId, resultId: rid, majorCode, majorName, status, createdAt }) => ({
        planId,
        resultId: rid,
        majorCode,
        majorName,
        status,
        createdAt,
      }))
      .sort((a, b) => b.planId - a.planId);
  });

export const getPlan = (planId: number) =>
  delay((): ExplorationPlan => {
    const plan = Object.values(load().sessions)
      .flatMap((s) => s.plans ?? [])
      .find((p) => p.planId === planId);
    if (!plan) throw fail(404, 'RESOURCE_NOT_FOUND');
    return publicPlan(plan);
  });
