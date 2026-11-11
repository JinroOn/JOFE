// 탐색형 진단(EXPLORATION_V1) 타입
// 기준: 진행할 작업 문서 04_DB_API_화면_구현계약 — Backend API 3절(핵심 DTO), Frontend 2~5절
// 주의: 04 문서에 예시가 없는 응답 필드(이어하기·답변 저장·단계 전환 응답)는
//       백엔드 계약 확정 전 프런트 가정이다. 백엔드 구현 시 맞춰 수정한다.

export type ExplorationStage = 'STAGE_1' | 'STAGE_2' | 'STAGE_3';

export type ExplorationSessionStatus = 'in_progress' | 'completed';

export interface ExplorationVersions {
  questionCatalog: string;
  optionCatalog: string;
  majorMapping: string;
  ruleset: string;
}

// POST /sessions, GET /sessions/{id} 의 session 부분
export interface ExplorationSession {
  sessionId: number;
  diagnosisType: 'EXPLORATION_V1';
  status: ExplorationSessionStatus;
  stage: ExplorationStage;
  revision: number;
  versions: ExplorationVersions;
  startedAt: string;
  resultId: number | null;
}

export interface ExplorationOption {
  code: string;
  text: string;
  order: number;
}

// 서버가 회차에 고정해 내려준 문항 스냅샷. 프런트는 문구를 그대로 표시한다.
export interface IssuedQuestion {
  issuedId: number;
  questionId: string;
  questionVersion: string;
  comparisonSet: string | null;
  optionVariantVersion: string | null;
  text: string;
  options: ExplorationOption[];
  required: boolean;
}

export interface ExplorationProgress {
  stage: 1 | 2 | 3;
  answered: number;
  issued: number;
  stageMax: number;
  remainingMax: number;
}

// 다음 행동: 서버가 결정한다. 프런트는 활성 조건을 계산하지 않는다.
export type ExplorationNextAction = 'ANSWER' | 'NEXT' | 'ADVANCE' | 'COMPLETE';

// POST /sessions/{id}/next
export interface NextQuestionsResponse {
  revision: number;
  issuedQuestions: IssuedQuestion[];
  progress: ExplorationProgress;
  nextAction: ExplorationNextAction;
  // 앞선 답변으로 조건부 문항이 추가·제거됐으면 true (화면에서 한 번 안내)
  adjusted: boolean;
}

export interface IssuedQuestionState {
  question: IssuedQuestion;
  stage: ExplorationStage;
  answerCode: string | null;
  // 분기에서 제외된 답변은 false (현재 결과에 미사용)
  effective: boolean;
}

// GET /sessions/{id} — 이어하기
export interface ExplorationSessionDetail {
  session: ExplorationSession;
  issued: IssuedQuestionState[];
  progress: ExplorationProgress;
  nextAction: ExplorationNextAction;
}

export interface ExplorationSessionSummary {
  sessionId: number;
  diagnosisType: 'EXPLORATION_V1' | 'LEGACY';
  status: ExplorationSessionStatus;
  stage: ExplorationStage | null;
  startedAt: string;
}

// PUT /sessions/{id}/answers/{issuedId}
export interface SaveAnswerRequest {
  optionCode: string;
  expectedRevision: number;
  clientMutationId: string;
}

export interface SaveAnswerResponse {
  revision: number;
  issuedId: number;
  optionCode: string;
  // 이전 답변 수정으로 영향받는 이후 문항 수 (없으면 0)
  affectedCount: number;
  // 분기 재평가로 현재 결과에 미사용이 된 issuedId 목록
  excludedIssuedIds: number[];
  progress: ExplorationProgress;
  nextAction: ExplorationNextAction;
}

// 단계 사이 안내 문구. 서버 문구를 그대로 표시한다.
export interface StageNotice {
  title: string;
  description: string;
  expectedMaxQuestions: number;
}

// POST /sessions/{id}/advance
export interface AdvanceResponse {
  revision: number;
  stage: ExplorationStage;
  nextAction: ExplorationNextAction;
  notice: StageNotice | null;
}

// POST /sessions/{id}/complete
export interface CompleteResponse {
  revision: number;
  resultId: number;
  status: 'completed';
}

// ---- 결과 (GET /sessions/{id}/result) ----
// 04 문서: 결과 DTO는 groups, majors, reasonCodes, evidenceLevel, cautions, nextActivities, resultVersion 포함.
// 화면 DTO에는 숫자 점수를 두지 않고 근거 수준과 설명을 우선한다.
// 세부 필드 구성은 백엔드 계약 확정 전 프런트 가정이다.

