import api, { publicApi } from './axios';
import { isExplorationMock } from '../config/features';
import * as mock from './explorationMock';
import type {
  AdvanceResponse,
  BackendComparisonMajor,
  BackendExplorationComparison,
  BackendExplorationResult,
  ComparisonMajorProfile,
  CompleteResponse,
  ExplorationActivities,
  ExplorationAskResponse,
  ExplorationComparison,
  ExplorationConsultation,
  ExplorationErrorCode,
  ExplorationMajorCard,
  ExplorationMajorProfile,
  ExplorationPlan,
  ExplorationPlanSummary,
  ExplorationResult,
  ExplorationResultResponse,
  ExplorationSession,
  ExplorationShareState,
  ExplorationSessionDetail,
  ExplorationSessionSummary,
  NextQuestionsResponse,
  SaveAnswerRequest,
  SaveAnswerResponse,
  SharedExplorationResult,
  SupportAnswerResponse,
  SupportPurpose,
  SupportSession,
} from '../types/exploration';

const BASE = '/exploration/v1';

const newKey = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const idem = (key: string = newKey()) => ({ headers: { 'Idempotency-Key': key } });

export const createMutationId = newKey;

export const startExplorationSession = () =>
  isExplorationMock
    ? mock.startSession()
    : api
        .post<ExplorationSession>(`${BASE}/sessions`, { diagnosisType: 'EXPLORATION_V1' }, idem())
        .then((r) => r.data);

export const getExplorationSession = (sessionId: number) =>
  isExplorationMock
    ? mock.getSession(sessionId)
    : api.get<ExplorationSessionDetail>(`${BASE}/sessions/${sessionId}`).then((r) => r.data);

export const listExplorationSessions = () =>
  isExplorationMock
    ? mock.listSessions()
    : api
        .get<ExplorationSessionSummary[]>(`${BASE}/sessions`, { params: { type: 'EXPLORATION_V1' } })
        .then((r) => r.data);

export const requestNextQuestions = (sessionId: number, expectedRevision: number) =>
  isExplorationMock
    ? mock.next(sessionId, expectedRevision)
    : api
        .post<NextQuestionsResponse>(`${BASE}/sessions/${sessionId}/next`, { expectedRevision }, idem())
        .then((r) => r.data);

// clientMutationId를 Idempotency-Key로도 사용해 재시도 시 같은 키가 나가게 한다
export const saveExplorationAnswer = (sessionId: number, issuedId: number, body: SaveAnswerRequest) =>
  isExplorationMock
    ? mock.saveAnswer(sessionId, issuedId, body)
    : api
        .put<SaveAnswerResponse>(
          `${BASE}/sessions/${sessionId}/answers/${issuedId}`,
          body,
          idem(body.clientMutationId),
        )
        .then((r) => r.data);

export const advanceExplorationStage = (sessionId: number, expectedRevision: number) =>
  isExplorationMock
    ? mock.advance(sessionId, expectedRevision)
    : api
        .post<AdvanceResponse>(`${BASE}/sessions/${sessionId}/advance`, { expectedRevision }, idem())
        .then((r) => r.data);

// 백엔드 결과 DTO를 화면이 쓰는 형태로 옮긴다.
// 전공은 전공군에 중첩되지 않고 평면 배열(majorSummaries)로 오므로 전공군의 majorCodes로 다시 묶는다.
// 서버가 주지 않는 전공군 이름·요약, 전공별 근거 문장, 주의 태그 문구, 재확인 축은
// 만들어내지 않고 비워 둔다 — 화면이 해당 영역을 숨긴다 (JinroOn/JOBE#95).
export const toExplorationResult = (dto: BackendExplorationResult): ExplorationResult => {
  const byCode = new Map(dto.majors.map((major) => [major.majorCode, major]));
  const toCard = (major: BackendExplorationResult['majors'][number]): ExplorationMajorCard => ({
    majorCode: major.majorCode,
    majorId: major.majorId ?? null,
    name: major.name ?? major.majorName,
    reasons: major.reasons ?? [],
    evidenceLevel: major.evidenceLevel,
    collapsed: major.collapsed ?? false,
    explanation: major.explanation,
  });
  return {
    resultId: dto.resultId,
    sessionId: dto.sessionId,
    status: dto.status,
    resultVersion: dto.resultVersion,
    createdAt: dto.completedAt,
    groups: dto.groups.map((group) => ({
      groupCode: group.groupCode,
      name: group.name ?? '',
      summary: group.summary ?? '',
      evidenceLevel: group.evidenceLevel,
      reasonCodes: group.reasonCodes ?? dto.reasonCodes,
      majors: group.majorCodes
        .map((code) => byCode.get(code))
        .filter((major) => major !== undefined)
        .map(toCard),
    })),
    // #103 이후 cautions는 서버가 승인 조건을 확인한 안내다. 이전 준비 응답과 섞지 않는다.
    cautions: dto.cautions.filter((caution) => 'tagCode' in caution),
    preparationResponses: dto.preparationResponses ?? dto.cautions.filter((caution) => 'questionId' in caution),
    nextActivities: dto.nextActivities,
    recheckAxes: (dto.recheckAxes ?? []).filter((axis) => axis.name?.trim()),
    notes: [],
    capabilities: dto.capabilities,
    activityAvailability: dto.activityAvailability,
    activityMessage: dto.activityMessage,
    testOnly: dto.testOnly,
    displayTextMissing: dto.groups.some((group) => !group.name?.trim()),
    displayVersion: dto.displayVersion,
    displaySource: dto.displaySource,
    cautionAvailability: dto.cautionAvailability ?? 'UNAVAILABLE',
    cautionUnavailableReason: dto.cautionUnavailableReason,
  };
};

