
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
  SupportPurpose,
  SupportSelection,
  SupportSession,
  SupportState,
} from '../types/exploration';

const BASE = '/exploration/v1';

const newKey = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const idem = (key: string = newKey()) => ({
  headers: { 'Idempotency-Key': key },
});

export const createMutationId = newKey;

// 실제 백엔드 공유 상태 응답
interface BackendExplorationShareState {
  resultId: number;
  shareRevision: number;
  enabled: boolean;
  available?: boolean;
  issuedAt?: string;
  expiresAt?: string;
  shareToken?: string;
  publicPath?: string;
}

// 실제 백엔드 공개 결과 응답
interface BackendSharedExplorationResult {
  summaryVersion: string;
  runMode: string;
  testOnly: boolean;
  nickname?: string;

  groups: {
    groupCode: string;
    name: string;
    summary: string;
  }[];

  majors: {
    majorName: string;
    groupCode: string;
    explanation: string;
  }[];

  uncertainty: {
    lowEvidence: boolean;
    noSupportedCandidate: boolean;
    interestTie: boolean;
    lowDifferentiation: boolean;
    message: string;
  };

  nextActivities: unknown[];
  activityAvailability: 'NOT_INCLUDED';
  nextSteps: string[];
  expiresAt: string;
}

// 백엔드 공유 상태를 기존 화면 타입으로 변환
const toExplorationShareState = (
  dto: BackendExplorationShareState,
): ExplorationShareState => {
  const expiresAt = dto.expiresAt ?? null;
  const expiryTime = expiresAt ? Date.parse(expiresAt) : Number.NaN;

  let status: ExplorationShareState['status'];

  if (dto.enabled && dto.shareToken) {
    status = 'ACTIVE';
  } else if (!expiresAt) {
    status = 'NONE';
  } else if (Number.isFinite(expiryTime) && expiryTime <= Date.now()) {
    status = 'EXPIRED';
  } else {
    status = 'DISABLED';
  }

  return {
    resultId: dto.resultId,
    status,
    token: dto.shareToken ?? null,
    createdAt: dto.issuedAt ?? null,
    expiresAt,
    shareRevision: dto.shareRevision,
    available: dto.available,
    publicPath: dto.publicPath ?? null,
  };
};

// 백엔드 공개 결과를 화면에서 사용하는 구조로 변환
const toSharedExplorationResult = (
  dto: BackendSharedExplorationResult,
): SharedExplorationResult => {
  const majorsByGroup = new Map<
    string,
    { name: string; reason: string }[]
  >();

  // 백엔드는 majors를 평면 배열로 내려준다.
  // 화면에서는 전공군별로 다시 묶어서 표시한다.
  dto.majors.forEach((major) => {
    const majors = majorsByGroup.get(major.groupCode) ?? [];

    majors.push({
      name: major.majorName,
      reason: major.explanation,
    });

    majorsByGroup.set(major.groupCode, majors);
  });

  return {
    nickname: dto.nickname ?? null,

    groups: dto.groups.map((group) => ({
      groupCode: group.groupCode,
      name: group.name,
      summary: group.summary,
      majors: majorsByGroup.get(group.groupCode) ?? [],
    })),

    uncertainty: dto.uncertainty,
    nextSteps: dto.nextSteps ?? [],
    expiresAt: dto.expiresAt,
  };
};

export const startExplorationSession = () =>
  isExplorationMock
    ? mock.startSession()
    : api
        .post<ExplorationSession>(
          `${BASE}/sessions`,
          { diagnosisType: 'EXPLORATION_V1' },
          idem(),
        )
        .then((r) => r.data);

export const getExplorationSession = (sessionId: number) =>
  isExplorationMock
    ? mock.getSession(sessionId)
    : api
        .get<ExplorationSessionDetail>(
          `${BASE}/sessions/${sessionId}`,
        )
        .then((r) => r.data);

export const listExplorationSessions = () =>
  isExplorationMock
    ? mock.listSessions()
    : api
        .get<ExplorationSessionSummary[]>(
          `${BASE}/sessions`,
          { params: { type: 'EXPLORATION_V1' } },
        )
        .then((r) => r.data);

