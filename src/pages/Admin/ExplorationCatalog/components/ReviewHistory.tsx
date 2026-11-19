import type { CatalogReview } from '../../../../types/explorationAdmin';

import { DECISION_LABEL, REVIEW_KIND_LABEL, formatDateTime } from './adminLabels';

// 카탈로그와 활동 한 건이 같은 검토 이력 모양을 쓴다
const ReviewHistory = ({ reviews }: { reviews: CatalogReview[] }) => (
  <section className="mb-10">
    <h3 className="text-lg font-bold text-primary mb-4">
      검토 이력
      <span className="ml-2 text-sm font-normal text-on-surface-variant">{reviews.length}건</span>
    </h3>

    <div className="space-y-3">
      {reviews.map((review) => (
        <div key={review.reviewId} className="rounded-[14px] border border-outline-variant/20 bg-surface-container-lowest p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <strong className="text-sm text-primary">{REVIEW_KIND_LABEL[review.reviewKind] ?? review.reviewKind}</strong>
            <span className={`text-xs font-bold ${review.decision === 'REJECTED' ? 'text-error' : 'text-secondary'}`}>
              {DECISION_LABEL[review.decision] ?? review.decision}
            </span>
          </div>

          <div className="mt-3 space-y-1 text-sm text-on-surface-variant">
            <p>검토자 ID: {review.reviewerId}</p>
            <p>검토 범위: {review.scope}</p>
            <p>검토 시각: {formatDateTime(review.reviewedAt)}</p>
            <p>검토 대상 버전: {review.targetVersion}</p>
            <p className="break-all">검토 근거: {review.evidenceReference}</p>
            <p className={review.matchesCurrentContent ? 'text-secondary' : 'text-error'}>
              {review.matchesCurrentContent ? '현재 자료와 일치하는 검토 기록' : '현재 자료와 다른 이전 버전의 검토 기록'}
            </p>
          </div>
        </div>
      ))}

      {reviews.length === 0 && (
        <p className="py-8 text-center text-sm text-on-surface-variant">아직 검토 이력이 없습니다.</p>
      )}
    </div>
  </section>
);

export default ReviewHistory;
