import { useState } from 'react';

const CATEGORIES = [
  { id: 'logic', label: '논리력', icon: 'psychology' },
  { id: 'math', label: '수리력', icon: 'calculate' },
  { id: 'data', label: '데이터 분석', icon: 'bar_chart' },
  { id: 'situation', label: '상황 판단', icon: 'gavel' },
] as const;

type CategoryId = (typeof CATEGORIES)[number]['id'];

const DiagnosisQuiz = () => {
  const [category, setCategory] = useState<CategoryId>('math');
  const progress = 20;

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
