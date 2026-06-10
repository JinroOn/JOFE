interface AiCommentBannerProps {
  comment?: string | null;
  status?: string | null;
  errorMessage?: string | null;
  isGenerating?: boolean;
  disabled?: boolean;
  onGenerate?: () => void;
}

const statusLabelMap: Record<string, string> = {
  NOT_REQUESTED: 'AI 분석 대기',
  PENDING: 'AI 분석 생성 중',
  SUCCEEDED: 'AI 분석 완료',
  FAILED: 'AI 분석 실패',
  SKIPPED: 'AI 분석 건너뜀',
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
  const statusLabel = status ? statusLabelMap[status] ?? status : 'AI 분석 대기';

  return (
    <div className="bg-primary-container p-6 sm:p-8 rounded-[14px] relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary-container">
              auto_awesome
            </span>
            <span className="text-sm font-bold tracking-widest text-secondary-container">
              AI 전문 분석 의견
            </span>
          </div>

          <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold">
            {isGenerating ? '생성 중' : statusLabel}
          </span>
        </div>

        <p className="text-lg sm:text-xl font-bold text-white leading-relaxed whitespace-pre-line">
          {hasComment ? (
            comment
          ) : (
            <>
              AI가 9가지 핵심 역량 지표와 추천 전공 적합도를 바탕으로 진로 방향을 분석합니다.
              <br />
              <span className="text-[#FFAB00]">
                AI 추천 설명 생성 버튼을 눌러 맞춤형 분석 의견을 확인할 수 있습니다.
              </span>
            </>
          )}
        </p>

        {errorMessage && (
          <p className="mt-4 text-sm font-bold text-red-200">
            AI 코멘트 오류: {errorMessage}
          </p>
        )}

        {onGenerate && (
          <button
            type="button"
            onClick={onGenerate}
            disabled={disabled || isGenerating}
            className="mt-5 inline-flex items-center gap-2 px-4 py-3 rounded-[12px] bg-[#FFAB00] text-primary-container font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 transition-all"
          >
            <span className="material-symbols-outlined text-base">
              {isGenerating ? 'hourglass_top' : 'auto_awesome'}
            </span>
            {isGenerating ? 'AI 설명 생성 중...' : 'AI 추천 설명 생성'}
          </button>
        )}
      </div>

      <div className="absolute right-[-20px] bottom-[-20px] opacity-10 pointer-events-none">
        <span
          className="material-symbols-outlined text-[120px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          psychology
        </span>
      </div>
    </div>
  );
};

export default AiCommentBanner;