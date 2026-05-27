import { useState, useRef } from 'react';
import type { SyntheticEvent } from 'react';
import Header from '../../components/layout/Header';
import type { ChatMessage } from './types';
import Sidebar from './components/Sidebar';
import MessageList from './components/MessageList';
import InputArea from './components/InputArea';

const initialMessages: ChatMessage[] = [
  {
    id: 1,
    role: 'assistant',
    content:
      '안녕하세요! 당신의 성향과 성적을 바탕으로 최적의 진로를 찾아드리는 JinroOn AI입니다.\n\n현재 데이터 사이언스 분야에 관심이 있으시군요? 해당 전공에 대해 궁금한 점이나, 관련 직무 역량을 쌓는 방법에 대해 물어봐 주세요.',
    tags: ['#데이터사이언스', '#인공지능공학'],
  },
  {
    id: 2,
    role: 'user',
    content:
      '비전공자인데 데이터 분석가로 커리어를 시작하려면 어떤 과목을 중점적으로 들어야 할까요? 특히 통계학 기초가 부족한데 보완할 수 있는 로드맵이 궁금해요.',
  },
  {
    id: 3,
    role: 'assistant',
    content:
      '비전공자로서 데이터 분석가를 준비하시는 것은 매우 전략적인 선택입니다! 기초를 탄탄히 하기 위한 3단계 로드맵을 제안해 드립니다.',
    steps: [
      {
        title: '응용 통계학 기초',
        description:
          "수식 중심보다는 '데이터의 분포'와 '추론'의 개념을 이해하는 입문 강의를 추천합니다.",
      },
      {
        title: 'Python 기반 데이터 전처리',
        description:
          'Pandas 라이브러리를 활용해 실제 데이터를 만져보며 통계적 개념을 시각화해 보세요.',
      },
      {
        title: '도메인 전문성 결합',
        description:
          '현재 전공의 전문 지식을 데이터 분석에 녹여내는 프로젝트가 가장 강력한 무기가 됩니다.',
      },
    ],
  },
];

const createNewChatMessages = (): ChatMessage[] => [
  {
    id: 1,
    role: 'assistant',
    content:
      '안녕하세요! JinroOn AI 진로 컨설턴트입니다.\n\n새로운 상담을 시작했어요. 관심 있는 전공, 진로 고민, 필요한 역량, 추천 학습 방향을 자유롭게 물어보세요.',
    tags: ['#진로상담', '#전공추천'],
  },
];

const createRecentChatMessages = (chatTitle: string, index: number): ChatMessage[] => {
  if (index === 0) return initialMessages;

  if (index === 1) {
    return [
      {
        id: 1,
        role: 'assistant',
        content:
          '소프트웨어학부 전공 핵심 역량 상담 기록을 불러왔습니다.\n\n소프트웨어 분야는 프로그래밍 기초, 문제 해결력, 프로젝트 경험을 중심으로 준비하는 것이 중요합니다.',
        tags: ['#소프트웨어학부', '#프로그래밍역량'],
      },
      {
        id: 2,
        role: 'user',
        content: '소프트웨어학부에 진학하려면 어떤 과목이랑 역량을 먼저 준비해야 하나요?',
      },
      {
        id: 3,
        role: 'assistant',
        content: '소프트웨어학부를 준비한다면 다음 3가지 역량을 우선적으로 쌓는 것을 추천합니다.',
        steps: [
          {
            title: '프로그래밍 기초',
            description:
              'Python 또는 JavaScript 중 하나를 선택해 변수, 조건문, 반복문, 함수부터 익히는 것이 좋습니다.',
          },
          {
            title: '컴퓨팅 사고력',
            description:
              '문제를 작은 단위로 나누고 순서대로 해결하는 연습이 필요합니다. 알고리즘 입문 문제 풀이가 도움이 됩니다.',
          },
          {
            title: '프로젝트 경험',
            description:
              '간단한 웹 페이지, Todo 앱, 진로 추천 페이지처럼 결과물이 보이는 프로젝트를 만들어보는 것이 좋습니다.',
          },
        ],
      },
    ];
  }

  if (index === 2) {
    return [
      {
        id: 1,
        role: 'assistant',
        content:
          '비전공자 IT 취업 로드맵 상담 기록을 불러왔습니다.\n\n비전공자는 처음부터 모든 기술을 배우기보다, 목표 직무를 정하고 필요한 기술만 순서대로 학습하는 전략이 필요합니다.',
        tags: ['#비전공자', '#IT취업', '#로드맵'],
      },
      {
        id: 2,
        role: 'user',
        content:
          '비전공자인데 IT 쪽으로 취업하려면 프론트엔드, 백엔드, 데이터 중에서 어떤 방향을 먼저 정해야 할까요?',
      },
      {
        id: 3,
        role: 'assistant',
        content:
          '비전공자라면 처음에는 결과물이 빠르게 보이는 분야부터 시작하는 것이 좋습니다. 다음 순서로 방향을 잡아보세요.',
        steps: [
          {
            title: '프론트엔드 입문',
            description:
              'HTML, CSS, JavaScript를 통해 화면을 직접 구현하면서 웹 개발의 기본 구조를 이해할 수 있습니다.',
          },
          {
            title: 'React 기반 프로젝트',
            description:
              'React와 TypeScript를 활용해 로그인, 메인 페이지, 게시판 같은 실제 서비스 화면을 구현해보세요.',
          },
          {
            title: '포트폴리오 정리',
            description:
              '단순 클론보다 문제 정의, 구현 기능, 맡은 역할, 개선 결과를 정리한 포트폴리오가 중요합니다.',
          },
        ],
      },
    ];
  }

  return [
    {
      id: 1,
      role: 'assistant',
      content: `${chatTitle} 상담 기록을 불러왔습니다.\n\n이전 상담 내용을 이어서 질문할 수 있습니다.`,
      tags: ['#최근상담', '#진로상담'],
    },
  ];
};

