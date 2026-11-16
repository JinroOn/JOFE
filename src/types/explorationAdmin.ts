export type CatalogTargetType =
  | 'CATALOG'
  | 'RULESET'
  | 'ACTIVITY_CATALOG';

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

// POST /reviews
export interface CatalogReviewRequest {
  targetType: CatalogTargetType;
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
