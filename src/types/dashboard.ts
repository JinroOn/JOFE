// 레거시·탐색형 통합 대시보드 요약 (GET /dashboard/summary)
// 기준: JinroOn/JOBE PR #102 DashboardSummaryService. 서버가 두 종류를 비교해 최신을 고르므로
// 프런트는 다시 비교하지 않는다. 결과 본문은 오지 않고 path로 각 결과를 따로 조회한다.

export type DiagnosisKind = 'LEGACY' | 'EXPLORATION_V1';

export type ExplorationAvailability = 'AVAILABLE' | 'UNAVAILABLE';

export interface DashboardResultRef {
  type: DiagnosisKind;
  resultId: number;
  sessionId: number;
  // 탐색형만 채워진다. 레거시는 null이다.
  resultStatus: string | null;
  completedAt: string | null;
  path: string;
}

export interface DashboardSessionRef {
  type: DiagnosisKind;
  sessionId: number;
  // 타입마다 의미가 다른 문자열이다 — LEGACY는 current_step("12"), EXPLORATION_V1은 DB 원문("STAGE_1").
  // 회차 DTO·진행률의 숫자 stage(ExplorationStage)와 다르므로 그 타입을 쓰지 않는다. (JOFE#127)
  stage: string | null;
  startedAt: string | null;
  path: string;
}

export interface DashboardSummary {
  // 서버가 레거시·탐색형을 비교해 고른 최신 완료 결과. 둘 다 없으면 null이다.
  latestResult: DashboardResultRef | null;
  latestByType: Partial<Record<DiagnosisKind, DashboardResultRef | null>>;
  inProgress: DashboardSessionRef[];
  resume: DashboardSessionRef | null;
  // 기능이 꺼졌거나 실행 범위 밖이면 UNAVAILABLE이고, 이때도 레거시 정보는 온다.
  exploration: ExplorationAvailability;
}
