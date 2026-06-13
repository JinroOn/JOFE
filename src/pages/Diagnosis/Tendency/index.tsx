import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInProgressSession, updateSession } from '../../../api/diagnosis';

type TendencyKey =
  | 'tendLogicalInquiry'
  | 'tendPracticalTech'
  | 'tendArtCreative'
  | 'tendSocialCooperation'
  | 'tendLifeHealth'
  | 'tendEducationGuide'
  | 'tendTheoryAcademic'
  | 'tendDataAnalytics'
  | 'tendSystemOperation';

interface TendencyVector {
  tendLogicalInquiry: number;
  tendPracticalTech: number;
  tendArtCreative: number;
  tendSocialCooperation: number;
  tendLifeHealth: number;
  tendEducationGuide: number;
  tendTheoryAcademic: number;
  tendDataAnalytics: number;
  tendSystemOperation: number;
}

interface Choice {
  axis: TendencyKey;
  icon: string;
  label: string;
  desc: string;
}

interface Question {
  text: string;
  a: Choice;
  b: Choice;
}

const QUESTIONS: Question[] = [
  {
    text: '어떤 활동이 더 재미있을 것 같나요?',
    a: { axis: 'tendLogicalInquiry', icon: 'functions',  label: '논리 탐구', desc: '복잡한 수학 문제를 논리적으로 풀어내기' },
    b: { axis: 'tendArtCreative',    icon: 'palette',    label: '예술 창작', desc: '음악, 미술, 글쓰기 등 창작 활동하기' },
  },
  {
    text: '미래에 어떤 일을 하고 싶나요?',
    a: { axis: 'tendPracticalTech',     icon: 'code',   label: '기술 개발', desc: '소프트웨어나 기술 제품을 만드는 개발자' },
    b: { axis: 'tendSocialCooperation', icon: 'groups', label: '사회 협력', desc: '사람들과 협력해 사회 문제를 해결하기' },
  },
  {
    text: '어떤 프로젝트가 더 끌리나요?',
    a: { axis: 'tendDataAnalytics', icon: 'analytics', label: '데이터 분석', desc: '대용량 데이터에서 숨겨진 패턴 찾기' },
    b: { axis: 'tendLifeHealth',    icon: 'favorite',  label: '생활 건강',  desc: '사람들의 건강과 생활 환경 개선하기' },
  },
  {
    text: '공부할 때 어떤 방식이 더 잘 맞나요?',
    a: { axis: 'tendTheoryAcademic', icon: 'library_books', label: '이론 학문', desc: '원리와 이론을 깊게 이해하고 정리하기' },
    b: { axis: 'tendPracticalTech',  icon: 'build',         label: '실습 제작', desc: '직접 실험하고 만들어보며 익히기' },
  },
  {
    text: '어떤 역할이 더 즐거울 것 같나요?',
    a: { axis: 'tendSystemOperation', icon: 'cloud',  label: '시스템 운영', desc: '복잡한 시스템을 설계하고 운영하기' },
    b: { axis: 'tendEducationGuide',  icon: 'school', label: '교육 지도',   desc: '지식을 나누고 사람들을 이끄는 멘토' },
  },
  {
    text: '어떤 주제가 더 흥미롭나요?',
    a: { axis: 'tendLogicalInquiry',    icon: 'science',   label: '과학 탐구', desc: '우주, 수학, 자연의 법칙을 탐구하기' },
    b: { axis: 'tendSocialCooperation', icon: 'handshake', label: '공동 협력', desc: '다양한 사람들과 협력해 공동 목표 달성' },
  },
  {
    text: '어떤 결과물을 만들고 싶나요?',
    a: { axis: 'tendArtCreative',   icon: 'brush',     label: '예술 작품',   desc: '사람들에게 감동을 주는 창작 콘텐츠' },
    b: { axis: 'tendDataAnalytics', icon: 'bar_chart', label: '분석 리포트', desc: '데이터 기반 의사결정을 돕는 인사이트' },
  },
  {
    text: '어떤 분야에 더 도전해보고 싶나요?',
    a: { axis: 'tendTheoryAcademic',  icon: 'menu_book',             label: '학문 연구',  desc: '깊이 있는 학술 연구와 논문 작성' },
    b: { axis: 'tendSystemOperation', icon: 'settings_applications', label: '인프라 구축', desc: '자동화 시스템이나 IT 인프라 설계' },
  },
  {
    text: '일상에서 어떤 활동이 더 즐거운가요?',
    a: { axis: 'tendLifeHealth',    icon: 'eco',    label: '건강한 삶', desc: '건강 관리, 환경 보호, 생활 개선하기' },
    b: { axis: 'tendPracticalTech', icon: 'memory', label: '기술 탐험', desc: '새로운 앱이나 프로그램 개발해보기' },
  },
  {
    text: '어떤 목표가 더 동기부여가 되나요?',
    a: { axis: 'tendLogicalInquiry', icon: 'lightbulb',          label: '문제 해결', desc: '어려운 문제를 논리와 창의력으로 해결' },
    b: { axis: 'tendEducationGuide', icon: 'cast_for_education',  label: '교육 기여', desc: '다음 세대를 위한 교육 콘텐츠 만들기' },
  },
  {
    text: '팀에서 어떤 역할이 더 자신 있나요?',
    a: { axis: 'tendSocialCooperation', icon: 'forum',       label: '소통 조율',  desc: '팀원들과 적극 소통하며 협업 이끌기' },
    b: { axis: 'tendDataAnalytics',     icon: 'query_stats', label: '데이터 분석', desc: '수집된 데이터로 인사이트 제공하기' },
  },
  {
    text: '어떤 미래 모습이 더 이상적인가요?',
    a: { axis: 'tendSystemOperation', icon: 'dns',  label: '시스템 엔지니어', desc: '복잡한 IT 인프라를 관리하는 전문가' },
    b: { axis: 'tendArtCreative',     icon: 'draw', label: '크리에이터',      desc: '독창적인 디자인이나 예술로 세상에 영향 주기' },
  },
];