// 응답을 받지 못한 요청의 재시도는 같은 revision과 키를 유지한다.
export const abandonExplorationSession = (
  sessionId: number,
  expectedRevision: number,
  mutationId: string,
) =>
  isExplorationMock
    ? mock.abandonSession(sessionId, expectedRevision, mutationId)
    : api.post<ExplorationSession>(
        `${BASE}/sessions/${sessionId}/abandon`,
        { expectedRevision },
        idem(mutationId),
      ).then((r) => r.data);

export const requestNextQuestions = (
  sessionId: number,
  expectedRevision: number,
) =>
  isExplorationMock
    ? mock.next(sessionId, expectedRevision)
    : api
        .post<NextQuestionsResponse>(
          `${BASE}/sessions/${sessionId}/next`,
          { expectedRevision },
          idem(),
        )
        .then((r) => r.data);

// clientMutationId를 Idempotency-Key로도 사용해 재시도 시 같은 키가 나가게 한다
export const saveExplorationAnswer = (
  sessionId: number,
  issuedId: number,
  body: SaveAnswerRequest,
) =>
  isExplorationMock
    ? mock.saveAnswer(sessionId, issuedId, body)
    : api
        .put<SaveAnswerResponse>(
          `${BASE}/sessions/${sessionId}/answers/${issuedId}`,
          body,
          idem(body.clientMutationId),
        )
        .then((r) => r.data);

export const advanceExplorationStage = (
  sessionId: number,
  expectedRevision: number,
) =>
  isExplorationMock
    ? mock.advance(sessionId, expectedRevision)
    : api
        .post<AdvanceResponse>(
          `${BASE}/sessions/${sessionId}/advance`,
          { expectedRevision },
          idem(),
        )
        .then((r) => r.data);

