import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import logo from '../../assets/logo.svg';

const NAV_LINKS = [
  { label: '역량진단', to: '/diagnosis' },
  { label: '진로분석', to: '/analysis' },
  { label: '자료실', to: '/library' },
];

const Header = () => {
  const { isLoggedIn, user } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-[12px] bg-[rgba(248,250,252,0.7)] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
      <nav className="max-w-[1280px] mx-auto px-8 h-20 flex items-center justify-between">

        {/* 로고 */}
        <div className="flex items-center gap-10">
          <Link to="/">
            <img src={logo} alt="JinroOn" className="h-[51px] w-[205px] object-contain" />
          </Link>

          {/* 데스크탑 Nav */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(({ label, to }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1 text-[16px] font-bold text-[#0a192f] hover:opacity-70 transition-opacity ${isActive ? 'opacity-100' : ''}`
                }
              >
                {label}
                <span className="material-symbols-outlined text-[14px]">keyboard_arrow_down</span>
              </NavLink>
            ))}
            <Link
              to="/ai-chat"
              className="px-4 py-2 bg-secondary-fixed text-secondary font-extrabold text-[16px] rounded-[8px] shadow-sm hover:opacity-80 transition-opacity"
            >
              AI챗봇
            </Link>
          </div>
        </div>

        {/* 우측 영역 */}
        <div className="flex items-center gap-4">
          {/* 데스크탑 */}
          <div className="hidden md:flex items-center gap-4">
            {isLoggedIn ? (
              <Link to="/mypage" className="w-10 h-10 rounded-full bg-secondary ring-2 ring-slate-100 overflow-hidden flex items-center justify-center text-white font-bold text-sm">
                {user?.nickname?.[0] ?? 'U'}
              </Link>
            ) : (
              <>
                <Link to="/auth/login" className="px-6 py-2 text-[#0f172a] font-semibold text-[16px] hover:bg-slate-100/50 rounded-lg transition-all">
                  로그인
                </Link>
                <Link to="/auth/signup" className="px-6 py-[10px] bg-primary-container text-white font-bold text-[16px] rounded-[12px] hover:shadow-lg transition-all">
                  회원가입
                </Link>
              </>
            )}
          </div>

          {/* 모바일 햄버거 */}
          <button
            className="md:hidden p-2 text-[#0a192f]"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="메뉴 열기"
          >
            <span className="material-symbols-outlined text-[28px]">
              {mobileOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </nav>

      {/* 모바일 드로어 */}
      {mobileOpen && (
        <div className="md:hidden bg-[rgba(248,250,252,0.97)] backdrop-blur-xl border-t border-outline-variant/20 px-8 py-6 flex flex-col gap-4">
          {NAV_LINKS.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className="text-[16px] font-bold text-[#0a192f] py-2 border-b border-outline-variant/10"
            >
              {label}
            </NavLink>
          ))}
          <Link
            to="/ai-chat"
            onClick={() => setMobileOpen(false)}
            className="py-2 text-[16px] font-extrabold text-secondary"
          >
            AI챗봇
          </Link>
          <div className="flex gap-3 mt-2">
            {isLoggedIn ? (
              <Link to="/mypage" onClick={() => setMobileOpen(false)} className="flex-1 text-center py-2 bg-primary-container text-white font-bold rounded-[12px]">
                마이페이지
              </Link>
            ) : (
              <>
                <Link to="/auth/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center py-2 border border-outline-variant/30 text-[#0f172a] font-semibold rounded-lg">
                  로그인
                </Link>
                <Link to="/auth/signup" onClick={() => setMobileOpen(false)} className="flex-1 text-center py-2 bg-primary-container text-white font-bold rounded-[12px]">
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
