import type { ConsultationSession } from '../../../types/consultation';
import useAuthStore from '../../../store/useAuthStore';

interface Props {
  sidebarOpen: boolean;
  sessions: ConsultationSession[];
  activeSessionId: number | null;
  onNewChat: () => void;
  onSelectSession: (sessionId: number) => void;
}

const SessionItem = ({
  session,
  isActive,
  onSelect,
}: {
  session: ConsultationSession;
  isActive: boolean;
  onSelect: () => void;
}) => (
  <button
    onClick={onSelect}
    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
      isActive
        ? 'bg-surface-container-high font-bold text-on-surface'
        : 'text-on-surface-variant hover:bg-white'
    }`}
  >
    <span className="material-symbols-outlined shrink-0 text-[18px]">
      {isActive ? 'chat_bubble' : 'history'}
    </span>
    <span className="truncate">{session.title ?? '진로 상담'}</span>
  </button>
);

const Sidebar = ({ sidebarOpen, sessions, activeSessionId, onNewChat, onSelectSession }: Props) => {
  const user = useAuthStore((s) => s.user);

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const sorted = [...sessions].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );
  const recentSessions = sorted.filter((s) => new Date(s.startedAt) >= sevenDaysAgo);
  const lastMonthSessions = sorted.filter((s) => {
    const d = new Date(s.startedAt);
    return d >= thirtyDaysAgo && d < sevenDaysAgo;
  });

  return (
    <aside
      className="hidden lg:flex shrink-0 flex-col border-r border-outline-variant/20 bg-surface-container-low overflow-hidden transition-[width] duration-300"
      style={{ width: sidebarOpen ? '280px' : '0px' }}
    >
      <div className="flex h-full flex-col" style={{ width: '280px', minWidth: '280px' }}>
        <div className="flex-1 overflow-y-auto px-5 py-7">
          <button
            onClick={onNewChat}
            className="mb-7 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-bold text-on-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            새로운 상담 시작
          </button>

          {sessions.length === 0 && (
            <p className="text-xs text-outline text-center mt-8">아직 상담 기록이 없어요.</p>
          )}

          {recentSessions.length > 0 && (
            <div className="mb-8">
              <p className="mb-3 text-xs font-medium text-outline">최근 7일</p>
              <div className="space-y-1">
                {recentSessions.map((session) => (
                  <SessionItem
                    key={session.id}
                    session={session}
                    isActive={activeSessionId === session.id}
                    onSelect={() => onSelectSession(session.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {lastMonthSessions.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-medium text-outline">지난 한 달</p>
              <div className="space-y-1">
                {lastMonthSessions.map((session) => (
                  <SessionItem
                    key={session.id}
                    session={session}
                    isActive={activeSessionId === session.id}
                    onSelect={() => onSelectSession(session.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-outline-variant/20 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-container/20 text-secondary">
              <span className="material-symbols-outlined text-[18px]">school</span>
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface">{user?.nickname ?? '사용자'}</p>
              <p className="text-xs text-on-surface-variant">AI 진로 상담</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
