// 레거시·탐색형 통합 진단 이력 (GET /exploration/v1/history/sessions)
// 기준: JinroOn/JOBE DiagnosisHistoryService. 두 종류를 서버가 한 목록으로 정렬해 주고
// 행마다 다음 행동과 결과 가용성까지 판정해 준다. 프런트는 다시 합치거나 판정하지 않는다. (JOFE#129)

import type { DiagnosisKind } from './dashboard';

export type HistorySessionStatus = 'in_progress' | 'completed' | 'abandoned';

// RESUME: 진행 중 회차. VIEW_RESULT: 완료됐고 결과를 열 수 있음. NONE: 할 수 있는 행동 없음.
export type HistoryNextAction = 'RESUME' | 'VIEW_RESULT' | 'NONE';

// NOT_COMPLETED: 아직 완료 전. MISSING: 완료됐는데 결과가 없음. AMBIGUOUS: 결과가 2개 이상.
// UNAVAILABLE: 봉인이 맞지 않는 손상 결과 (resultUnavailableReason: CATALOG_INTEGRITY_ERROR).
export type HistoryResultAvailability =
  | 'AVAILABLE'
  | 'NOT_COMPLETED'
  | 'MISSING'
  | 'AMBIGUOUS'
  | 'UNAVAILABLE';

export interface DiagnosisHistoryItem {
  key: string;
  sessionKey: string;
  sessionId: number;
  type: DiagnosisKind;
  status: HistorySessionStatus;
  // 두 타입 모두 숫자다 — 탐색형은 단계(1~3), 레거시는 current_step.
  stage: number | null;
  startedAt: string;
  completedAt: string | null;
  occurredAt: string;
  resultKey: string | null;
  resultId: number | null;
  resultAvailability: HistoryResultAvailability;
  // 탐색형만 채워진다.
  resultStatus: string | null;
  resultContractVersion: string | null;
  resultUnavailableReason: string | null;
  runMode: string | null;
  testOnly: boolean;
  nextAction: HistoryNextAction;
  // 백엔드 API 경로다. 화면 라우트로 쓰지 않는다.
  links: { session: string; resume: string | null; result: string | null };
}

export interface DiagnosisHistoryPage {
  items: DiagnosisHistoryItem[];
  limit: number;
  hasMore: boolean;
  nextCursor: string | null;
  filters: { type: string; status: string };
  runMode: string;
  testOnly: boolean;
}

// 서버는 이 네 키 외의 쿼리 파라미터를 400으로 거부한다.
export interface DiagnosisHistoryQuery {
  type?: 'ALL' | DiagnosisKind;
  status?: 'ALL' | HistorySessionStatus;
  limit?: number;
  cursor?: string;
}