// 백엔드 결과 DTO를 화면이 쓰는 형태로 옮긴다.
export const toExplorationResult = (
  dto: BackendExplorationResult,
): ExplorationResult => {
  const byCode = new Map(
    dto.majors.map((major) => [major.majorCode, major]),
  );

  const toCard = (
    major: BackendExplorationResult['majors'][number],
  ): ExplorationMajorCard => ({
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

     // 추가: 백엔드의 후보 반응 정보를 그대로 유지
    ...(dto.presentation
    ? { presentation: dto.presentation }
    : {}),

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

    cautions: dto.cautions.filter(
      (caution) => 'tagCode' in caution,
    ),

    preparationResponses:
      dto.preparationResponses ??
      dto.cautions.filter(
        (caution) => 'questionId' in caution,
      ),

    nextActivities: dto.nextActivities,
    recheckAxes: (dto.recheckAxes ?? []).filter(
      (axis) => axis.name?.trim(),
    ),
    notes: [],
    capabilities: dto.capabilities,
    activityAvailability: dto.activityAvailability,
    activityMessage: dto.activityMessage,
    testOnly: dto.testOnly,
    displayTextMissing: dto.groups.some(
      (group) => !group.name?.trim(),
    ),
    displayVersion: dto.displayVersion,
    displaySource: dto.displaySource,
    cautionAvailability:
      dto.cautionAvailability ?? 'UNAVAILABLE',
    cautionUnavailableReason: dto.cautionUnavailableReason,
  };
};

// complete 응답은 결과 DTO 전체다.
export const completeExplorationSession = (
  sessionId: number,
  expectedRevision: number,
): Promise<CompleteResponse> =>
  isExplorationMock
    ? mock.complete(sessionId, expectedRevision)
    : api
        .post<BackendExplorationResult>(
          `${BASE}/sessions/${sessionId}/complete`,
          { expectedRevision },
          idem(),
        )
        .then((r) => toExplorationResult(r.data));

export const getExplorationResult = (
  sessionId: number,
): Promise<ExplorationResultResponse> =>
  isExplorationMock
    ? mock.getResult(sessionId)
    : api
        .get<BackendExplorationResult>(
          `${BASE}/sessions/${sessionId}/result`,
        )
        .then((r) => ({
          state: 'READY' as const,
          result: toExplorationResult(r.data),
        }));

// 백엔드 쌍 비교 DTO를 화면 형태로 옮긴다.
export const toExplorationComparison = (
  dto: BackendExplorationComparison,
  resultId: number,
): ExplorationComparison => {
  const toProfile = (
    major: BackendComparisonMajor,
  ): ComparisonMajorProfile => ({
    majorCode: major.majorCode,
    name: major.majorName,
    groupName: major.groupName ?? '',
    learning: [],
    activities: [],
    careerDirections: [],
    checkPoints: [],
  });

  const directions = (
    rows: {
      directionCode: string;
      descriptions: { text: string }[];
    }[],
  ) =>
    rows.map((row) => ({
      directionCode: row.directionCode,
      descriptions: row.descriptions.map((d) => d.text),
    }));

  return {
    resultId,
    majors: [dto.left, dto.right]
      .filter((major) => major !== undefined)
      .map(toProfile),
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
    candidateChoices: (dto.candidateChoices ?? []).map(
      (major) => ({
        majorCode: major.majorCode,
        name: major.majorName,
        groupName: major.groupName ?? '',
      }),
    ),
    reasonCode: dto.reasonCode,
  };
};

export const getExplorationComparison = (
  resultId: number,
  pair?: readonly [string, string],
) =>
  isExplorationMock
    ? mock
        .getComparison(resultId, pair)
        .then((dto) => toExplorationComparison(dto, resultId))
    : api
        .get<BackendExplorationComparison>(
          `${BASE}/results/${resultId}/comparison`,
          {
            params: pair
              ? {
                  leftMajorCode: pair[0],
                  rightMajorCode: pair[1],
                }
              : undefined,
          },
        )
        .then((r) => toExplorationComparison(r.data, resultId));

export const getExplorationActivities = (resultId: number) =>
  isExplorationMock
    ? mock.getActivities(resultId)
    : api
        .get<ExplorationActivities>(
          `${BASE}/results/${resultId}/activities`,
        )
        .then((r) => r.data);

interface BackendSupportState extends Omit<SupportState, 'issuedQuestions' | 'answers'> {
  issued?: {
    question: SupportSession['issuedQuestions'][number];
    effective: boolean;
    answerApplicable: boolean;
    answerCode: string | null;
  }[];
}

const toSupportState = ({ issued = [], ...data }: BackendSupportState): SupportState => {
  // BOTH에는 계획 준비도 문항도 있으므로 활동 문항만 활동 화면에 전달한다.
  const activity = issued.filter(({ effective, question }) =>
    effective && question.questionId.startsWith('ACTIVITY-'),
  );
  return {
    ...data,
    purpose: data.purpose ?? null,
    targetMajorCode: data.targetMajorCode ?? null,
    allowedPurposes: data.allowedPurposes ?? [],
    issuedQuestions: activity.map(({ question }) => question),
    answers: activity.flatMap(({ question, answerApplicable, answerCode }) =>
      answerApplicable && answerCode !== null ? [{ issuedId: question.issuedId, optionCode: answerCode }] : [],
    ),
  };
};

export const getExplorationSupport = (resultId: number) =>
  isExplorationMock
    ? mock.getSupport(resultId)
    : api
        .get<BackendSupportState>(`${BASE}/results/${resultId}/support`)
        .then((r) => toSupportState(r.data));

// 백엔드 SupportRequests.Select — expectedSupportRevision 이 필수다.
export const selectExplorationSupport = (
  resultId: number,
  selection: SupportSelection,
  expectedSupportRevision: number,
) =>
  isExplorationMock
    ? mock.selectSupport(resultId, selection, expectedSupportRevision)
    : api
        .post<BackendSupportState>(
          `${BASE}/results/${resultId}/support`,
          { ...selection, expectedSupportRevision },
          idem(),
        )
        .then((r) => toSupportState(r.data));

export const startExplorationActivitySupport = async (resultId: number): Promise<SupportState> => {
  for (let attempt = 0; ; attempt += 1) {
    const current = await getExplorationSupport(resultId);
    if (current.purpose === 'ACTIVITY' || current.purpose === 'BOTH') return current;

    const selection: SupportSelection = current.purpose === 'PLAN'
      ? { purpose: 'BOTH', targetMajorCode: current.targetMajorCode }
      : { purpose: 'ACTIVITY', targetMajorCode: null };
    try {
      return await selectExplorationSupport(resultId, selection, current.supportRevision);
    } catch (error) {
      if (attempt === 0 && toExplorationErrorCode(error) === 'STALE_REVISION') continue;
      throw error;
    }
  }
};

export const saveExplorationSupportAnswer = (
  resultId: number,
  issuedId: number,
  body: { optionCode: string; expectedSupportRevision: number; clientMutationId: string },
) =>
  isExplorationMock
    ? mock.saveSupportAnswer(resultId, issuedId, body)
    : api
        .put<BackendSupportState>(
          `${BASE}/results/${resultId}/support/answers/${issuedId}`,
          body,
          idem(body.clientMutationId),
        )
        .then((r) => toSupportState(r.data));

// 계획을 만들려면 결과 후 지원이 PLAN·BOTH 이고 목표 전공이 같아야 한다.
// 이미 활동 지원(ACTIVITY·BOTH)을 쓰고 있으면 BOTH 로 바꿔 활동 쪽 선택을 지우지 않는다.
// 다른 기기에서 먼저 바꿨으면(STALE_REVISION) 한 번만 다시 읽어 맞춘다.
export const ensurePlanSupport = async (
  resultId: number,
  majorCode: string,
): Promise<SupportState> => {
  for (let attempt = 0; ; attempt += 1) {
    const current = await getExplorationSupport(resultId);
    const planReady =
      (current.purpose === 'PLAN' || current.purpose === 'BOTH') &&
      current.targetMajorCode === majorCode;
    if (planReady) return current;

    const purpose: SupportPurpose =
      current.purpose === 'ACTIVITY' || current.purpose === 'BOTH'
        ? 'BOTH'
        : 'PLAN';
    try {
      return await selectExplorationSupport(
        resultId,
        { purpose, targetMajorCode: majorCode },
        current.supportRevision,
      );
    } catch (error) {
      if (attempt === 0 && toExplorationErrorCode(error) === 'STALE_REVISION') {
        continue;
      }
      throw error;
    }
  }
};

// 같은 결과의 상담이 있으면 이어서 연다고 가정한다
export const openExplorationConsultation = (resultId: number) =>
  isExplorationMock
    ? mock.openConsultation(resultId)
    : api
        .post<ExplorationConsultation>(
          `${BASE}/results/${resultId}/consultations`,
          {},
          idem(),
        )
        .then((r) => r.data);

export const askExplorationConsultation = (
  consultationId: number,
  content: string,
  clientMutationId: string,
) =>
  isExplorationMock
    ? mock.ask(consultationId, content, clientMutationId)
    : api
        .post<ExplorationAskResponse>(
          `${BASE}/consultations/${consultationId}/messages`,
          { content },
          idem(clientMutationId),
        )
        .then((r) => r.data);

// 답변이 오지 않은 채 남은 질문을 취소한다. retryKey 는 상담 응답의 pendingRequest 에서 온다.
export const cancelExplorationConsultationMessage = (
  consultationId: number,
  retryKey: string,
) =>
  isExplorationMock
    ? mock.cancelConsultationMessage(consultationId, retryKey)
    : api
        .delete<{ status: 'CANCELLED' }>(
          `${BASE}/consultations/${consultationId}/messages/${encodeURIComponent(retryKey)}`,
        )
        .then((r) => r.data);

// 백엔드는 majorCode 와 supportRevision 두 키만 받는다. 먼저 ensurePlanSupport 로 지원을 맞춰야 한다.
export const createExplorationPlan = (
  resultId: number,
  majorCode: string,
  supportRevision: number | null,
) =>
  isExplorationMock
    ? mock.createPlan(resultId, majorCode, supportRevision)
    : api
        .post<ExplorationPlan>(
          `${BASE}/results/${resultId}/plans`,
          { majorCode, supportRevision },
          idem(),
        )
        .then((r) => r.data);

export const listExplorationPlans = (resultId: number) =>
  isExplorationMock
    ? mock.listPlans(resultId)
    : api
        .get<ExplorationPlanSummary[]>(
          `${BASE}/results/${resultId}/plans`,
        )
        .then((r) => r.data);

export const getExplorationPlan = (planId: number) =>
  isExplorationMock
    ? mock.getPlan(planId)
    : api
        .get<ExplorationPlan>(`${BASE}/plans/${planId}`)
        .then((r) => r.data);

// retryable 인 계획만 같은 계획으로 다시 생성한다. 취소·확정 실패는 새 계획을 만들어야 한다.
export const retryExplorationPlan = (planId: number) =>
  isExplorationMock
    ? mock.retryPlan(planId)
    : api
        .post<ExplorationPlan>(`${BASE}/plans/${planId}/retry`, {})
        .then((r) => r.data);

export const cancelExplorationPlan = (planId: number) =>
  isExplorationMock
    ? mock.cancelPlan(planId)
    : api
        .delete<{ status: 'CANCELLED' }>(`${BASE}/plans/${planId}/generation`)
        .then((r) => r.data);

// 공유 상태 조회
export const getExplorationShare = (resultId: number) =>
  isExplorationMock
    ? mock.getShare(resultId)
    : api
        .get<BackendExplorationShareState>(
          `${BASE}/results/${resultId}/share`,
        )
        .then((r) => toExplorationShareState(r.data));

// 공유 링크 생성
// 최신 shareRevision을 먼저 조회한 뒤 생성 요청을 보낸다.
export const createExplorationShare = async (
  resultId: number,
): Promise<ExplorationShareState> => {
  if (isExplorationMock) {
    return mock.createShare(resultId);
  }

  const current = await getExplorationShare(resultId);

  if (current.available === false) {
    throw new Error('SHARING_UNAVAILABLE');
  }

  const { data } = await api.post<BackendExplorationShareState>(
    `${BASE}/results/${resultId}/share`,
    {
      expectedShareRevision: current.shareRevision ?? 0,
      includeNickname: false,
    },
    idem(),
  );

  return toExplorationShareState(data);
};

// 공유 링크 철회
// 백엔드는 DELETE가 아니라 POST /share/revoke를 사용한다.
export const disableExplorationShare = async (
  resultId: number,
): Promise<ExplorationShareState> => {
  if (isExplorationMock) {
    return mock.disableShare(resultId);
  }

  const current = await getExplorationShare(resultId);

  const { data } = await api.post<BackendExplorationShareState>(
    `${BASE}/results/${resultId}/share/revoke`,
    {
      expectedShareRevision: current.shareRevision ?? 0,
    },
    idem(),
  );

  // 철회 응답에는 expiresAt이 없으므로 직전 조회값을 유지한다.
  return toExplorationShareState({
    ...data,
    available: data.available ?? current.available,
    expiresAt: data.expiresAt ?? current.expiresAt ?? undefined,
    issuedAt: data.issuedAt ?? current.createdAt ?? undefined,
  });
};

// 공개 결과는 로그인 없이 조회한다.
// 백엔드 응답의 평면 majors를 전공군별로 묶어서 화면에 전달한다.
export const getSharedExplorationResult = (
  token: string,
) =>
  isExplorationMock
    ? mock.getSharedResult(token)
    : publicApi
        .get<BackendSharedExplorationResult>(
          `${BASE}/shared-results/${encodeURIComponent(token)}`,
        )
        .then((r) => toSharedExplorationResult(r.data));

export const getExplorationMajorProfile = (majorCode: string) =>
  isExplorationMock
    ? mock.getMajorProfile(majorCode)
    : api
        .get<ExplorationMajorProfile>(
          `${BASE}/majors/${encodeURIComponent(majorCode)}/profile`,
        )
        .then((r) => r.data);

export const toExplorationErrorCode = (
  error: unknown,
): ExplorationErrorCode => {
  const e = error as {
    response?: {
      status?: number;
      data?: { code?: string };
    };
  };

  if (!e?.response) return 'NETWORK';

  if (e.response.data?.code === 'INVALID_REQUEST') {
    return 'INVALID_INPUT';
  }

  if (e.response.data?.code === 'RESOURCE_NOT_FOUND') {
    return 'NOT_FOUND';
  }

  return (
    (e.response.data?.code as ExplorationErrorCode | undefined) ??
    'UNKNOWN'
  );
};
