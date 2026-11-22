import { useNavigate } from 'react-router-dom';

import type {
  DiagnosisHistoryController,
} from '../../../hooks/useDiagnosisHistory';

import { diagnosisEntryPath } from '../../../config/features';

import {
  historyActionPath,
  historyUnavailableMessage,
} from '../../../utils/diagnosisHistory';

const STATUS = {
  in_progress: {
    label: '진행 중',
    cls: 'bg-yellow-100 text-yellow-700',
  },
  completed: {
    label: '완료',
    cls: 'bg-green-100 text-green-700',
  },
  abandoned: {
    label: '중단',
    cls: 'bg-surface-container text-on-surface-variant',
  },
};

const DiagnosisHistoryPanel = ({
  history,
}: {
  history: DiagnosisHistoryController;
}) => {
  const navigate = useNavigate();

  // API에서도 필터링하지만 화면에서도
  // 이전 방식 진단이 노출되지 않도록 보장합니다.
  const items = history.items.filter(
    (item) => item.type === 'EXPLORATION_V1',
  );

  return (
    <section aria-labelledby="diagnosis-history-title">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2
          id="diagnosis-history-title"
          className="text-2xl font-bold text-primary-container"
        >
          전공 탐색 진단 이력
        </h2>

        {items.length > 0 && (
          <span className="text-sm text-on-surface-variant">
            {history.hasMore ? '불러온' : '총'}{' '}
            {items.length}건
          </span>
        )}

        {history.phase === 'READY' && (
          <button
            type="button"
            onClick={() => void history.refresh()}
            className="min-h-[44px] text-sm font-bold text-secondary"
          >
            이력 새로고침
          </button>
        )}
      </div>

      {history.phase === 'LOADING' && (
        <p
          role="status"
          className="py-10 text-center text-on-surface-variant"
        >
          탐색 진단 이력을 불러오는 중이에요…
        </p>
      )}

      {history.phase === 'ERROR' && (
        <div
          role="alert"
          className="rounded-2xl bg-white p-8 text-center"
        >
          <p className="text-sm leading-relaxed text-on-surface-variant">
            탐색 진단 이력을 불러오지 못했어요.
            잠시 후 다시 확인해 주세요.
          </p>

          <button
            type="button"
            onClick={() => void history.refresh()}
            className="mt-3 min-h-[44px] font-bold text-secondary"
          >
            다시 불러오기
          </button>
        </div>
      )}

      {history.phase === 'READY' &&
        items.length === 0 && (
          <div className="rounded-2xl bg-white p-10 text-center text-on-surface-variant">
            <p>탐색 진단 기록이 없습니다.</p>

            <button
              type="button"
              onClick={() => navigate(diagnosisEntryPath)}
              className="mt-3 min-h-[44px] font-bold text-secondary"
            >
              탐색 진단 시작하기
            </button>
          </div>
        )}

      {history.phase === 'READY' && (
        <ul className="space-y-3">
          {items.map((item) => {
            const title =
              `전공 탐색 진단 #${item.sessionId}`;

            const status = STATUS[item.status];
            const action = historyActionPath(item);
            const unavailable =
              historyUnavailableMessage(item);

            return (
              <li
                key={item.key}
                className="flex flex-col justify-between gap-3 rounded-2xl bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-on-surface">
                    {title}
                  </p>

                  <p className="mt-1 text-xs text-on-surface-variant">
                    {new Date(
                      item.occurredAt,
                    ).toLocaleDateString('ko-KR')}
                  </p>

                  {unavailable && (
                    <p className="mt-2 text-xs text-on-surface-variant">
                      {unavailable}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${status.cls}`}
                  >
                    {status.label}
                  </span>

                  {action && (
                    <button
                      type="button"
                      onClick={() => navigate(action)}
                      className="min-h-[44px] rounded-lg bg-surface-container px-3 text-xs font-bold"
                    >
                      {item.nextAction === 'RESUME'
                        ? '이어하기'
                        : '결과 보기'}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {history.phase === 'READY' &&
        history.moreError && (
          <div
            role="alert"
            className="mt-4 text-sm text-error"
          >
            <p>
              이력을 더 불러오지 못했어요.
              다시 시도하거나 이력을 새로고침해 주세요.
            </p>
          </div>
        )}

      {history.phase === 'READY' &&
        history.hasMore && (
          <button
            type="button"
            disabled={history.loadingMore}
            onClick={() => void history.loadMore()}
            className="mt-5 min-h-[44px] w-full rounded-xl border border-outline-variant px-5 py-3 font-bold text-secondary disabled:opacity-50"
          >
            {history.loadingMore
              ? '불러오는 중…'
              : history.moreError
                ? '더 보기 다시 시도'
                : '이력 더 보기'}
          </button>
        )}
    </section>
  );
};

export default DiagnosisHistoryPanel;