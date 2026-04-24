const Header = () => {
  return (
    <>
      {/* Announcement Banner */}
      <div className="bg-primary-container text-white py-3 px-4 text-center text-sm font-medium">
        <span className="inline-flex items-center gap-2">
          <span className="bg-secondary-container text-primary-container px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Notice</span>
          2024년 하반기 AI 전공 데이터 업데이트가 완료되었습니다. 지금 바로 진단해보세요!
          <span className="material-symbols-outlined text-sm leading-none">arrow_forward</span>
        </span>
      </div>
      {/* TopNavBar */}
      <header className="sticky top-0 z-50 glass-nav transition-all">
        <nav className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <a className="text-2xl font-black tracking-tighter text-slate-900" href="/">JinroOn</a>
            <div className="hidden md:flex items-center gap-8">
              <a className="text-slate-900 font-bold border-b-2 border-orange-500 pb-1" href="#">전공 탐색</a>
              <a className="text-slate-500 font-medium hover:text-slate-900 transition-colors" href="#">AI 진단</a>
              <a className="text-slate-500 font-medium hover:text-slate-900 transition-colors" href="#">멘토링</a>
              <a className="text-slate-500 font-medium hover:text-slate-900 transition-colors" href="#">자료실</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="px-6 py-2 text-slate-900 font-semibold hover:bg-slate-100/50 rounded-lg transition-all active:scale-95">로그인</button>
            <button className="px-6 py-2.5 bg-primary-container text-white rounded-xl font-bold hover:shadow-lg transition-all active:scale-95">회원가입</button>
            <div className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden ml-2 ring-2 ring-slate-100">
              <img 
                alt="Student Profile Avatar" 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAURAahS9GFVx1mcx_KMtxfYkVIa5Uoj-JA3oBlLIrSlBVkIEVOsYsHaIS0BOK0zX9QLT_qB60UGwtbHkaXsv8Wz85_BO9Z3Hu_7oVgpPJ6WG4lpISBUopmsy1eNPayzwBE4GSPm__GjgxV2xhEK_5B_7lrMfiDcgeiEml71sw95Tvji9DcrvEh3NPtBipzz7hon3dxKlGj2ub1LkV3a9HB3tsEAheGb_Ux8stpPLJ2HJoaF_7czf1BnTbX3O2Gxra6qiyIAIR1JU0"
              />
            </div>
          </div>
        </nav>
      </header>
    </>
  );
};

export default Header;
