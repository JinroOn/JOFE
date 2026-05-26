const AiCommentBanner = () => (
  <div className="bg-primary-container p-6 sm:p-8 rounded-[14px] relative overflow-hidden">
    <div className="relative z-10">
      <div className="flex items-center gap-3 mb-4">
        <span className="material-symbols-outlined text-secondary-container">auto_awesome</span>
        <span className="text-sm font-bold tracking-widest text-secondary-container">AI 전문 분석 의견</span>
      </div>
      <p className="text-lg sm:text-xl font-bold text-white leading-relaxed">
        "홍길동님의 인지 강점과 데이터 처리 능력을 고려할 때,{' '}
        <span className="text-[#FFAB00]">컴퓨터공학 및 데이터 사이언스</span>{' '}
        분야가 가장 최적화된 매칭으로 분석되었습니다."
      </p>
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

export default AiCommentBanner;
