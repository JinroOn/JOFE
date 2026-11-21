import type { ExplorationPreparationResponse } from '../../../../types/exploration';

const PreparationResponses = ({ responses }: { responses: ExplorationPreparationResponse[] }) => {
  if (responses.length === 0) return null;
  return <details className="rounded-brand bg-surface-container-low p-5 sm:p-6 mb-8">
    <summary className="cursor-pointer font-bold text-primary-container min-h-[44px] flex items-center">
      내가 답한 준비 상황 보기
    </summary>
    <p className="text-sm text-on-surface-variant mt-2 mb-4">검사 당시 답한 내용을 그대로 확인할 수 있어요. 전공별 확인 안내와는 별개예요.</p>
    <dl className="space-y-4 text-sm">
      {responses.map((response) => <div key={response.questionId}>
        <dt className="font-semibold text-primary-container mb-1">{response.questionText}</dt>
        <dd className="text-on-surface-variant">{response.answerText}</dd>
      </div>)}
    </dl>
  </details>;
};

export default PreparationResponses;
