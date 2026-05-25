import { useState } from 'react';

const CATEGORIES = [
  { id: 'logic', label: '논리력', icon: 'psychology' },
  { id: 'math', label: '수리력', icon: 'calculate' },
  { id: 'data', label: '데이터 분석', icon: 'bar_chart' },
  { id: 'situation', label: '상황 판단', icon: 'gavel' },
] as const;

type CategoryId = (typeof CATEGORIES)[number]['id'];

const OPTIONS = [
  { id: 'A', text: '독립 변수의 증가가 종속 변수의 급격한 하락을 유도한다.' },
  { id: 'B', text: '두 변수 사이에는 통계적으로 유의미한 선형 관계가 존재하지 않는다.' },
  { id: 'C', text: '표본의 크기를 확장할 경우 신뢰 구간이 95% 이상으로 수렴한다.' },
  { id: 'D', text: '외부 변수의 통제가 이루어지지 않아 인과 관계 설정이 불가능하다.' },
] as const;

const DiagnosisQuiz = () => {
  const [category, setCategory] = useState<CategoryId>('math');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const questionNumber = 4;
  const totalQuestions = 20;
  const progress = 20;
  const timerSeconds = 8;
  const timerTotal = 30;
  const timerOffset = 100 - (timerSeconds / timerTotal) * 100;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="max-w-[1100px] w-full mx-auto px-4 sm:px-8 pt-8 pb-32 flex-1">
        <div className="flex justify-center mb-8">
          <div className="flex gap-2 p-1 bg-surface-container-low rounded-full">
            {CATEGORIES.map(({ id, label, icon }) => {
              const active = category === id;
              return (
                <button
                  key={id}
                  onClick={() => setCategory(id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                    active
                      ? 'bg-secondary-container/30 text-secondary'
                      : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{icon}</span>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
          <div>
            <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 sm:p-8 shadow-[0_4px_12px_rgba(10,25,47,0.04)]">
              <div className="flex items-start justify-between gap-4 mb-4">
                <span className="text-xs font-bold tracking-widest text-on-surface-variant">
                  QUESTION {String(questionNumber).padStart(2, '0')} / {totalQuestions}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-secondary shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                  AI LIVE ANALYZING
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-primary-container leading-snug mb-6">
                다음 주어진 데이터 세트에서 변수 간의 상관관계를 분석했을 때, 가장 유의미한 결론을 도출할 수 있는 가설은 무엇입니까?
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {OPTIONS.map(({ id, text }) => {
                  const active = selectedOption === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setSelectedOption(id)}
                      className={`text-left p-4 rounded-xl border transition-all ${
                        active
                          ? 'border-secondary bg-secondary-container/10 shadow-[0_0_0_3px_rgba(0,210,255,0.12)]'
                          : 'border-outline-variant/40 hover:bg-surface-container-low'
                      }`}
                    >
                      <p className={`text-xs font-bold tracking-widest mb-1.5 ${active ? 'text-secondary' : 'text-on-surface-variant'}`}>
                        OPTION {id}
                      </p>
                      <p className="text-sm text-on-surface leading-relaxed">{text}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="flex items-center justify-between mt-4 px-2">
              <button className="flex items-center gap-1 text-sm font-semibold text-on-surface-variant hover:text-primary-container transition-colors">
                <span className="material-symbols-outlined text-[18px]">double_arrow</span>
                이 문제 건너뛰기
              </button>
              <button className="flex items-center gap-1 text-sm font-semibold text-on-surface-variant hover:text-primary-container transition-colors">
                <span className="material-symbols-outlined text-[18px]">help</span>
                힌트 보기
              </button>
            </div>
          </div>

          <aside className="flex flex-col gap-4">
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-[0_4px_12px_rgba(10,25,47,0.04)] flex flex-col items-center">
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="46" fill="none" stroke="#e0e3e6" strokeWidth="4" />
                  <circle
                    cx="50"
                    cy="50"
                    r="46"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="289"
                    strokeDashoffset={(289 * timerOffset) / 100}
                    className="text-secondary transition-all"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-3xl font-extrabold text-primary-container leading-none">
                    {String(timerSeconds).padStart(2, '0')}
                  </p>
                  <p className="text-[10px] tracking-widest text-on-surface-variant mt-1">SECONDS</p>
                </div>
              </div>
              <p className="text-base font-bold text-primary-container mt-5">Time is running out!</p>
              <p className="text-xs text-on-surface-variant text-center mt-1">
                빠른 판단이 높은 점수로 이어집니다.
              </p>
            </div>

            <div className="bg-primary-container text-white rounded-2xl p-5 shadow-[0_8px_20px_rgba(13,28,50,0.12)]">
              <p className="text-xs font-bold tracking-widest text-secondary-container mb-2">
                MEMBER TIP
              </p>
              <p className="text-sm leading-relaxed text-white/90">
                이 유형의 문제는 데이터 시각화 역량을 평가합니다. '상관관계'와 '인과관계'의 차이에 집중해 보세요.
              </p>
            </div>
          </aside>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-surface-container-lowest border-t border-outline-variant/30 shadow-[0_-4px_12px_rgba(10,25,47,0.04)]">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs text-on-surface-variant mb-1.5">
              <span>전체 진행률</span>
              <span className="font-bold">{progress}% 완료</span>
            </div>
            <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full bg-secondary rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden sm:block text-right">
              <p className="text-xs text-on-surface-variant">다음 단계</p>
              <p className="text-sm font-bold text-primary-container">AI 성향 매칭</p>
            </div>
            <button className="flex items-center gap-1 px-5 py-2.5 text-sm font-bold text-white bg-primary-container rounded-xl shadow-[0_8px_20px_rgba(13,28,50,0.18)] hover:opacity-90 transition-opacity">
              다음 질문
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisQuiz;