export type ExplorationResultStatus = 'READY' | 'LOW_EVIDENCE' | 'NO_SUPPORTED_CANDIDATE';

// 03 문서 흥미축 근거 수준: 0개 NO_EVIDENCE, 1개 LOW_EVIDENCE, 2개 CONFIRMED
export type EvidenceLevel = 'CONFIRMED' | 'LOW_EVIDENCE' | 'NO_EVIDENCE';

export type ReasonKind = 'INTEREST' | 'ACTIVITY' | 'LEARNING';

export interface ExplorationReason {
  kind: ReasonKind;
  reasonCode: string;
  text: string;
}

export interface ExplorationMajorCard {
  majorCode: string;
  majorId: number | null;
  name: string;
  evidenceLevel: EvidenceLevel;
  reasons: ExplorationReason[];
  // 추천 수용 폭에 따라 접어서 보여줄 낯선 후보
  collapsed: boolean;
}

export interface ExplorationGroupCard {
  groupCode: string;
  name: string;
  summary: string;
  evidenceLevel: EvidenceLevel;
  reasonCodes: string[];
  majors: ExplorationMajorCard[];
}

export interface ExplorationCaution {
  tagCode: string;
  majorCode: string | null;
  text: string;
  checkAction: string;
}

export type ActivityKind = 'INFO_CHECK' | 'HANDS_ON' | 'COMPARE_ASK';

export interface ExplorationActivity {
  activityCode: string;
  kind: ActivityKind;
  title: string;
  description: string;
  duration: string;
  outcome: string;
  // D-22: 활동 결과물 예시
  exampleOutput: string;
  tags: ActivityTag[];
}

// 시간·비용·접근 제약 대응 표시 (D-21)
export type ActivityTag = 'FREE' | 'ONLINE' | 'SOLO' | 'WITH_OTHERS';

export interface RecheckAxis {
  metricCode: string;
  name: string;
}

export interface ExplorationResult {
  resultId: number;
  sessionId: number;
  status: ExplorationResultStatus;
  resultVersion: string;
  createdAt: string;
  groups: ExplorationGroupCard[];
  cautions: ExplorationCaution[];
  nextActivities: ExplorationActivity[];
  // 정보 부족·후보 없음일 때 다시 확인해볼 관심 분야
  recheckAxes: RecheckAxis[];
  notes: string[];
}

export type ExplorationResultResponse =
  | { state: 'GENERATING'; retryAfterMs: number }
  | { state: 'READY'; result: ExplorationResult };

// ---- 후보 전공 비교 (GET /results/{resultId}/comparison) ----
// 04 문서 엔드포인트 목록에 없는 API다. 백엔드와 합의 전 프런트 가정.
// 승자·순위·점수를 담지 않는다.

export interface ComparisonMajorProfile {
  majorCode: string;
  name: string;
  groupName: string;
  learning: string[];
  activities: string[];
  careerDirections: string[];
  checkPoints: string[];
}

export interface ExplorationComparison {
  resultId: number;
  majors: ComparisonMajorProfile[];
  commonPoints: string[];
  differences: string[];
  sourceNote: string;
}

// ---- 탐색 활동 (GET /results/{resultId}/activities) ----
// 04 문서 엔드포인트 목록에 없는 API다. 백엔드와 합의 전 프런트 가정.
// D-20: 전공군 공통 3개 + 전공별 1개, D-21: 기본 3개

export interface ActivityGroupSection {
  groupCode: string;
  groupName: string;
  common: ExplorationActivity[];
  majors: { majorCode: string; name: string; activity: ExplorationActivity }[];
}

export interface ExplorationActivities {
  resultId: number;
  supportRevision: number | null;
  // 결과 후 활동 선호 응답이 반영됐는지
  personalized: boolean;
  personalizationNote: string | null;
  base: ExplorationActivity[];
  groups: ActivityGroupSection[];
}

// ---- 결과 후 선택 질문 (POST /results/{id}/support, PUT .../support/answers/{issuedId}) ----
// 엔드포인트는 04 문서에 있고, 응답 본문 구조는 프런트 가정이다.
// 결과 후 응답은 추천 전공·순서를 바꾸지 않는다.

export type SupportPurpose = 'PLAN' | 'ACTIVITY' | 'BOTH';

export interface SupportSession {
  resultId: number;
  purpose: SupportPurpose;
  supportRevision: number;
  issuedQuestions: IssuedQuestion[];
  answers: { issuedId: number; optionCode: string }[];
}

