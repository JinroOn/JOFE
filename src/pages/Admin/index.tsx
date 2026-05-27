import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';

const sideNavClass = ({ isActive }: { isActive: boolean }) =>
  isActive
    ? 'flex items-center gap-3 px-4 py-3 bg-blue-600/10 text-blue-400 border-r-4 border-tertiary-fixed-dim font-bold transition-all translate-x-1'
    : 'flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors';

const AdminLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="bg-background text-on-surface min-h-screen">
      {/* 사이드바 */}
      <aside className="hidden md:flex h-screen w-64 fixed left-0 top-0 bg-slate-950 flex-col py-6 z-50 shadow-inner-right">
        {/* 로고 */}
        <div className="px-6 mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary-container flex items-center justify-center shrink-0">
              <span
                className="material-symbols-outlined text-on-secondary-container"
                style={{ fontVariationSettings: '"FILL" 1' }}
              >
                analytics
              </span>
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white font-headline tracking-tighter">JinroOn</h1>
              <p className="text-[10px] text-on-primary-container uppercase tracking-widest">Higher Ed Intelligence</p>
            </div>
          </div>
        </div>

        {/* 네비게이션 */}
        <nav className="flex-1 space-y-1 px-3">
          <NavLink to="/admin" end className={sideNavClass}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>dashboard</span>
            <span>대시보드</span>
          </NavLink>
          <NavLink to="/admin/majors" className={sideNavClass}>
            <span className="material-symbols-outlined">school</span>
            <span>전공 관리</span>
          </NavLink>
        </nav>

        {/* 하단: 사용자 정보 + 로그아웃 */}
        <div className="px-4 mt-auto space-y-1">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-900">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white font-bold text-sm shrink-0">
              {user?.nickname?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{user?.nickname ?? '관리자'}</p>
              <p className="text-[10px] text-on-primary-container">System Supervisor</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">logout</span>
            <span>로그아웃</span>
          </button>
        </div>
      </aside>

      {/* 모바일 상단 바 (md 미만에서만) */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-slate-950 border-b border-slate-800">
        <div className="flex justify-between items-center px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-secondary-container flex items-center justify-center">
              <span
                className="material-symbols-outlined text-on-secondary-container text-xl"
                style={{ fontVariationSettings: '"FILL" 1' }}
              >
                analytics
              </span>
            </div>
            <h1 className="text-lg font-extrabold text-white font-headline tracking-tighter">JinroOn</h1>
          </div>
          <nav className="flex items-center gap-4">
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                `text-sm font-bold transition-colors ${isActive ? 'text-blue-400' : 'text-slate-400'}`
              }
            >
              대시보드
            </NavLink>
            <NavLink
              to="/admin/majors"
              className={({ isActive }) =>
                `text-sm font-bold transition-colors ${isActive ? 'text-blue-400' : 'text-slate-400'}`
              }
            >
              전공 관리
            </NavLink>
          </nav>
        </div>
      </header>

      {/* 페이지 콘텐츠 */}
      <main className="md:ml-64 pt-14 md:pt-0 pb-12 min-h-screen">
        <Outlet />
      </main>

      {/* FAB */}
      <button
        className="fixed bottom-8 right-8 z-30 bg-primary text-white w-14 h-14 rounded-full flex items-center justify-center cloud-shadow hover:scale-110 transition-transform active:scale-95 group"
        aria-label="AI 도우미"
        onClick={() => navigate('/ai-chat')}
      >
        <span className="material-symbols-outlined text-3xl group-hover:rotate-90 transition-transform">
          auto_awesome
        </span>
      </button>
    </div>
  );
};

export default AdminLayout;
