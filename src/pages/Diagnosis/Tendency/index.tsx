import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTendencyResult, getInProgressSession, updateSession } from '../../../api/diagnosis';
import type { TendencyResultPayload } from '../../../types/diagnosis';

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

function toTendencyPayload(sessionId: number, vector: TendencyVector): TendencyResultPayload {
  return {
    diagnosisSessionId: sessionId,
    logicalInquiry: vector.tendLogicalInquiry,
    practicalTech: vector.tendPracticalTech,
    artCreative: vector.tendArtCreative,
    socialCooperation: vector.tendSocialCooperation,
    lifeHealth: vector.tendLifeHealth,
    educationGuide: vector.tendEducationGuide,
    theoryAcademic: vector.tendTheoryAcademic,
    dataAnalytics: vector.tendDataAnalytics,
    systemOperation: vector.tendSystemOperation,
  };
}

function isComplete(answersToCheck: Record<number, 'A' | 'B'>) {
  return QUESTIONS.every((_, i) => answersToCheck[i] !== undefined);
}

function firstUnansweredIndex(answersToCheck: Record<number, 'A' | 'B'>) {
  return QUESTIONS.findIndex((_, i) => answersToCheck[i] === undefined);
}

const DiagnosisTendency = () => {
  const navigate = useNavigate();

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, 'A' | 'B'>>({});
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [snapshotBase, setSnapshotBase] = useState('{}');
  const [submitting, setSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getInProgressSession().then((data) => {
      if (!data?.session) return;
      setSessionId(data.session.id);
      setSnapshotBase(data.session.inputSnapshot ?? '{}');
      try {
        const snap = JSON.parse(data.session.inputSnapshot || '{}');
        if (snap.tendencyAnswers) {
          const restored = snap.tendencyAnswers as Record<number, 'A' | 'B'>;
          setAnswers(restored);
          const first = firstUnansweredIndex(restored);
          setIndex(first === -1 ? QUESTIONS.length - 1 : first);
        }
      } catch { /* 파싱 실패 무시 */ }
    });
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, []);

  // 진행 중 답변을 세션 스냅샷에 저장 (선택 즉시 자동 저장)
  const saveProgress = (answersToSave: Record<number, 'A' | 'B'>) => {
    if (!sessionId) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus('saving');
    saveTimerRef.current = setTimeout(async () => {
      try {
        const existing = JSON.parse(snapshotBase) as Record<string, unknown>;
        await updateSession(sessionId, {
          inputSnapshot: JSON.stringify({ ...existing, tendencyAnswers: answersToSave }),
        });
        setSaveStatus('saved');
      } catch {
        setSaveStatus('idle');
      }
    }, 300);
  };

  const saveAndNavigate = async (answersToSave: Record<number, 'A' | 'B'>) => {
    if (!isComplete(answersToSave)) {
      const first = firstUnansweredIndex(answersToSave);
      if (first !== -1) setIndex(first);
      setCompletionMessage('모든 문항에 답해야 다음 단계로 넘어갈 수 있어요.');
      return;
    }

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSubmitting(true);
    const tv = computeTendencyVector(answersToSave);
    try {
      if (sessionId) {
        const existing = JSON.parse(snapshotBase) as Record<string, unknown>;
        await updateSession(sessionId, {
          inputSnapshot: JSON.stringify({ ...existing, tendencyAnswers: answersToSave, tendencyVector: tv }),
          currentStep: 2,
        });
        await createTendencyResult(toTendencyPayload(sessionId, tv)).catch((error) => {
          console.error('[Tendency] structured tendency result save failed:', error);
        });
      }
    } catch (error) {
      console.error('[Tendency] tendency snapshot save failed:', error);
      setSubmitting(false);
      return;
    }
    navigate('/diagnosis/quiz');
  };

  const handlePrevStep = async () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
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

  const handlePrev = () => {
    if (submitting) return;
    if (index > 0) {
      setCompletionMessage(null);
      setIndex(index - 1);
      return;
    }
    void handlePrevStep();
  };

  const handleSelect = (choice: 'A' | 'B') => {
    if (submitting) return;
    const newAnswers = { ...answers, [index]: choice };
    setAnswers(newAnswers);
    setCompletionMessage(null);
    saveProgress(newAnswers);
  };

  const handleNext = () => {
    if (submitting) return;
    if (isComplete(answers)) {
      void saveAndNavigate(answers);
      return;
    }
    // 현재 이후 미답 문항 → 없으면 앞에서 찾기
    let next = QUESTIONS.findIndex((_, i) => i > index && answers[i] === undefined);
    if (next === -1) next = firstUnansweredIndex(answers);
    setIndex(next);
  };

  const handleJumpTo = (i: number) => {
    if (submitting) return;
    setCompletionMessage(null);
    setIndex(i);
  };

  const q = QUESTIONS[index];
  const total = QUESTIONS.length;
  const currentNo = index + 1;
  const progress = Math.round((currentNo / total) * 100);
  const currentAnswered = answers[index] !== undefined;
  const allAnswered = isComplete(answers);

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="max-w-[1090px] w-full mx-auto px-4 sm:px-6 pt-6 pb-32 flex-1">
        <div className="mb-8 text-center">
          <span className="inline-block px-14 py-1.5 mb-3 rounded-full bg-secondary-container/10 text-xs font-bold text-secondary">
            공통 성향 진단
          </span>
          <h1 className="break-keep text-2xl sm:text-[34px] sm:leading-tight font-bold text-primary-container mb-2">
            평소 자신의 모습과 가장 가까운 쪽을 선택해주세요
          </h1>
          <p className="text-[13px] text-on-surface-variant">
            정답이 없는 질문입니다. · {currentNo} / {total} 완료
          </p>
        </div>

        <div className="h-[5px] w-full bg-surface-container-high rounded-full overflow-hidden mb-7">
          <div
            className="h-full bg-secondary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {completionMessage && (
          <p className="mb-4 text-center text-sm font-semibold text-secondary">{completionMessage}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] lg:grid-cols-[1fr_320px] gap-3 items-start">
          <section className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 sm:p-[30px] md:min-h-[468px]">
            <div className="flex items-start justify-between gap-4 mb-10">
              <span className="text-xs font-bold text-primary-container">
                QUESTION {String(currentNo).padStart(2, '0')} / {total}
              </span>
              {saveStatus === 'saving' ? (
                <span className="text-[11px] font-bold text-on-surface-variant shrink-0">SAVING...</span>
              ) : (
                currentAnswered && saveStatus === 'saved' && (
                  <span className="text-[11px] font-bold text-secondary shrink-0">AUTO SAVED ✓</span>
                )
              )}
            </div>

            <h2 className="break-keep text-xl sm:text-[25px] font-bold text-primary-container leading-snug mb-10">
              {q.text}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-[18px] md:max-w-[620px]">
              {(['a', 'b'] as const).map((side) => {
                const choice = side === 'a' ? 'A' : 'B';
                const item = q[side];
                const active = answers[index] === choice;
                return (
                  <button
                    key={side}
                    onClick={() => handleSelect(choice)}
                    disabled={submitting}
                    className={`text-left min-h-[110px] px-5 py-4 rounded-xl border transition-all disabled:opacity-60 ${
                      active
                        ? 'border-2 border-secondary bg-secondary-container/10'
                        : 'border-outline-variant/40 hover:bg-surface-container-low'
                    }`}
                  >
                    <span className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] font-bold text-primary-container">OPTION {choice}</span>
                      <span className={`material-symbols-outlined text-[18px] ${active ? 'text-secondary' : 'text-on-surface-variant'}`}>
                        {item.icon}
                      </span>
                    </span>
                    <span className={`block text-sm font-bold mb-1 ${active ? 'text-secondary' : 'text-primary-container'}`}>
                      {item.label}
                    </span>
                    <span className="block text-xs text-primary-container leading-relaxed">{item.desc}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <aside className="flex flex-col gap-3">
            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-4 md:min-h-[210px]">
              <p className="text-[13px] font-bold text-primary-container mb-4">문항 진행 현황</p>
              <div className="grid grid-cols-10 gap-[5px]">
                {QUESTIONS.map((_, i) => {
                  const isDone = answers[i] !== undefined;
                  const isCurrent = i === index;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleJumpTo(i)}
                      disabled={submitting}
                      title={`${i + 1}번 문항으로 이동`}
                      className={`w-full aspect-square rounded text-[10px] font-bold flex items-center justify-center transition-all disabled:opacity-60 ${
                        isCurrent
                          ? 'border-2 border-primary-container bg-white text-primary-container'
                          : isDone
                          ? 'bg-secondary text-white hover:opacity-90'
                          : 'bg-surface-container-low text-on-surface-variant hover:bg-secondary-container/20 hover:text-secondary'
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 text-center">
              <p className="text-xs font-bold text-on-surface-variant mb-3">현재 진행</p>
              <p className="text-[34px] font-bold text-primary-container leading-none mb-3">
                {currentNo} / {total}
              </p>
              <p className="text-xs text-on-surface-variant">약 {progress}% 완료</p>
            </div>

            <div className="bg-primary-container rounded-2xl p-5">
              <p className="text-xs font-bold text-secondary-container mb-2">TIP</p>
              <p className="text-xs leading-relaxed text-white">
                성향검사는 정답이 없습니다.
                <br />
                실제 자신의 모습과 가까운 쪽을 선택해주세요.
              </p>
            </div>
          </aside>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-surface-container-lowest border-t border-outline-variant/40">
        <div className="max-w-[1250px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-3">
          <button
            onClick={handlePrev}
            disabled={submitting}
            className="text-[13px] font-bold text-on-surface-variant hover:text-primary-container transition-colors disabled:opacity-60 shrink-0"
          >
            ← {index > 0 ? '이전 문항' : '이전 단계'}
          </button>

          <p className="hidden sm:block text-[13px] font-bold text-on-surface-variant">
            2단계 / 5단계 · 공통 성향 · {currentNo} / {total}
          </p>

          <button
            onClick={handleNext}
            disabled={submitting || (!currentAnswered && !allAnswered)}
            className="shrink-0 px-8 py-2.5 rounded-lg bg-secondary text-[13px] font-bold text-white hover:opacity-90 transition-opacity disabled:bg-on-primary-container disabled:opacity-100"
          >
            {submitting ? '저장 중...' : allAnswered ? '다음 단계 →' : '다음 질문 →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisTendency;
