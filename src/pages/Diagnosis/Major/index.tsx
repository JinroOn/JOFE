const DiagnosisMajor = () => {
  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-[900px] mx-auto px-4 sm:px-8 pt-6 pb-16">
        <div className="flex items-center justify-between gap-4 bg-primary-container text-white rounded-2xl px-5 py-3.5 mb-8 shadow-[0_8px_20px_rgba(13,28,50,0.12)]">
          <div className="flex items-center gap-3 min-w-0">
            <span className="material-symbols-outlined text-secondary-container shrink-0">history</span>
            <div className="min-w-0">
              <p className="font-semibold text-sm sm:text-base truncate">이전에 중단된 진단이 있습니다.</p>
              <p className="text-xs text-white/60 mt-0.5">최근 저장: 2024년 5월 24일 오후 2:30</p>
            </div>
          </div>
          <button className="shrink-0 px-4 py-1.5 bg-secondary-container text-on-secondary-fixed text-sm font-bold rounded-lg hover:opacity-90 transition-opacity">
            이어하기
          </button>
        </div>

        <div className="mb-8">
          <div className="flex items-end justify-between mb-2">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-primary-container">
                전공 적성 정밀 진단
              </h1>
              <p className="text-on-surface-variant text-sm mt-2">
                AI가 당신의 답변을 분석하여 최적의 진로를 설계합니다.
              </p>
            </div>
            <p className="text-2xl font-extrabold text-primary-container shrink-0">
              01<span className="text-base font-bold text-on-surface-variant">/ 03</span>
            </p>
          </div>
          <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-secondary rounded-full" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <button className="flex items-center gap-1 text-sm font-semibold text-on-surface-variant hover:text-primary-container transition-colors">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            이전 단계
          </button>
          <div className="flex items-center gap-2">
            <button className="px-5 py-2.5 text-sm font-bold text-on-surface-variant border border-outline-variant/40 bg-surface-container-lowest rounded-xl hover:bg-surface-container-low transition-colors">
              임시 저장
            </button>
            <button className="flex items-center gap-1 px-5 py-2.5 text-sm font-bold text-white bg-primary-container rounded-xl shadow-[0_8px_20px_rgba(13,28,50,0.18)] hover:opacity-90 transition-opacity">
              다음 단계로
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisMajor;