// complete 응답은 결과 DTO 전체다(GET result와 같은 본문). 결과 화면이 다시 조회하지 않도록 그대로 돌려준다.
export const completeExplorationSession = (sessionId: number, expectedRevision: number): Promise<CompleteResponse> =>
  isExplorationMock
    ? mock.complete(sessionId, expectedRevision)
    : api
        .post<BackendExplorationResult>(`${BASE}/sessions/${sessionId}/complete`, { expectedRevision }, idem())
        .then((r) => toExplorationResult(r.data));

// 완료된 회차면 200, 완료 전이면 404 RESOURCE_NOT_FOUND다.
// 백엔드는 결과를 complete 요청 안에서 동기로 만들므로 202·Retry-After는 내려오지 않는다 (JOFE#113).
export const getExplorationResult = (sessionId: number): Promise<ExplorationResultResponse> =>
  isExplorationMock
    ? mock.getResult(sessionId)
    : api
        .get<BackendExplorationResult>(`${BASE}/sessions/${sessionId}/result`)
        .then((r) => ({ state: 'READY' as const, result: toExplorationResult(r.data) }));

// 백엔드 쌍 비교 DTO를 화면 형태로 옮긴다.
// 축(learningSets·activityAxes·primaryInterestAxes)은 코드만 오고 진로·준비 정보는 NOT_PROVIDED라
// 비워 둔다. 사람이 읽을 문장은 comparisonSets의 descriptions뿐이다. (JOFE#118, JinroOn/JOBE#100)
export const toExplorationComparison = (
  dto: BackendExplorationComparison,
  resultId: number,
): ExplorationComparison => {
  const toProfile = (major: BackendComparisonMajor): ComparisonMajorProfile => ({
    majorCode: major.majorCode,
    name: major.majorName,
    groupName: major.groupName ?? '',
    learning: [],
    activities: [],
    careerDirections: [],
    checkPoints: [],
  });
  const directions = (rows: { directionCode: string; descriptions: { text: string }[] }[]) =>
    rows.map((row) => ({ directionCode: row.directionCode, descriptions: row.descriptions.map((d) => d.text) }));
  return {
    resultId,
    majors: [dto.left, dto.right].filter((major) => major !== undefined).map(toProfile),
    commonPoints: [],
    differences: [],
    sourceNote: dto.message ?? '',
    comparisonSets: (dto.comparisonSets ?? []).map((set) => ({
      comparisonSet: set.comparisonSet,
      left: directions(set.leftDirections),
      right: directions(set.rightDirections),
      focusResponses: set.focusResponses ?? [],
    })),
    comparisonState: dto.comparisonState ?? null,
    skippedComparisonSets: dto.skippedComparisonSets ?? [],
    available: dto.available,
    candidateChoices: (dto.candidateChoices ?? []).map((major) => ({
      majorCode: major.majorCode,
      name: major.majorName,
      groupName: major.groupName ?? '',
    })),
    reasonCode: dto.reasonCode,
  };
};

// 백엔드는 쌍 비교만 지원한다. query key 집합이 정확히 leftMajorCode+rightMajorCode여야 하고
// majorCodes 같은 다른 키를 보내면 400 INVALID_REQUEST다. (JOFE#118)
export const getExplorationComparison = (resultId: number, pair?: readonly [string, string]) =>
  isExplorationMock
    ? mock.getComparison(resultId, pair).then((dto) => toExplorationComparison(dto, resultId))
    : api
        .get<BackendExplorationComparison>(`${BASE}/results/${resultId}/comparison`, {
          params: pair ? { leftMajorCode: pair[0], rightMajorCode: pair[1] } : undefined,
        })
        .then((r) => toExplorationComparison(r.data, resultId));

