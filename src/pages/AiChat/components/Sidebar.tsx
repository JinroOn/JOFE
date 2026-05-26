const recentChats = [
  '데이터 사이언스 진로 설계',
  '소프트웨어학부 전공 핵심...',
  '비전공자 IT 취업 로드맵',
];

const lastMonthChats = ['인공지능 대학원 진학 상담', '글로벌 경영학과 커리큘럼'];

interface Props {
  sidebarOpen: boolean;
  activeChatKey: string | null;
  onNewChat: () => void;
  onSelectRecentChat: (title: string, index: number) => void;
  onSelectLastMonthChat: (title: string, index: number) => void;
}

const Sidebar = ({ sidebarOpen, activeChatKey, onNewChat, onSelectRecentChat, onSelectLastMonthChat }: Props) => (
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

        <div className="mb-8">
          <p className="mb-3 text-xs font-medium text-outline">최근 7일</p>
          <div className="space-y-1">
            {recentChats.map((chat, index) => (
              <button
                key={chat}
                onClick={() => onSelectRecentChat(chat, index)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                  activeChatKey === `recent-${index}`
                    ? 'bg-surface-container-high font-bold text-on-surface'
                    : 'text-on-surface-variant hover:bg-white'
                }`}
              >
                <span className="material-symbols-outlined shrink-0 text-[18px]">
                  {index === 0 ? 'chat_bubble' : 'history'}
                </span>
                <span className="truncate">{chat}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs font-medium text-outline">지난 한 달</p>
          <div className="space-y-1">
            {lastMonthChats.map((chat, index) => (
              <button
                key={chat}
                onClick={() => onSelectLastMonthChat(chat, index)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                  activeChatKey === `last-${index}`
                    ? 'bg-surface-container-high font-bold text-on-surface'
                    : 'text-on-surface-variant hover:bg-white'
                }`}
              >
                <span className="material-symbols-outlined shrink-0 text-[18px]">history</span>
                <span className="truncate">{chat}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-outline-variant/20 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-container/20 text-secondary">
            <span className="material-symbols-outlined text-[18px]">school</span>
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface">김진로 학생</p>
            <p className="text-xs text-on-surface-variant">표준 요금제 이용 중</p>
          </div>
        </div>
        <button className="text-outline transition hover:rotate-45 hover:text-on-surface">
          <span className="material-symbols-outlined text-[20px]">settings</span>
        </button>
      </div>
    </div>
  </aside>
);

export default Sidebar;
