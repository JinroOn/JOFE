export type CatalogTargetType =
  | 'CATALOG'
  | 'RULESET'
  | 'ACTIVITY_CATALOG';

// 검토 기록 대상. 활동 한 건(ACTIVITY)은 검토만 할 수 있고 목록·상세·활성화 경로에는 쓰지 않는다
// (백엔드 CatalogReviewService.TargetType, JOBE #125)
export type CatalogReviewTargetType =
  | CatalogTargetType
  | 'ACTIVITY';

export type CatalogContentStatus =
  | 'DRAFT'
  | 'REVIEWED'
  | 'ACTIVE'
  | 'ARCHIVED';

export type CatalogAction =
  | 'REVIEW'
  | 'ACTIVATE'
  | 'ARCHIVE';

export type CatalogReviewKind =
  | 'IMPLEMENTATION'
  | 'DOMAIN'
  | 'PILOT'
  | 'RELEASE';

export type CatalogReviewDecision =
  | 'APPROVED'
  | 'REJECTED';

export type CatalogActivationScope =
  | 'DEV'
  | 'PILOT'
  | 'PUBLIC';

// GET /api/admin/exploration/catalogs
export interface CatalogSummary {
  targetType: CatalogTargetType;
  targetId: number;
  catalogType: string;
  version: string;

  contentStatus: CatalogContentStatus;

  implementationReviewStatus: string | null;
  domainReviewStatus: string | null;

  contentHash: string;
  itemCount: number | null;
  createdAt: string | null;

  usedByRuntime: boolean;

  allowedActions: CatalogAction[];
  blockedReasons: Partial<Record<CatalogAction, string>>;
}

// 상세 조회에 포함되는 문항
export interface CatalogQuestion {
  questionId: string;
  questionVersion: string;
  stage: string;
  moduleCode: string;
  metricCode: string | null;
  text: string | null;

  contentStatus: string;
  implementationReviewStatus: string;
  domainReviewStatus: string;
}

// 검토 이력
export interface CatalogReview {
  reviewId: number;
  reviewKind: string;
  decision: string;
  scope: string;
  reviewerId: number;
  reviewedAt: string;

  targetVersion: string;
  targetHash: string;
  matchesCurrentContent: boolean;

  evidenceReference: string;
}

// 활성화 및 보관 이력
export interface CatalogActivation {
  activationId: number;
  action: string;

  targetType: string;
  targetId: number;
  targetVersion: string;
  targetHash: string;

  scope: string | null;
  actorId: number;
  relatedTargetId: number | null;

  reviewIds: number[];
  reason: string;
  createdAt: string;
}

// GET /catalogs/{targetType}/{targetId}
export interface CatalogDetail {
  catalog: CatalogSummary;
  reviews: CatalogReview[];
  activations: CatalogActivation[];
  questions: CatalogQuestion[];
}

// GET /catalogs/ACTIVITY_CATALOG/{catalogId}/activities
export interface CatalogActivitySummary {
  targetType: 'ACTIVITY';
  targetId: number;
  activityCode: string;
  version: string;
  // 공통 활동은 null
  majorCode: string | null;
  title: string | null;
  kind: string | null;
  contentHash: string;
  contentStatus: string;
  implementationReviewStatus: string;
  domainReviewStatus: string;
}

export interface CatalogActivitySource {
  source_id?: string;
  title?: string;
  url?: string;
  publisher?: string;
  role?: string;
  checked_on?: string;
  verified_claim?: string;
  application?: string;
}

// 활동 원본(payload_json)을 그대로 돌려준다. 백엔드가 필드를 고정하지 않아 화면에서 쓰는 것만 적고 나머지는 열어 둔다
export interface CatalogActivityContent {
  title?: string;
  kind?: string;
  major_name?: string;
  body_markdown?: string;
  steps?: string[];
  artifacts?: string[];
  alternative?: string;
  allowed_use?: string;
  score_effect?: string;
  purpose?: string;
  safety_boundary?: string;
  example_output?: string;
  worksheet_markdown?: string;
  // 제안 시간이며 실제 수행 시간은 측정 전이다 (measured: false)
  duration_minutes_proposal?: { min?: number; max?: number; measured?: boolean } | null;
  requirements?: {
    materials?: string[];
    paid_tools?: boolean;
    external_account?: boolean;
    coding_experience?: boolean;
  };
  sources?: CatalogActivitySource[];
  [key: string]: unknown;
}

// GET /catalogs/ACTIVITY_CATALOG/{catalogId}/activities/{activityId}
export interface CatalogActivityDetail {
  activity: CatalogActivitySummary;
  content: CatalogActivityContent;
  reviews: CatalogReview[];
}

// POST /reviews
export interface CatalogReviewRequest {
  targetType: CatalogReviewTargetType;
  targetId: number;
  reviewKind: CatalogReviewKind;
  decision: CatalogReviewDecision;
  evidenceReference: string;
}

// POST /activations
export interface CatalogActivationRequest {
  targetType: CatalogTargetType;
  targetId: number;
  scope: CatalogActivationScope;
  reason: string;
}

// POST /activations/archive
export interface CatalogArchiveRequest {
  targetType: CatalogTargetType;
  targetId: number;
  reason: string;
}