const createLastMonthMessages = (chatTitle: string): ChatMessage[] => [
  {
    id: 1,
    role: 'assistant',
    content: `${chatTitle} 상담 기록을 불러왔습니다.\n\n이전 상담 내용을 이어서 질문하거나, 관련 진로 정보를 추가로 물어볼 수 있습니다.`,
    tags: ['#상담기록', '#진로컨설팅'],
  },
];

const AiChat = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [activeChatKey, setActiveChatKey] = useState<string | null>('recent-0');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [navVisible, setNavVisible] = useState(false);
  const navTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showNav = () => {
    clearTimeout(navTimer.current);
    setNavVisible(true);
  };

  const hideNav = () => {
    navTimer.current = setTimeout(() => setNavVisible(false), 400);
  };

  const handleNewChat = () => {
    setMessage('');
    setMessages(createNewChatMessages());
    setActiveChatKey(null);
  };

  const handleSelectRecentChat = (chatTitle: string, index: number) => {
    setActiveChatKey(`recent-${index}`);
    setMessage('');
    setMessages(createRecentChatMessages(chatTitle, index));
  };

  const handleSelectLastMonthChat = (chatTitle: string, index: number) => {
    setActiveChatKey(`last-${index}`);
    setMessage('');
    setMessages(createLastMonthMessages(chatTitle));
  };

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    setMessages((prev) => {
      const nextId = prev.length + 1;
      const userMessage: ChatMessage = { id: nextId, role: 'user', content: trimmedMessage };
      const assistantMessage: ChatMessage = {
        id: nextId + 1,
        role: 'assistant',
        content:
          '좋은 질문입니다. 입력해주신 내용을 기준으로 진로 방향, 필요한 역량, 추천 학습 순서를 정리해드릴게요.',
        steps: [
          {
            title: '현재 관심 분야 정리',
            description: '먼저 관심 있는 전공이나 직무를 기준으로 필요한 핵심 역량을 분류합니다.',
          },
          {
            title: '부족한 역량 확인',
            description: '진단 결과와 비교해 현재 부족한 역량을 우선순위별로 확인합니다.',
          },
          {
            title: '학습 로드맵 구성',
            description:
              '과목, 프로젝트, 자격증, 포트폴리오 순서로 실행 가능한 계획을 세웁니다.',
          },
        ],
      };
      return [...prev, userMessage, assistantMessage];
    });

    setMessage('');
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
        activeChatKey={activeChatKey}
        onNewChat={handleNewChat}
        onSelectRecentChat={handleSelectRecentChat}
        onSelectLastMonthChat={handleSelectLastMonthChat}
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
            <button className="transition hover:text-on-surface">
              <span className="material-symbols-outlined">ios_share</span>
            </button>
            <button className="transition hover:text-on-surface">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>
        </div>

        <MessageList messages={messages} />

        <InputArea
          message={message}
          onChange={setMessage}
          onSubmit={handleSubmit}
          onQuickQuestion={setMessage}
        />
      </section>
    </div>
  );
};

export default AiChat;
