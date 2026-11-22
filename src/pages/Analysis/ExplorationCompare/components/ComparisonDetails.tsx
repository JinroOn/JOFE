import type { ExplorationComparison, ExplorationResult } from '../../../../types/exploration';

const ComparisonDetails = ({ data, result }: { data: ExplorationComparison; result: ExplorationResult }) => {
  const reasons = data.majors.map((major) => result.groups.flatMap((group) => group.majors)
    .find((item) => item.majorCode === major.majorCode)?.reasons.map((reason) => reason.text) ?? []);
  return <>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
      {data.majors.map((major) => <div key={major.majorCode} className="rounded-brand bg-primary-container text-white p-5">
        <h2 className="text-lg font-bold">{major.name}</h2>
        {major.groupName && <p className="text-xs mt-1 opacity-80">{major.groupName}</p>}
      </div>)}
    </div>

    {data.comparisonState === 'SAME_DIRECTIONS' && (
      <p role="note" className="rounded-brand bg-secondary-container/15 p-5 mb-6 text-sm text-primary-container">
        비교 항목에서 두 전공의 탐색 방향이 같아요. 이번 자료에서는 두 전공을 다른 방향으로 나누지 않았어요.
      </p>
    )}
    {data.comparisonState === 'NO_SHARED_COMPARISON_SET' && (
      <p role="note" className="rounded-brand bg-secondary-container/15 p-5 mb-6 text-sm text-primary-container">
        두 전공을 같은 기준으로 나눠 보여줄 비교 항목이 아직 없어요. 각 전공의 교육과정과 활동을 직접 살펴보세요.
      </p>
    )}

    {reasons.some((items) => items.length > 0) && <section aria-labelledby="response-title" className="mb-8">
      <h2 id="response-title" className="font-bold text-primary-container mb-3">내 응답에서 나타난 점</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {data.majors.map((major, index) => <div key={major.majorCode} className="rounded-brand bg-surface-container-lowest border border-outline-variant/20 p-5">
          <h3 className="text-sm font-bold text-secondary mb-2">{major.name}</h3>
          <ul className="list-disc pl-4 space-y-2 text-sm text-on-surface-variant">
            {reasons[index].map((text, i) => <li key={`${i}-${text}`}>{text}</li>)}
          </ul>
        </div>)}
      </div>
    </section>}

    {data.comparisonSets.length > 0 && <section aria-labelledby="direction-title">
      <h2 id="direction-title" className="font-bold text-primary-container mb-3">탐색 방향의 차이</h2>
      <div className="space-y-4">
        {data.comparisonSets.map((set, panelIndex) => <section key={set.comparisonSet} aria-label={`비교 항목 ${panelIndex + 1}`} className="rounded-brand bg-surface-container-low p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {(['left', 'right'] as const).map((side, index) => <div key={side}>
              <h3 className="text-sm font-bold text-secondary mb-2">{data.majors[index].name}</h3>
              <ul className="list-disc pl-4 space-y-2 text-sm text-on-surface-variant leading-relaxed">
                {[...new Set(set[side].flatMap((direction) => direction.descriptions))].map((text) => <li key={text}>{text}</li>)}
              </ul>
            </div>)}
          </div>
          {set.focusResponses.length > 0 && <div className="border-t border-outline-variant/30 pt-4 mt-4">
            <h3 className="text-sm font-bold text-primary-container mb-2">당시 내가 답한 탐색 방향</h3>
            <ul className="text-sm text-on-surface-variant space-y-2">
              {set.focusResponses.map((answer) => <li key={answer.questionId}>{answer.answerText}</li>)}
            </ul>
          </div>}
        </section>)}
      </div>
    </section>}
    {data.skippedComparisonSets.length > 0 && <p role="note" className="text-sm text-on-surface-variant mt-5">
      두 전공의 방향이 같아 따로 나누지 않은 비교 항목이 {data.skippedComparisonSets.length}개 있어요.
    </p>}
    {data.sourceNote && <p className="text-xs text-on-surface-variant mt-8 leading-relaxed">{data.sourceNote}</p>}
  </>;
};

export default ComparisonDetails;