function computeTendencyVector(answers: Record<number, 'A' | 'B'>): TendencyVector {
  const counts: Partial<Record<TendencyKey, number>> = {};
  const totals: Partial<Record<TendencyKey, number>> = {};

  QUESTIONS.forEach((q, i) => {
    const choice = answers[i];
    if (choice === undefined) return;
    totals[q.a.axis] = (totals[q.a.axis] ?? 0) + 1;
    totals[q.b.axis] = (totals[q.b.axis] ?? 0) + 1;
    if (choice === 'A') counts[q.a.axis] = (counts[q.a.axis] ?? 0) + 1;
    else counts[q.b.axis] = (counts[q.b.axis] ?? 0) + 1;
  });

  const score = (key: TendencyKey) =>
    Math.round(((counts[key] ?? 0) / (totals[key] ?? 1)) * 100);

  return {
    tendLogicalInquiry:    score('tendLogicalInquiry'),
    tendPracticalTech:     score('tendPracticalTech'),
    tendArtCreative:       score('tendArtCreative'),
    tendSocialCooperation: score('tendSocialCooperation'),
    tendLifeHealth:        score('tendLifeHealth'),
    tendEducationGuide:    score('tendEducationGuide'),
    tendTheoryAcademic:    score('tendTheoryAcademic'),
    tendDataAnalytics:     score('tendDataAnalytics'),
    tendSystemOperation:   score('tendSystemOperation'),
  };
}

