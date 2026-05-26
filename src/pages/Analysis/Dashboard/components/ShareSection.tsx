const ShareSection = () => (
  <section className="mt-12 bg-surface-container-lowest border border-outline-variant/10 p-6 sm:p-8 rounded-[14px] shadow-[0px_20px_40px_rgba(10,25,47,0.06)]">
    <div className="flex flex-col md:flex-row items-center gap-8">
      <div className="w-full md:w-1/2 space-y-4">
        <h4 className="text-xl font-bold text-primary-container">결과 공유하기</h4>
        <p className="text-on-surface-variant text-sm">AI가 분석한 나만의 진로 역량 리포트를 친구들과 공유해보세요.</p>
        <div className="grid grid-cols-2 gap-4">
          <button className="flex items-center justify-center gap-2 p-4 bg-[#FEE500] text-[#3C1E1E] rounded-[14px] font-bold hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined">chat</span>
            카카오톡 공유
          </button>
          <button className="flex items-center justify-center gap-2 p-4 bg-surface-container-high text-on-surface font-bold rounded-[14px] hover:bg-surface-container-highest transition-colors">
            <span className="material-symbols-outlined">link</span>
            링크 복사
          </button>
        </div>
      </div>
      <div className="w-full md:w-1/2">
        <div className="bg-surface-container-low rounded-[14px] p-4 border border-outline-variant/10">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">jinroon.ai</p>
          <h4 className="font-bold text-sm text-primary-container">[분석결과] 나의 AI 최적 전공은 '컴퓨터공학부' 입니다.</h4>
          <p className="text-xs text-on-surface-variant mt-1">JinroOn AI가 분석한 나의 9가지 핵심 역량 리포트를 확인해보세요.</p>
        </div>
      </div>
    </div>
  </section>
);

export default ShareSection;
