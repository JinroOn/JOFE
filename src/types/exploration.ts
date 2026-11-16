// 탐색형 진단(EXPLORATION_V1) 타입

// 백엔드는 API로 나가는 stage를 모두 숫자로 직렬화한다
// (ExplorationSessionService의 회차 DTO·답변 응답·진행률·회차 목록·통합 이력 전부 stageNumber()).
// 문자열 'STAGE_1'은 DB 내부 표현이라 응답에 나오지 않는다. (JOFE#116)
export type ExplorationStage = 1 | 2 | 3;

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
  stage: ExplorationStage;
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

// POST /sessions/{id}/complete
// 백엔드(ExplorationSessionService.complete)는 결과를 같은 요청 안에서 동기로 만들고
// ExplorationResultStore.response()의 결과 DTO 전체를 200으로 돌려준다.
// 응답에 revision 필드는 없다 — 완료 후에는 낙관적 잠금 대상이 아니다. (JOFE#113)
export type CompleteResponse = ExplorationResult;

// 결과

export type ExplorationResultStatus = 'READY' | 'LOW_EVIDENCE' | 'NO_SUPPORTED_CANDIDATE';

export type EvidenceLevel = 'CONFIRMED' | 'LOW_EVIDENCE' | 'NO_EVIDENCE';

export type ReasonKind = 'INTEREST' | 'ACTIVITY' | 'LEARNING';

export interface ExplorationReason {
  kind: ReasonKind;
  reasonCode: string;
  text: string;
}

// 화면이 쓰는 전공 카드. 백엔드 응답은 api/exploration.ts의 매퍼가 이 형태로 바꿔 준다.
// evidenceLevel은 백엔드가 전공 단위로 주지 않아 없을 수 있다 (축별 값만 있음, JinroOn/JOBE#95).
export interface ExplorationMajorCard {
  majorCode: string;
  majorId: number | null;
  name: string;
  evidenceLevel?: EvidenceLevel;
  reasons: ExplorationReason[];
  collapsed: boolean;
  // 백엔드가 전공마다 내려주는 공통 안내 문구 (근거 문장이 아니다)
  explanation?: string;
}

// 화면이 쓰는 전공군 카드. 백엔드 groupSummaries는 `{groupCode, majorCodes[]}`만 주므로
// name·summary·evidenceLevel은 매퍼가 채우지 못하는 경우가 있다 (JinroOn/JOBE#95).
export interface ExplorationGroupCard {
  groupCode: string;
  name: string;
  summary: string;
  evidenceLevel?: EvidenceLevel;
  reasonCodes: string[];
  majors: ExplorationMajorCard[];
}

// 서버가 승인 조건을 확인한 주의 안내. 준비 상황 응답은 preparationResponses로 구분한다.
export interface ExplorationCaution {
  tagCode: string;
  majorCode: string | null;
  text: string;
  checkAction: string;
  // 백엔드 형태에서 옮겨온 값. checkAction이 비면 확인 행동 대신 이 응답을 보여준다.
  answerText?: string;
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

// 백엔드가 결과와 함께 내려주는 기능 가용성(ExplorationResultStore.response()).
// 아직 서버에 엔드포인트가 없는 기능은 false로 온다 — planAvailable·sharingAvailable은 현재 고정 false다.
export interface ExplorationCapabilities {
  comparisonAvailable: boolean;
  supportAvailable: boolean;
  planAvailable: boolean;
  sharingAvailable: boolean;
}

export type ActivityAvailability = 'AVAILABLE' | 'UNAVAILABLE';

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
  // 백엔드가 결과와 함께 내려주는 값. mock 응답에는 없다.
  capabilities?: ExplorationCapabilities;
  activityAvailability?: ActivityAvailability;
  activityMessage?: string;
  testOnly?: boolean;
  // 서버가 표시용 문구(전공군 이름·근거 문장 등)를 아직 내려주지 않는 응답임을 표시한다.
  displayTextMissing?: boolean;
  preparationResponses?: ExplorationPreparationResponse[];
  cautionAvailability?: 'EVALUATED' | 'UNAVAILABLE';
  cautionUnavailableReason?: string | null;
  displayVersion?: string;
  displaySource?: 'COMPLETION_SNAPSHOT' | 'SEALED_RESULT_PROJECTION';
}

export interface ExplorationPreparationResponse {
  questionId: string;
  questionText: string;
  answerText: string;
}

export interface BackendExplorationMajor {
  majorCode: string;
  majorName: string;
  name?: string;
  majorId?: number | null;
  explanation: string;
  reasons?: ExplorationMajorCard['reasons'];
  evidenceLevel?: EvidenceLevel;
  collapsed?: boolean;
  groupCode: string;
  interestEvidence?: { metricCode: string; validCount: number; evidenceLevel: EvidenceLevel; inconsistent: boolean }[];
  usedInterestAxes?: string[];
  usedActivityAxes?: string[];
  usedLearningSets?: string[];
}

