import api from './axios';
import { isExplorationMock } from '../config/features';
import * as mock from './explorationMock';
import type { DiagnosisSession } from '../types/diagnosis';
import { getDiagnosisSessions } from './diagnosis';
import type { DiagnosisHistoryItem, DiagnosisHistoryPage, DiagnosisHistoryQuery } from '../types/history';

// 레거시·탐색형을 서버가 한 목록으로 정렬해 준다. 프런트는 합치거나 정렬하지 않는다. (JOFE#129)
// 서버는 type·status·limit·cursor 외의 쿼리 키를 400으로 거부하므로 그 외 값을 넘기지 않는다.
export const getDiagnosisHistorySessions = (query: DiagnosisHistoryQuery = {}) => {
  const params = { type: query.type, status: query.status, limit: query.limit, cursor: query.cursor };
  return isExplorationMock
    ? mock.historySessions(params)
    : api.get<DiagnosisHistoryPage>('/exploration/v1/history/sessions', { params }).then((r) => r.data);
};

export type HistorySource = 'unified' | 'legacy';
export type LoadedHistoryPage = DiagnosisHistoryPage & { source: HistorySource };

// 실행 범위가 닫힌 경우만 레거시로 대체한다. 통신·인증·자료 손상 오류는 숨기지 않는다.
export const loadInitialDiagnosisHistory = async (enabled: boolean, limit: number): Promise<LoadedHistoryPage> => {
  if (enabled) {
    try {
      return { ...await getDiagnosisHistorySessions({ limit }), source: 'unified' };
    } catch (error) {
      const response = (error as { response?: { status?: number; data?: { code?: string } } })?.response;
      if (response?.status !== 404 && !(response?.status === 503 && response.data?.code === 'NO_ACTIVE_CATALOG')) throw error;
    }
  }
  const sessions = await getDiagnosisSessions();
  return {
    items: [...sessions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(toLegacyHistoryItem),
    limit, hasMore: false, nextCursor: null, filters: { type: 'LEGACY', status: 'ALL' },
    runMode: 'LEGACY', testOnly: false, source: 'legacy',
  };
};

// 통합 이력을 쓸 수 없는 경우(탐색형 꺼짐, 실행 범위 밖)에 레거시 회차 목록을 같은 행 형태로 옮긴다.
// 레거시 목록에는 결과 가용성 정보가 없어, 기존 화면과 같이 완료 회차는 결과를 열 수 있다고 본다.
export const toLegacyHistoryItem = (session: DiagnosisSession): DiagnosisHistoryItem => {
  const completed = session.status === 'completed';
  const path = `/api/diagnoses/sessions/${session.id}`;
  return {
    key: `LEGACY:SESSION:${session.id}`,
    sessionKey: `LEGACY:SESSION:${session.id}`,
    sessionId: session.id,
    type: 'LEGACY',
    status: session.status,
    stage: session.currentStep,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    occurredAt: session.createdAt,
    resultKey: null,
    resultId: null,
    resultAvailability: completed ? 'AVAILABLE' : 'NOT_COMPLETED',
    resultStatus: null,
    resultContractVersion: null,
    resultUnavailableReason: null,
    runMode: null,
    testOnly: false,
    nextAction: session.status === 'in_progress' ? 'RESUME' : completed ? 'VIEW_RESULT' : 'NONE',
    links: { session: path, resume: session.status === 'in_progress' ? path : null, result: null },
  };
};
