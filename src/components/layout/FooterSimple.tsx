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

        <div className="flex flex-col gap-3 md:items-end">
          <div className="flex gap-8 text-sm">
            <a href="#" className="transition-colors hover:text-white">이용약관</a>
            <a href="#" className="transition-colors hover:text-white">개인정보처리방침</a>
            <a href="#" className="transition-colors hover:text-white">고객센터</a>
          </div>
          <p className="text-xs">© 2026 JinroOn. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSimple;
