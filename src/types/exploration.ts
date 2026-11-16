// 탐색형 진단(EXPLORATION_V1) 타입

export type ExplorationStage = 'STAGE_1' | 'STAGE_2' | 'STAGE_3';

export type ExplorationSessionStatus = 'in_progress' | 'completed' | 'abandoned';

export type ExplorationSessionType = 'EXPLORATION_V1' | 'LEGACY';

export interface ExplorationVersions {
  questionCatalog: string;
  optionCatalog: string;
  majorMapping: string;
  ruleset: string;
}

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
  totalIssued?: number;
}

export type ExplorationNextAction = 'ANSWER' | 'NEXT' | 'ADVANCE' | 'COMPLETE';

export interface NextQuestionsResponse {
  revision: number;
  issuedQuestions: IssuedQuestion[];
  progress: ExplorationProgress;
  nextAction: ExplorationNextAction;
  adjusted: boolean;
}

export interface IssuedQuestionState {
  question: IssuedQuestion;
  stage: ExplorationStage;
  answerCode: string | null;
  effective: boolean;
}

export interface ExplorationSessionDetail {
  session: ExplorationSession;
  issued: IssuedQuestionState[];
  progress: ExplorationProgress;
  nextAction: ExplorationNextAction;
}

// GET /sessions
// 백엔드: type, Mock: diagnosisType
export interface ExplorationSessionSummary {
  sessionId: number;
  type?: ExplorationSessionType;
  diagnosisType?: ExplorationSessionType;
  status: ExplorationSessionStatus;
  stage: ExplorationStage | null;
  startedAt: string;
  completedAt: string | null;
  resultId: number | null;
}

// PUT /sessions/{id}/answers/{issuedId}
export interface SaveAnswerRequest {
  optionCode: string;
  expectedRevision: number;
  clientMutationId: string;
}

export interface SaveAnswerBranchChanges {
  excludedIssuedIds: number[];
  restoredIssuedIds: number[];
  pendingQuestionCount: number;
  budgetLimited: boolean;
}

// 실제 백엔드 응답
export interface BackendSaveAnswerResponse {
  revision: number;
  issuedId: number;
  optionCode: string;
  answerRevision: number;
  effective: boolean;
  stage: ExplorationStage;
  rewound: boolean;
  nextAction: ExplorationNextAction;
  progress: ExplorationProgress;
  branchChanges: SaveAnswerBranchChanges;
}

// 기존 Mock 응답
export interface MockSaveAnswerResponse {
  revision: number;
  issuedId: number;
  optionCode: string;
  affectedCount: number;
  excludedIssuedIds: number[];
  progress: ExplorationProgress;
  nextAction: ExplorationNextAction;
}

export type SaveAnswerResponse = BackendSaveAnswerResponse | MockSaveAnswerResponse;

// 단계 사이 안내 문구
export interface StageNotice {
  title: string;
  description: string;
  expectedMaxQuestions: number;
}

// 실제 백엔드 단계 진행 응답
export interface BackendAdvanceResponse {
  session: Partial<ExplorationSession> & Pick<ExplorationSession, 'revision' | 'stage'>;
  progress: ExplorationProgress;
  nextAction: ExplorationNextAction;
  fixedCandidates: unknown;
}

// 기존 Mock 단계 진행 응답
export interface MockAdvanceResponse {
  revision: number;
  stage: ExplorationStage;
  nextAction: ExplorationNextAction;
  notice: StageNotice | null;
}

export type AdvanceResponse = BackendAdvanceResponse | MockAdvanceResponse;

export interface CompleteResponse {
  revision: number;
  resultId: number;
  status: 'completed';
}

// 결과

export type ExplorationResultStatus = 'READY' | 'LOW_EVIDENCE' | 'NO_SUPPORTED_CANDIDATE';

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
  exampleOutput: string;
  tags: ActivityTag[];
}

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
  recheckAxes: RecheckAxis[];
  notes: string[];
}

export type ExplorationResultResponse =
  | { state: 'GENERATING'; retryAfterMs: number }
  | { state: 'READY'; result: ExplorationResult };

// 후보 전공 비교

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

// 탐색 활동

export interface ActivityGroupSection {
  groupCode: string;
  groupName: string;
  common: ExplorationActivity[];
  majors: {
    majorCode: string;
    name: string;
    activity: ExplorationActivity;
  }[];
}

export interface ExplorationActivities {
  resultId: number;
  supportRevision: number | null;
  personalized: boolean;
  personalizationNote: string | null;
  base: ExplorationActivity[];
  groups: ActivityGroupSection[];
}

// 결과 후 선택 질문

export type SupportPurpose = 'PLAN' | 'ACTIVITY' | 'BOTH';

export interface SupportSession {
  resultId: number;
  purpose: SupportPurpose;
  supportRevision: number;
  issuedQuestions: IssuedQuestion[];
  answers: {
    issuedId: number;
    optionCode: string;
  }[];
}

export interface SupportAnswerResponse {
  supportRevision: number;
  issuedId: number;
  optionCode: string;
  remaining: number;
}

// AI 상담

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

// 12주 탐색 계획

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
  sources: ConsultationSource[];
}

// 결과 공유

export type ShareStatus = 'NONE' | 'ACTIVE' | 'EXPIRED' | 'DISABLED';

export interface ExplorationShareState {
  resultId: number;
  status: ShareStatus;
  token: string | null;
  createdAt: string | null;
  expiresAt: string | null;
}

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
  activities: {
    title: string;
    duration: string;
  }[];
  notes: string[];
  expiresAt: string;
}

// 전공 프로필

export interface ExplorationMajorProfile {
  majorCode: string;
  name: string;
  category: string | null;
  description: string | null;
  keywords: string[];
  bestFor: string | null;
  comparisonNote: string | null;
  lessCentral: string[];
  relatedCareers: string[];
  profileVersion: string;
  source: string | null;
}

// 백엔드 공통 오류 코드
export type ExplorationErrorCode =
  | 'INVALID_INPUT'
  | 'NOT_FOUND'
  | 'STALE_REVISION'
  | 'IDEMPOTENCY_CONFLICT'
  | 'SESSION_ALREADY_COMPLETED'
  | 'EXPLORATION_IN_PROGRESS'
  | 'OPTION_NOT_ISSUED'
  | 'QUESTION_NOT_EFFECTIVE'
  | 'STAGE_INCOMPLETE'
  | 'NO_ACTIVE_CATALOG'
  | 'NETWORK'
  | 'UNKNOWN';

export const ABSTAIN_OPTION_CODES = ['UNKNOWN', 'NO_EXPERIENCE'] as const;
