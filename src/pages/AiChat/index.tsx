import { useState, useEffect, useRef } from 'react';
import type { SyntheticEvent } from 'react';
import Header from '../../components/layout/Header';
import type { ChatMessage } from './types';
import type { ConsultationSession, ConsultationLog } from '../../types/consultation';
import { getSessions, createSession, getSessionLogs, createLog } from '../../api/consultation';
import Sidebar from './components/Sidebar';
import MessageList from './components/MessageList';
import InputArea from './components/InputArea';

const WELCOME_MESSAGE: ChatMessage = {
  id: 0,
  role: 'assistant',
  content:
    '안녕하세요! JinroOn AI 진로 컨설턴트입니다.\n\n관심 있는 전공, 진로 고민, 필요한 역량, 추천 학습 방향을 자유롭게 물어보세요.',
  tags: ['#진로상담', '#전공추천'],
};

const AI_PENDING_MESSAGE: ChatMessage = {
  id: -1,
  role: 'assistant',
  content: '메시지를 저장했습니다. AI 응답 기능이 곧 연동될 예정이에요.',
};

const logToMessage = (log: ConsultationLog): ChatMessage => ({
  id: log.id,
  role: log.role === 'assistant' ? 'assistant' : 'user',
  content: log.content,
});

const makeSessionTitle = (firstMessage?: string): string => {
  if (firstMessage) return firstMessage.slice(0, 40);
  const now = new Date();
  return `상담 ${now.getMonth() + 1}/${now.getDate()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

const AiChat = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [sessions, setSessions] = useState<ConsultationSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [navVisible, setNavVisible] = useState(false);
  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [sending, setSending] = useState(false);
  const navTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const loadSessionLogs = async (sessionId: number) => {
    setLoadingLogs(true);
    setActiveSessionId(sessionId);
    try {
      const logs = await getSessionLogs(sessionId);
      setMessages(logs.length > 0 ? logs.map(logToMessage) : [WELCOME_MESSAGE]);
    } catch {
      setMessages([WELCOME_MESSAGE]);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const list = await getSessions();
        setSessions(list);
        if (list.length > 0) {
          const latest = [...list].sort(
            (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
          )[0];
          await loadSessionLogs(latest.id);
        }
      } catch {
        // keep welcome message on error
      } finally {
        setLoadingInit(false);
      }
    };
    load();
  }, []);

  const handleNewChat = async () => {
    try {
      const session = await createSession({ title: makeSessionTitle() });
      setSessions((prev) => [session, ...prev]);
      setActiveSessionId(session.id);
      setMessages([WELCOME_MESSAGE]);
      setMessage('');
    } catch {
      setActiveSessionId(null);
      setMessages([WELCOME_MESSAGE]);
      setMessage('');
    }
  };

  const showNav = () => {
    clearTimeout(navTimer.current);
    setNavVisible(true);
  };

  const hideNav = () => {
    navTimer.current = setTimeout(() => setNavVisible(false), 400);
  };

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || sending) return;

    const userMsg: ChatMessage = { id: Date.now(), role: 'user', content: trimmed };
    setMessages((prev) => [...prev.filter((m) => m.id !== 0), userMsg]);
    setMessage('');
    setSending(true);

    try {
      let sessionId = activeSessionId;

      if (!sessionId) {
        const session = await createSession({ title: makeSessionTitle(trimmed) });
        setSessions((prev) => [session, ...prev]);
        sessionId = session.id;
        setActiveSessionId(session.id);
      }

      await createLog({ consultationSessionId: sessionId, role: 'user', content: trimmed });
      setMessages((prev) => [...prev, { ...AI_PENDING_MESSAGE, id: Date.now() }]);
    } catch {
      // 메시지는 UI에 표시되나 DB 저장 실패
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <div className="fixed inset-x-0 top-0 z-[101] h-2" onMouseEnter={showNav} />
      <div
        className={`fixed inset-x-0 top-0 z-[100] transition-transform duration-300 ${
          navVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
        onMouseEnter={showNav}
        onMouseLeave={hideNav}
      >
        <Header />
      </div>

      <Sidebar
        sidebarOpen={sidebarOpen}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onNewChat={handleNewChat}
        onSelectSession={loadSessionLogs}
      />

      <section className="flex min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-outline-variant/10 px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex p-2 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-high transition-all"
            >
              <span className="material-symbols-outlined">
                {sidebarOpen ? 'menu_open' : 'menu'}
              </span>
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-white shadow-md">
              <span className="material-symbols-outlined text-[22px]">smart_toy</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-on-surface">JinroOn AI 진로 컨설턴트</h1>
                <span className="h-2 w-2 rounded-full bg-green-500" />
              </div>
              <p className="text-xs text-outline">언제든 궁금한 진로 질문을 던져보세요.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-outline">
            <button className="transition hover:text-on-surface" onClick={handleNewChat}>
              <span className="material-symbols-outlined">add_comment</span>
            </button>
            <button className="transition hover:text-on-surface">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>
        </div>

        {loadingInit || loadingLogs ? (
          <div className="flex flex-1 items-center justify-center">
            <span className="text-sm text-on-surface-variant animate-pulse">불러오는 중...</span>
          </div>
        ) : (
          <MessageList messages={messages} />
        )}

        <InputArea
          message={message}
          onChange={setMessage}
          onSubmit={handleSubmit}
          onQuickQuestion={setMessage}
          disabled={sending}
        />
      </section>
    </div>
  );
};

export default AiChat;
