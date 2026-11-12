// 관리자 탐색형 진단 카탈로그 타입
// 기준: 04 문서 DB 3절(상태와 버전)·exploration_catalog, 01 문서 D-32·D-33, 05 문서 롤백 절차
// 관리자 API는 04 문서에 없어 백엔드와 합의 전 프런트 가정이다.

export type CatalogType = 'QUESTION_CATALOG' | 'OPTION_CATALOG' | 'MAJOR_MAPPING' | 'RULESET';

// D-32 콘텐츠 상태
export type CatalogStatus = 'DRAFT' | 'REVIEWED' | 'ACTIVE' | 'ARCHIVED';

// 04 문서: 외부 검토 상태는 콘텐츠 상태와 섞지 않고 따로 저장한다
export type ExternalReviewStatus = 'APPROVED_FOR_IMPLEMENTATION' | 'DOMAIN_REVIEW_PENDING' | null;

export type CatalogAction = 'REVIEW' | 'ACTIVATE' | 'ROLLBACK';

export interface CatalogSummary {
  catalogId: number;
  catalogType: CatalogType;
  version: string;
  status: CatalogStatus;
  contentHash: string;
  itemCount: number;
  author: string;
  reviewer: string | null;
  externalReviewStatus: ExternalReviewStatus;
  createdAt: string;
  activatedAt: string | null;
  // 서버가 현재 관리자에게 허용한 동작. 화면은 이 목록만 버튼으로 보여준다.
  allowedActions: CatalogAction[];
  // 허용되지 않은 이유 (예: 작성자 본인은 검토 불가)
  blockedReason: string | null;
}

export interface CatalogQuestion {
  questionId: string;
  questionVersion: string;
  stage: 'STAGE_1' | 'STAGE_2' | 'STAGE_3' | 'POST_RESULT';
  moduleCode: string;
  metricCode: string | null;
  text: string;
  optionCount: number;
}

export interface CatalogDetail extends CatalogSummary {
  // 문항 카탈로그일 때만 채워진다
  questions: CatalogQuestion[];
}

export interface CatalogTransitionRequest {
  expectedStatus: CatalogStatus;
}
