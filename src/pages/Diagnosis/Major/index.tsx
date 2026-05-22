import { useState } from 'react';

const GRADES = ['1학년', '2학년', '3학년'] as const;

const SUBJECTS = [
  { label: '수학', icon: 'calculate' },
  { label: '과학', icon: 'science' },
  { label: '국어', icon: 'menu_book' },
  { label: '사회', icon: 'public' },
  { label: '영어', icon: 'translate' },
  { label: '예술', icon: 'palette' },
  { label: '정보/코딩', icon: 'code' },
];

const DiagnosisMajor = () => {
  const [grade, setGrade] = useState<(typeof GRADES)[number]>('1학년');
  const [dreamJob, setDreamJob] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['과학']);

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject],
    );
  };

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-[900px] mx-auto px-4 sm:px-8 pt-6 pb-16">
        <div className="flex items-center justify-between gap-4 bg-primary-container text-white rounded-2xl px-5 py-3.5 mb-8 shadow-[0_8px_20px_rgba(13,28,50,0.12)]">
          <div className="flex items-center gap-3 min-w-0">
            <span className="material-symbols-outlined text-secondary-container shrink-0">history</span>
            <div className="min-w-0">
              <p className="font-semibold text-sm sm:text-base truncate">이전에 중단된 진단이 있습니다.</p>
              <p className="text-xs text-white/60 mt-0.5">최근 저장: 2024년 5월 24일 오후 2:30</p>
            </div>
          </div>
          <button className="shrink-0 px-4 py-1.5 bg-secondary-container text-on-secondary-fixed text-sm font-bold rounded-lg hover:opacity-90 transition-opacity">
            이어하기
          </button>
        </div>

        <div className="mb-8">
          <div className="flex items-end justify-between mb-2">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-primary-container">
                전공 적성 정밀 진단
              </h1>
              <p className="text-on-surface-variant text-sm mt-2">
                AI가 당신의 답변을 분석하여 최적의 진로를 설계합니다.
              </p>
            </div>
            <p className="text-2xl font-extrabold text-primary-container shrink-0">
              01<span className="text-base font-bold text-on-surface-variant">/ 03</span>
            </p>
          </div>
          <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-secondary rounded-full" />
          </div>
        </div>

        <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 sm:p-8 mb-6 shadow-[0_4px_12px_rgba(10,25,47,0.04)]">
          <h2 className="flex items-center gap-2 text-lg font-bold text-primary-container mb-6">
            <span className="material-symbols-outlined text-secondary">school</span>
            기본 정보 및 관심 분야
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-2">현재 학년</label>
              <div className="flex gap-2">
                {GRADES.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGrade(g)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                      grade === g
                        ? 'border-secondary bg-secondary-container/15 text-secondary'
                        : 'border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-low'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-2">희망 직업 (꿈)</label>
              <div className="relative">
                <input
                  type="text"
                  value={dreamJob}
                  onChange={(e) => setDreamJob(e.target.value)}
                  placeholder="예: AI 데이터 사이언티스트"
                  className="w-full pl-4 pr-10 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-secondary-container focus:border-transparent transition-all"
                />
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                  travel_explore
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-2">
              가장 좋아하는 과목 (다중 선택)
            </label>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map(({ label, icon }) => {
                const active = selectedSubjects.includes(label);
                return (
                  <button
                    key={label}
                    onClick={() => toggleSubject(label)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                      active
                        ? 'border-secondary bg-secondary-container/15 text-secondary'
                        : 'border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-low'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{icon}</span>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between gap-3">
          <button className="flex items-center gap-1 text-sm font-semibold text-on-surface-variant hover:text-primary-container transition-colors">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            이전 단계
          </button>
          <div className="flex items-center gap-2">
            <button className="px-5 py-2.5 text-sm font-bold text-on-surface-variant border border-outline-variant/40 bg-surface-container-lowest rounded-xl hover:bg-surface-container-low transition-colors">
              임시 저장
            </button>
            <button className="flex items-center gap-1 px-5 py-2.5 text-sm font-bold text-white bg-primary-container rounded-xl shadow-[0_8px_20px_rgba(13,28,50,0.18)] hover:opacity-90 transition-opacity">
              다음 단계로
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisMajor;