export const getExplorationActivities = (resultId: number) =>
  isExplorationMock
    ? mock.getActivities(resultId)
    : api.get<ExplorationActivities>(`${BASE}/results/${resultId}/activities`).then((r) => r.data);

// 이미 시작한 결과 후 질문이 있으면 같은 회차를 돌려받는다고 가정한다
export const startExplorationSupport = (resultId: number, purpose: SupportPurpose) =>
  isExplorationMock
    ? mock.startSupport(resultId, purpose)
    : api.post<SupportSession>(`${BASE}/results/${resultId}/support`, { purpose }, idem()).then((r) => r.data);

export const saveExplorationSupportAnswer = (
  resultId: number,
  issuedId: number,
  body: { optionCode: string; expectedRevision: number; clientMutationId: string },
) =>
  isExplorationMock
    ? mock.saveSupportAnswer(resultId, issuedId, body)
    : api
        .put<SupportAnswerResponse>(
          `${BASE}/results/${resultId}/support/answers/${issuedId}`,
          body,
          idem(body.clientMutationId),
        )
        .then((r) => r.data);

// 같은 결과의 상담이 있으면 이어서 연다고 가정한다
export const openExplorationConsultation = (resultId: number) =>
  isExplorationMock
    ? mock.openConsultation(resultId)
    : api
        .post<ExplorationConsultation>(`${BASE}/results/${resultId}/consultations`, {}, idem())
        .then((r) => r.data);

export const askExplorationConsultation = (consultationId: number, content: string, clientMutationId: string) =>
  isExplorationMock
    ? mock.ask(consultationId, content, clientMutationId)
    : api
        .post<ExplorationAskResponse>(
          `${BASE}/consultations/${consultationId}/messages`,
          { content },
          idem(clientMutationId),
        )
        .then((r) => r.data);

// 04 문서 요청은 supportRevision만 있어 선택 전공을 담을 majorCode를 가정해 추가했다
export const createExplorationPlan = (resultId: number, majorCode: string, supportRevision: number | null) =>
  isExplorationMock
    ? mock.createPlan(resultId, majorCode, supportRevision)
    : api
        .post<ExplorationPlan>(`${BASE}/results/${resultId}/plans`, { majorCode, supportRevision }, idem())
        .then((r) => r.data);

export const listExplorationPlans = (resultId: number) =>
  isExplorationMock
    ? mock.listPlans(resultId)
    : api.get<ExplorationPlanSummary[]>(`${BASE}/results/${resultId}/plans`).then((r) => r.data);

export const getExplorationPlan = (planId: number) =>
  isExplorationMock
    ? mock.getPlan(planId)
    : api.get<ExplorationPlan>(`${BASE}/plans/${planId}`).then((r) => r.data);

export const getExplorationShare = (resultId: number) =>
  isExplorationMock
    ? mock.getShare(resultId)
    : api.get<ExplorationShareState>(`${BASE}/results/${resultId}/share`).then((r) => r.data);

// 켜진 링크가 있으면 그대로 돌려받고, 만료·꺼진 링크는 새 토큰으로 만든다고 가정한다
export const createExplorationShare = (resultId: number) =>
  isExplorationMock
    ? mock.createShare(resultId)
    : api.post<ExplorationShareState>(`${BASE}/results/${resultId}/share`, {}, idem()).then((r) => r.data);

export const disableExplorationShare = (resultId: number) =>
  isExplorationMock
    ? mock.disableShare(resultId)
    : api.delete<ExplorationShareState>(`${BASE}/results/${resultId}/share`).then((r) => r.data);

// 공개 결과는 로그인 없이 조회한다
export const getSharedExplorationResult = (token: string) =>
  isExplorationMock
    ? mock.getSharedResult(token)
    : publicApi.get<SharedExplorationResult>(`${BASE}/shares/${encodeURIComponent(token)}`).then((r) => r.data);

export const getExplorationMajorProfile = (majorCode: string) =>
  isExplorationMock
    ? mock.getMajorProfile(majorCode)
    : api
        .get<ExplorationMajorProfile>(`${BASE}/majors/${encodeURIComponent(majorCode)}/profile`)
        .then((r) => r.data);

export const toExplorationErrorCode = (error: unknown): ExplorationErrorCode => {
  const e = error as { response?: { status?: number; data?: { code?: string } } };
  if (!e?.response) return 'NETWORK';
  // 탐색형 전용 advice와 레거시 공통 advice의 코드 체계를 화면에서 통일한다.
  if (e.response.data?.code === 'INVALID_REQUEST') return 'INVALID_INPUT';
  if (e.response.data?.code === 'RESOURCE_NOT_FOUND') return 'NOT_FOUND';
  return (e.response.data?.code as ExplorationErrorCode | undefined) ?? 'UNKNOWN';
};