const DiagnosisTendency = () => {
  const navigate = useNavigate();

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, 'A' | 'B'>>({});
  const [isAnimating, setIsAnimating] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [snapshotBase, setSnapshotBase] = useState('{}');
  const [submitting, setSubmitting] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getInProgressSession().then((data) => {
      if (!data?.session) return;
      setSessionId(data.session.id);
      setSnapshotBase(data.session.inputSnapshot ?? '{}');
      try {
        const snap = JSON.parse(data.session.inputSnapshot || '{}');
        if (snap.tendencyAnswers) {
          setAnswers(snap.tendencyAnswers as Record<number, 'A' | 'B'>);
        }
      } catch { /* 파싱 실패 무시 */ }
    });
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const handleJumpTo = (i: number) => {
    if (submitting) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsAnimating(false);
    setIndex(i);
  };

  const saveAndNavigate = async (answersToSave: Record<number, 'A' | 'B'>) => {
    setSubmitting(true);
    const tv = computeTendencyVector(answersToSave);
    try {
      if (sessionId) {
        const existing = JSON.parse(snapshotBase) as Record<string, unknown>;
        await updateSession(sessionId, {
          inputSnapshot: JSON.stringify({ ...existing, tendencyAnswers: answersToSave, tendencyVector: tv }),
          currentStep: 2,
        });
      }
    } catch { /* 저장 실패해도 이동 */ }
    navigate('/diagnosis/quiz');
  };

  const handlePrev = async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (sessionId && Object.keys(answers).length > 0) {
      try {
        const existing = JSON.parse(snapshotBase) as Record<string, unknown>;
        await updateSession(sessionId, {
          inputSnapshot: JSON.stringify({ ...existing, tendencyAnswers: answers }),
        });
      } catch { /* 저장 실패 무시 */ }
    }
    navigate('/diagnosis', { state: { skipChoice: true } });
  };

  const handleSelect = (choice: 'A' | 'B') => {
    if (isAnimating || submitting) return;

    const newAnswers = { ...answers, [index]: choice };
    setAnswers(newAnswers);
    setIsAnimating(true);

    timerRef.current = setTimeout(async () => {
      const allAnswered = QUESTIONS.every((_, i) => newAnswers[i] !== undefined);

      if (allAnswered) {
        await saveAndNavigate(newAnswers);
        return;
      }

      // 현재 이후 미답 문항 → 없으면 앞에서 찾기
      let next = QUESTIONS.findIndex((_, i) => i > index && newAnswers[i] === undefined);
      if (next === -1) next = QUESTIONS.findIndex((_, i) => newAnswers[i] === undefined);
      setIndex(next);
      setIsAnimating(false);
    }, 400);
  };

  const handleNext = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    void saveAndNavigate(answers);
  };

  const q = QUESTIONS[index];
  const total = QUESTIONS.length;
  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((answeredCount / total) * 100);

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="max-w-[800px] w-full mx-auto px-4 sm:px-8 pt-10 pb-32 flex-1">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-secondary-container/20 text-secondary mb-4">
            <span className="material-symbols-outlined text-[14px]">psychology</span>
            성향 평가
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-container mb-2">
            나에게 더 잘 맞는 것을 골라주세요
          </h1>
          <p className="text-sm text-on-surface-variant">
            직관적으로 끌리는 쪽을 선택하세요 &middot; {answeredCount}/{total} 완료
          </p>
        </div>

        {/* 진행 바 */}
        <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-secondary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 문항 번호 네비게이션 */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {QUESTIONS.map((_, i) => {
            const isAnswered = answers[i] !== undefined;
            const isCurrent = i === index;
            return (
              <button
                key={i}
                onClick={() => handleJumpTo(i)}
                disabled={submitting}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all disabled:cursor-default ${
                  isCurrent
                    ? 'bg-primary-container text-white shadow-[0_4px_10px_rgba(13,28,50,0.2)]'
                    : isAnswered
                    ? 'bg-secondary text-white'
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container border border-outline-variant/30'
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        {/* 질문 */}
        <p className="text-lg sm:text-xl font-bold text-primary-container text-center mb-8">
          {q.text}
        </p>

        {/* 선택 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {(['a', 'b'] as const).map((side) => {
            const choice = side === 'a' ? 'A' : 'B';
            const item = q[side];
            const isSelected = answers[index] === choice;
            return (
              <button
                key={side}
                onClick={() => handleSelect(choice)}
                disabled={isAnimating || submitting}
                className={`group flex flex-col items-center text-center p-8 rounded-2xl border-2 transition-all duration-300 disabled:cursor-default ${
                  isSelected
                    ? 'border-secondary bg-secondary/5 shadow-[0_0_0_4px_rgba(0,103,127,0.12)] scale-[1.02]'
                    : 'border-outline-variant/30 bg-surface-container-lowest hover:border-secondary/50 hover:bg-surface-container-low hover:scale-[1.01]'
                }`}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-colors ${
                  isSelected
                    ? 'bg-secondary text-white'
                    : 'bg-surface-container-high text-on-surface-variant group-hover:bg-secondary/10 group-hover:text-secondary'
                }`}>
                  <span className="material-symbols-outlined text-[32px]">{item.icon}</span>
                </div>
                <p className={`text-base font-bold mb-2 transition-colors ${
                  isSelected ? 'text-secondary' : 'text-primary-container'
                }`}>
                  {item.label}
                </p>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {item.desc}
                </p>
                {isSelected && (
                  <div className="mt-4 flex items-center gap-1 text-xs font-bold text-secondary">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    선택됨
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-surface-container-lowest border-t border-outline-variant/30 shadow-[0_-4px_12px_rgba(10,25,47,0.04)]">
        <div className="max-w-[800px] mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => void handlePrev()}
            disabled={isAnimating || submitting}
            className="flex items-center gap-1 text-sm font-semibold text-on-surface-variant hover:text-primary-container transition-colors disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span className="hidden sm:inline">이전 단계</span>
          </button>
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px]">psychology</span>
            <span>2단계 <span className="font-bold text-primary-container">/ 3단계</span></span>
            <span className="text-outline-variant">·</span>
            <span>문항 {answeredCount}<span className="font-bold text-primary-container">/{total}</span></span>
          </div>
          <button
            onClick={handleNext}
            disabled={submitting}
            className="flex items-center gap-1 px-5 py-2.5 text-sm font-bold text-white bg-primary-container rounded-xl shadow-[0_8px_20px_rgba(13,28,50,0.18)] hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {submitting ? '저장 중...' : '다음 단계로'}
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisTendency;
