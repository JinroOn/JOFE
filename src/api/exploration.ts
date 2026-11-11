import api from './axios';
import { isExplorationMock } from '../config/features';
import * as mock from './explorationMock';
import type {
  AdvanceResponse,
  CompleteResponse,
  ExplorationActivities,
  ExplorationAskResponse,
  ExplorationComparison,
  ExplorationConsultation,
  ExplorationErrorCode,
  ExplorationPlan,
  ExplorationPlanSummary,
  ExplorationResult,
  ExplorationResultResponse,
  ExplorationSession,
  ExplorationSessionDetail,
  ExplorationSessionSummary,
  NextQuestionsResponse,
  SaveAnswerRequest,
  SaveAnswerResponse,
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

export const completeExplorationSession = (sessionId: number, expectedRevision: number) =>
  isExplorationMock
    ? mock.complete(sessionId, expectedRevision)
    : api
        .post<CompleteResponse>(`${BASE}/sessions/${sessionId}/complete`, { expectedRevision }, idem())
        .then((r) => r.data);

// 결과 생성이 끝나지 않았으면 서버가 202를 준다고 가정한다
export const getExplorationResult = (sessionId: number): Promise<ExplorationResultResponse> =>
  isExplorationMock
    ? mock.getResult(sessionId)
    : api.get<ExplorationResult>(`${BASE}/sessions/${sessionId}/result`).then((r) =>
        r.status === 202
          ? { state: 'GENERATING', retryAfterMs: Number(r.headers['retry-after'] ?? 1) * 1000 }
          : { state: 'READY', result: r.data },
      );

export const getExplorationComparison = (resultId: number, majorCodes: string[]) =>
  isExplorationMock
    ? mock.getComparison(resultId, majorCodes)
    : api
        .get<ExplorationComparison>(`${BASE}/results/${resultId}/comparison`, {
          params: { majorCodes: majorCodes.join(',') },
        })
        .then((r) => r.data);

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

export const toExplorationErrorCode = (error: unknown): ExplorationErrorCode => {
  const e = error as { response?: { status?: number; data?: { code?: string } } };
  if (!e?.response) return 'NETWORK';
  return (e.response.data?.code as ExplorationErrorCode | undefined) ?? 'UNKNOWN';
};
