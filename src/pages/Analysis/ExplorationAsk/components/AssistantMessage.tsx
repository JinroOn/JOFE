import type { ConsultationSourceKind, ExplorationChatMessage } from '../../../../types/exploration';

const SOURCE_LABEL: Record<ConsultationSourceKind, string> = {
  RESULT_SNAPSHOT: '검사 결과',
  METRIC_DEFINITION: '지표 정의',
  MAJOR_PROFILE: '전공 프로필',
  ACTIVITY_CATALOG: '탐색 활동',
  ANSWER_POLICY: '답변 정책',
};

// D-27: AI 설명과 시스템 판정 결과를 구분하고, 사용 근거를 펼쳐볼 수 있게 한다
const AssistantMessage = ({ message }: { message: ExplorationChatMessage }) => {
  const insufficient = message.evidenceStatus === 'INSUFFICIENT';
  return (
    <div className="flex gap-3">
      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container text-white" aria-hidden="true">
        <span className="material-symbols-outlined text-[16px]">smart_toy</span>
      </div>
      <div className="min-w-0 flex-1 max-w-[680px] rounded-2xl bg-surface-container-lowest border border-outline-variant/20 px-5 py-4 text-sm leading-7 text-on-surface">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="rounded-full bg-secondary-container/20 px-2.5 py-0.5 text-[11px] font-bold text-secondary">AI 설명</span>
          {insufficient && (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-high px-2.5 py-0.5 text-[11px] font-bold text-on-surface-variant">
              <span className="material-symbols-outlined text-[14px]" aria-hidden="true">help</span>
              추가 확인이 필요해요
            </span>
          )}
        </div>
        {message.content.split('\n').map((line, i) => (
          <p key={i} className="mb-1.5 last:mb-0 break-words">
            {line}
          </p>
        ))}
        <p className="mt-3 text-[11px] leading-relaxed text-on-surface-variant">
          이 설명은 검사 결과와 등록된 전공 정보를 바탕으로 생성되었습니다.
        </p>
        {message.sources.length > 0 && (
          <details className="mt-2 text-xs">
            <summary className="cursor-pointer min-h-[32px] flex items-center font-semibold text-secondary">
              사용한 근거 {message.sources.length}개
            </summary>
            <ul className="mt-1 space-y-1 text-on-surface-variant">
              {message.sources.map((src) => (
                <li key={`${src.kind}-${src.title}`} className="flex flex-wrap gap-x-2">
                  <span className="font-semibold text-primary-container">{SOURCE_LABEL[src.kind]}</span>
                  <span>{src.title}</span>
                  <span className="text-outline">({src.version})</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
};

export default AssistantMessage;
