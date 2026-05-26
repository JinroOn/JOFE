import { useState, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import logo from '../../assets/logo.svg';

const NAV_LINKS = [
  {
    label: '역량진단',
    to: '/diagnosis',
    sub: [
      { label: '전공 진단', to: '/diagnosis' },
      { label: '역량 평가 퀴즈', to: '/diagnosis/quiz' },
    ],
  },
  {
    label: '진로분석',
    to: '/analysis',
    sub: [
      { label: '결과 리포트', to: '/analysis/dashboard' },
      { label: '취약 역량 분석', to: '/analysis/weak' },
      { label: '전공 탐색', to: '/diagnosis/explore' },
      { label: '전공 시뮬레이션', to: '/analysis/compare' },
    ],
  },
  {
    label: '자료실',
    to: '/library',
    sub: [
      { label: '공지사항 및 자료실', to: '/library' },
      { label: '학습콘텐츠', to: '/library/content' },
    ],
  },
];

const Header = () => {
  const { isLoggedIn, user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMenuEnter = (label: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMenu(label);
  };

  const handleMenuLeave = () => {
    closeTimer.current = setTimeout(() => setOpenMenu(null), 150);
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-[12px] bg-[rgba(248,250,252,0.7)] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
      <nav className="max-w-[1280px] mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">

        <div className="flex items-center gap-10">
          <Link to="/">
            <img src={logo} alt="JinroOn" className="h-[51px] w-[205px] object-contain" />
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(({ label, to, sub }) => (
              <div
                key={to}
                className="relative"
                onMouseEnter={() => handleMenuEnter(label)}
                onMouseLeave={handleMenuLeave}
              >
                <button className="flex items-center gap-1 text-[16px] font-bold text-[#0a192f] hover:opacity-70 transition-opacity">
                  {label}
                  <span className="material-symbols-outlined text-[14px]">keyboard_arrow_down</span>
                </button>

                {openMenu === label && (
                  <div className="absolute top-full left-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-outline-variant/20 py-1 z-50">
                    {sub.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end
                        onClick={() => setOpenMenu(null)}
                        className={({ isActive }) =>
                          `block px-4 py-2.5 text-sm font-medium hover:bg-surface-container-low transition-colors ${isActive ? 'text-secondary font-bold' : 'text-[#0a192f]'}`
                        }
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <Link
              to="/ai-chat"
              className="px-4 py-2 bg-secondary-fixed text-secondary font-extrabold text-[16px] rounded-[8px] shadow-sm hover:opacity-80 transition-opacity"
            >
              AI챗봇
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4">
            {isLoggedIn ? (
              <div
                className="relative"
                onMouseEnter={() => handleMenuEnter('profile')}
                onMouseLeave={handleMenuLeave}
              >
                <button className="w-10 h-10 rounded-full bg-secondary ring-2 ring-slate-100 overflow-hidden flex items-center justify-center text-white font-bold text-sm">
                  {user?.nickname?.[0] ?? 'U'}
                </button>
                {openMenu === 'profile' && (
                  <div className="absolute top-full right-0 mt-2 w-36 bg-white rounded-xl shadow-lg border border-outline-variant/20 py-1 z-50">
                    <Link
                      to="/mypage"
                      onClick={() => setOpenMenu(null)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#0a192f] hover:bg-surface-container-low transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">person</span>
                      프로필 보기
                    </Link>
                    <button
                      onClick={() => { logout(); setOpenMenu(null); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-error hover:bg-surface-container-low transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">logout</span>
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
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

      {mobileOpen && (
        <div className="md:hidden bg-[rgba(248,250,252,0.97)] backdrop-blur-xl border-t border-outline-variant/20 px-4 sm:px-8 py-6 flex flex-col gap-2">
          {NAV_LINKS.map(({ label, to, sub }) => (
            <div key={to}>
              <p className="text-[16px] font-bold text-[#0a192f] py-2 border-b border-outline-variant/10">{label}</p>
              <div className="pl-4 flex flex-col gap-1 mt-1 mb-2">
                {sub.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `text-sm py-1.5 text-[#0a192f] ${isActive ? 'text-secondary font-bold' : 'font-medium'}`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
          <Link
            to="/ai-chat"
            onClick={() => setMobileOpen(false)}
            className="py-2 text-[16px] font-extrabold text-secondary border-b border-outline-variant/10"
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
