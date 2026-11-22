const FooterSimple = () => {
  return (
    <footer className="bg-primary-container border-t border-slate-700/40 px-8 py-10 text-slate-400">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 md:flex-row md:items-end">
        <div>
          <h3 className="mb-3 text-lg font-bold text-white">JinroOn</h3>
          <p className="text-sm leading-relaxed">
            대학 전공 선택부터 진로 설계까지, AI가 제안하는
            <br />
            나만의 커리어 로드맵.
          </p>
        </div>

        {/* 연결할 페이지가 없는 링크는 두지 않는다 (메인 푸터와 같은 기준) */}
        <p className="text-xs">© 2026 JinroOn. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default FooterSimple;