// 백엔드 결과 DTO (ExplorationResultStore.response()). 화면이 쓰는 ExplorationResult와 구조가 달라
// api/exploration.ts의 매퍼로 변환한다. 서버가 주지 않은 문구는 만들어내지 않는다 (JinroOn/JOBE#95).
export interface BackendExplorationResult {
  resultId: number;
  sessionId: number;
  status: ExplorationResultStatus;
  resultVersion: string;
  resultContractVersion: string;
  completedAt: string;
  completionReason: string;
  reasonCodes: string[];
  groups: {
    groupCode: string;
    majorCodes: string[];
    name?: string;
    summary?: string;
    evidenceLevel?: EvidenceLevel;
    reasonCodes?: string[];
    majors?: BackendExplorationMajor[];
  }[];
  majors: BackendExplorationMajor[];
  cautions: (ExplorationCaution | ExplorationPreparationResponse)[];
  preparationResponses?: ExplorationPreparationResponse[];
  recheckAxes?: RecheckAxis[];
  displayVersion?: string;
  displaySource?: ExplorationResult['displaySource'];
  cautionAvailability?: ExplorationResult['cautionAvailability'];
  cautionUnavailableReason?: string | null;
  nextActivities: ExplorationActivity[];
  activityAvailability: ActivityAvailability;
  activityMessage: string;
  capabilities: ExplorationCapabilities;
  flags: Record<string, boolean>;
  runMode: string;
  testOnly: boolean;
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

// 비교 세트별 방향. 백엔드가 유일하게 사람이 읽을 문장을 주는 곳이다.
export interface ComparisonDirection {
  directionCode: string;
  descriptions: string[];
}

export interface ComparisonSetView {
  comparisonSet: string;
  left: ComparisonDirection[];
  right: ComparisonDirection[];
  focusResponses: { questionId: string; answerText: string; uncertain: boolean }[];
}

export type ComparisonState =
  | 'DISTINCT_DIRECTIONS'
  | 'SAME_DIRECTIONS'
  | 'NO_SHARED_COMPARISON_SET';

export interface ComparisonCandidate {
  majorCode: string;
  name: string;
  groupName: string;
}

export interface SkippedComparisonSet {
  comparisonSet: string;
  reasonCode: string;
  declaredSkipPair: boolean;
}

export interface ExplorationComparison {
  resultId: number;
  majors: ComparisonMajorProfile[];
  commonPoints: string[];
  differences: string[];
  sourceNote: string;
  comparisonSets: ComparisonSetView[];
  comparisonState: ComparisonState | null;
  skippedComparisonSets: SkippedComparisonSet[];
  candidateChoices: ComparisonCandidate[];
  available: boolean;
  reasonCode?: string;
}

// 백엔드 쌍 비교 DTO (ExplorationComparisonController). 축은 코드만 오므로 화면에 쓰지 않는다.
export interface BackendComparisonMajor {
  majorCode: string;
  majorName: string;
  groupCode: string;
  groupName?: string;
  learningSets: string[];
  activityAxes: string[];
  primaryInterestAxes: string[];
  secondaryInterestAxes: string[];
  careerInformationStatus: string;
  preparationInformationStatus: string;
}

export interface BackendExplorationComparison {
  resultId?: number;
  sessionId: number;
  available: boolean;
  message?: string;
  comparisonState?: ComparisonState;
  left?: BackendComparisonMajor;
  right?: BackendComparisonMajor;
  skippedComparisonSets?: SkippedComparisonSet[];
  comparisonSets?: {
    comparisonSet: string;
    leftDirections: { directionCode: string; descriptions: { questionId: string; text: string }[] }[];
    rightDirections: { directionCode: string; descriptions: { questionId: string; text: string }[] }[];
    focusResponses?: { questionId: string; answerText: string; uncertain: boolean }[];
  }[];
  // 파라미터 없이 부르면 후보 목록이 온다 (reasonCode: SELECT_TWO_CANDIDATES)
  candidateChoices?: { majorCode: string; majorName: string; groupCode: string; groupName?: string }[];
  reasonCode?: string;
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

  // 실제 백엔드 공유 응답
  shareRevision?: number;
  available?: boolean;
  publicPath?: string | null;
}

export interface SharedExplorationMajor {
  name: string;
  reason: string;
}

export interface SharedExplorationGroup {
  groupCode?: string;
  name: string;
  summary: string;
  majors: SharedExplorationMajor[];
}

export interface SharedExplorationResult {
  nickname: string | null;
  completedAt?: string;
  status?: ExplorationResultStatus;
  groups: SharedExplorationGroup[];

  // 기존 mock 응답과의 호환성을 위해 선택적으로 유지
  activities?: {
    title: string;
    duration: string;
  }[];
  notes?: string[];

  // 실제 백엔드 공개 결과 응답
  uncertainty?: {
    lowEvidence: boolean;
    noSupportedCandidate: boolean;
    interestTie: boolean;
    lowDifferentiation: boolean;
    message: string;
  };
  nextSteps?: string[];

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
  | 'MAJOR_NOT_IN_RESULT'
  | 'COMPARISON_TARGET_UNAVAILABLE'
  | 'NO_ACTIVE_CATALOG'
  | 'NETWORK'
  | 'UNKNOWN';

export const ABSTAIN_OPTION_CODES = ['UNKNOWN', 'NO_EXPERIENCE'] as const;
