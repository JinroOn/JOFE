import type { CatalogActivitySummary } from '../../../../types/explorationAdmin';

export const REVIEW_KIND_LABEL: Record<string, string> = {
  IMPLEMENTATION: '구현 검토',
  DOMAIN: '내용 검토',
  PILOT: '시범 운영 검토',
  RELEASE: '공개 출시 검토',
};

export const DECISION_LABEL: Record<string, string> = {
  APPROVED_FOR_IMPLEMENTATION: '구현 승인',
  APPROVED: '승인',
  REJECTED: '반려',
};

export const ACTIVITY_KIND_LABEL: Record<string, string> = {
  INFORMATION: '정보 확인',
  SMALL_TASK: '작은 활동',
  REFLECTION_AND_NEXT_STEP: '돌아보기·다음 단계',
};

export const formatDateTime = (value: string | null | undefined) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('ko-KR');
};

export const reviewStatusLabel = (value: string | null | undefined) => {
  if (!value || value === 'PENDING') return '미검토';
  const labels: Record<string, string> = {
    APPROVED_FOR_IMPLEMENTATION: '구현 승인',
    APPROVED: '승인',
    REJECTED: '반려',
    NOT_APPLICABLE: '해당 없음',
  };
  return labels[value] ?? value;
};

export type ActivityReviewState = 'APPROVED' | 'REJECTED' | 'PENDING';

// 백엔드 ActivityRecommendationService는 활동의 구현 승인과 내용 승인이 모두 있어야 그 활동을 쓴다.
// 여기서는 상태 열만 보고 나누며, 최신 검토 기록의 버전·해시 대조는 백엔드가 한다.
export const activityReviewState = (activity: CatalogActivitySummary): ActivityReviewState => {
  if (activity.implementationReviewStatus === 'REJECTED' || activity.domainReviewStatus === 'REJECTED') {
    return 'REJECTED';
  }
  if (activity.implementationReviewStatus === 'APPROVED_FOR_IMPLEMENTATION' && activity.domainReviewStatus === 'APPROVED') {
    return 'APPROVED';
  }
  return 'PENDING';
};

export const ACTIVITY_REVIEW_STATE_LABEL: Record<ActivityReviewState, string> = {
  APPROVED: '구현·내용 승인',
  REJECTED: '반려 있음',
  PENDING: '검토 대기',
};