export interface SupportAnswerResponse {
  supportRevision: number;
  issuedId: number;
  optionCode: string;
  remaining: number;
}

// ---- 결과에 대해 AI에게 묻기 ----
// 04 문서 엔드포인트 목록에 없는 API다. 백엔드와 합의 전 프런트 가정.
// D-26: 프런트는 질문 문장과 결과 ID만 보낸다. D-27: 근거와 근거 상태를 함께 받는다.

// 01 문서 6.2절 근거 데이터 다섯 층
export type ConsultationSourceKind =
  | 'RESULT_SNAPSHOT'
  | 'METRIC_DEFINITION'
  | 'MAJOR_PROFILE'
  | 'ACTIVITY_CATALOG'
  | 'ANSWER_POLICY';

export interface ConsultationSource {
  kind: ConsultationSourceKind;
  title: string;
  version: string;
}

// 근거가 부족하면 AI가 추론하지 않고 추가 확인이 필요하다고 답한다
export type EvidenceStatus = 'GROUNDED' | 'INSUFFICIENT';

export interface ExplorationChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  sources: ConsultationSource[];
  evidenceStatus: EvidenceStatus | null;
}

export interface ExplorationConsultation {
  consultationId: number;
  resultId: number;
  messages: ExplorationChatMessage[];
}

export interface ExplorationAskResponse {
  userMessage: ExplorationChatMessage;
  assistantMessage: ExplorationChatMessage;
}

// ---- 12주 탐색 계획 (POST /results/{id}/plans, GET /results/{id}/plans, GET /plans/{planId}) ----
// POST 엔드포인트는 04 문서에 있고, majorCode 필드와 GET 두 개는 백엔드와 합의 전 프런트 가정.
// D-24: 합격 준비가 아닌 정보 확인·기초 학습·작은 활동 중심 탐색 계획

export type PlanStatus = 'GENERATING' | 'READY' | 'FAILED';

export type PlanPhase = 'INFO' | 'BASIC_LEARNING' | 'SMALL_ACTIVITY';

export interface PlanWeek {
  week: number;
  phase: PlanPhase;
  title: string;
  tasks: string[];
  expectedOutput: string;
}

export interface ExplorationPlanSummary {
  planId: number;
  resultId: number;
  majorCode: string;
  majorName: string;
  status: PlanStatus;
  createdAt: string;
}

export interface ExplorationPlan extends ExplorationPlanSummary {
  supportRevision: number | null;
  weeks: PlanWeek[];
  // AI가 계획을 만들 때 사용한 근거 (D-27)
  sources: ConsultationSource[];
}

// ---- 결과 공유 (GET/POST/DELETE /results/{id}/share, GET /shares/{token}) ----
// 04 문서에 엔드포인트가 없어 백엔드와 합의 전 프런트 가정.
// D-28: 기본 꺼짐, 30일 만료, 즉시 끄기, 만료·끈 링크는 새 링크로만 다시 공유

export type ShareStatus = 'NONE' | 'ACTIVE' | 'EXPIRED' | 'DISABLED';

export interface ExplorationShareState {
  resultId: number;
  status: ShareStatus;
  token: string | null;
  createdAt: string | null;
  expiresAt: string | null;
}

// D-29 공개 정보 allowlist만 담는다. 점수·원문 응답·주의 태그 세부·상담·계획은 없다.
export interface SharedExplorationMajor {
  name: string;
  reason: string;
}

export interface SharedExplorationGroup {
  name: string;
  summary: string;
  majors: SharedExplorationMajor[];
}

export interface SharedExplorationResult {
  nickname: string;
  completedAt: string;
  status: ExplorationResultStatus;
  groups: SharedExplorationGroup[];
  activities: { title: string; duration: string }[];
  notes: string[];
  expiresAt: string;
}

export type ExplorationErrorCode =
  | 'INVALID_REQUEST'
  | 'RESOURCE_NOT_FOUND'
  | 'STALE_REVISION'
  | 'IDEMPOTENCY_CONFLICT'
  | 'SESSION_ALREADY_COMPLETED'
  | 'OPTION_NOT_ISSUED'
  | 'QUESTION_NOT_EFFECTIVE'
  | 'STAGE_INCOMPLETE'
  | 'NO_SUPPORTED_CANDIDATE'
  | 'NO_ACTIVE_CATALOG'
  | 'NETWORK'
  | 'UNKNOWN';

// 저장·응답 없이 선택지로만 쓰이는 코드 (점수 null, 평균 분모 제외)
export const ABSTAIN_OPTION_CODES = ['UNKNOWN', 'NO_EXPERIENCE'] as const;
