interface AiCommentBannerProps {
  comment?: string | null;
  status?: string | null;
  errorMessage?: string | null;
  isGenerating?: boolean;
  disabled?: boolean;
  onGenerate?: () => void;
}

const statusLabelMap: Record<string, string> = {
  NOT_REQUESTED: '설명 생성 전',
  PENDING: '설명 생성 중',
  SUCCEEDED: '설명 준비 완료',
  FAILED: '설명 생성 실패',
  SKIPPED: '설명 생성 생략',
};

const AiCommentBanner = ({
  comment,
  status,
  errorMessage,
  isGenerating = false,
  disabled = false,
  onGenerate,
}: AiCommentBannerProps) => {
  const hasComment = Boolean(comment?.trim());

  const statusLabel = status
    ? statusLabelMap[status] ?? '상태 확인 필요'
    : '설명 생성 전';

  return (
    <section
      aria-label="전공 추천 종합 의견"
      className="relative overflow-hidden rounded-[14px] bg-primary-container p-6 sm:p-8"
    >
      <div className="relative z-10">
        <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span
              className="material-symbols-outlined text-secondary-container"
              aria-hidden="true"
            >
              description
            </span>

            <h2 className="text-sm font-bold tracking-widest text-secondary-container">
              전공 추천 종합 의견
            </h2>
          </div>

          <span
            className="self-start rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white sm:self-auto"
            role="status"
          >
            {isGenerating
              ? '설명 생성 중'
              : statusLabel}
          </span>
        </div>

        <p className="whitespace-pre-line text-lg font-bold leading-relaxed text-white sm:text-xl">
          {hasComment ? (
            comment
          ) : (
            <>
              진단 결과와 추천 전공 정보를 바탕으로
              종합 의견을 확인할 수 있습니다.
              <span className="mt-2 block text-sm font-medium text-white/80">
                {onGenerate
                  ? '추천 설명 생성 버튼을 눌러 결과 안내를 확인해 주세요.'
                  : '등록된 종합 의견이 없습니다.'}
              </span>
            </>
          )}
        </p>

        {errorMessage && (
          <p
            role="alert"
            className="mt-4 text-sm font-bold text-red-200"
          >
            추천 설명 처리 오류: {errorMessage}
          </p>
        )}

        {onGenerate && (
          <button
            type="button"
            onClick={onGenerate}
            disabled={disabled || isGenerating}
            className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-[12px] bg-[#FFAB00] px-4 py-3 font-bold text-primary-container transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span
              className="material-symbols-outlined text-base"
              aria-hidden="true"
            >
              {isGenerating
                ? 'hourglass_top'
                : 'refresh'}
            </span>

            {isGenerating
              ? '추천 설명 생성 중...'
              : hasComment
                ? '추천 설명 다시 확인'
                : '추천 설명 생성'}
          </button>
        )}
      </div>

      <div
        className="pointer-events-none absolute bottom-[-20px] right-[-20px] opacity-10"
        aria-hidden="true"
      >
        <span
          className="material-symbols-outlined text-[120px]"
          style={{
            fontVariationSettings: "'FILL' 1",
          }}
        >
          psychology
        </span>
      </div>
    </section>
  );
};

export default AiCommentBanner;