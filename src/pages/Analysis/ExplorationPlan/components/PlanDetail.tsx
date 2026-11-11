import type { ExplorationPlan, PlanPhase } from '../../../../types/exploration';

const PHASES: { key: PlanPhase; title: string; desc: string }[] = [
  { key: 'INFO', title: '1~4주 · 정보 확인', desc: '교육과정과 진로 정보를 찾아보며 궁금한 점을 정리해요.' },
  { key: 'BASIC_LEARNING', title: '5~8주 · 기초 학습 맛보기', desc: '입문 강의나 글로 전공 기초 개념을 가볍게 접해봐요.' },
  { key: 'SMALL_ACTIVITY', title: '9~12주 · 작은 활동', desc: '직접 해보고 물어보면서 계속 탐색할지 정해봐요.' },
];

const SOURCE_LABEL: Record<string, string> = {
  RESULT_SNAPSHOT: '검사 결과',
  METRIC_DEFINITION: '지표 정의',
  MAJOR_PROFILE: '전공 프로필',
  ACTIVITY_CATALOG: '탐색 활동',
  ANSWER_POLICY: '답변 정책',
};

const PlanDetail = ({ plan }: { plan: ExplorationPlan }) => (
  <article aria-labelledby="plan-title">
    <div className="flex flex-wrap items-center gap-2 mb-2">
      <span className="rounded-full bg-secondary-container/20 px-2.5 py-0.5 text-[11px] font-bold text-secondary">AI가 정리한 계획</span>
    </div>
    <h2 id="plan-title" className="text-xl sm:text-2xl font-bold text-primary-container mb-2">
      {plan.majorName} 12주 탐색 계획
    </h2>
    <p className="text-sm text-on-surface-variant leading-relaxed mb-1">
      합격 준비 계획이 아니라, 이 전공이 나에게 어떤지 알아보기 위한 계획이에요. 해보다가 다른 전공이 궁금해지면 바꿔도
      괜찮아요.
    </p>
    <p className="text-[11px] text-on-surface-variant mb-2">이 계획은 검사 결과와 등록된 전공 정보를 바탕으로 생성되었습니다.</p>
    {plan.sources.length > 0 && (
      <details className="text-xs mb-6">
        <summary className="cursor-pointer min-h-[32px] flex items-center font-semibold text-secondary">
          사용한 근거 {plan.sources.length}개
        </summary>
        <ul className="mt-1 space-y-1 text-on-surface-variant">
          {plan.sources.map((s) => (
            <li key={`${s.kind}-${s.title}`} className="flex flex-wrap gap-x-2">
              <span className="font-semibold text-primary-container">{SOURCE_LABEL[s.kind] ?? s.kind}</span>
              <span>{s.title}</span>
              <span className="text-outline">({s.version})</span>
            </li>
          ))}
        </ul>
      </details>
    )}

    <div className="space-y-8">
      {PHASES.map((phase) => {
        const weeks = plan.weeks.filter((w) => w.phase === phase.key);
        if (weeks.length === 0) return null;
        return (
          <section key={phase.key} aria-labelledby={`phase-${phase.key}`}>
            <h3 id={`phase-${phase.key}`} className="font-bold text-primary-container">{phase.title}</h3>
            <p className="text-sm text-on-surface-variant mb-3">{phase.desc}</p>
            <ol className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {weeks.map((w) => (
                <li key={w.week} className="rounded-brand bg-surface-container-lowest border border-outline-variant/20 p-4">
                  <p className="text-xs font-bold text-secondary mb-1">{w.week}주차</p>
                  <p className="font-bold text-primary-container mb-2">{w.title}</p>
                  <ul className="list-disc pl-4 space-y-1 text-sm text-on-surface-variant">
                    {w.tasks.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-on-surface-variant border-t border-outline-variant/20 pt-2">
                    <span className="font-semibold text-primary-container">남길 것 · </span>
                    {w.expectedOutput}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  </article>
);

export default PlanDetail;
