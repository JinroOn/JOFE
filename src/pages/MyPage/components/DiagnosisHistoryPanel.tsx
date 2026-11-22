import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { DiagnosisHistoryController } from '../../../hooks/useDiagnosisHistory';
import { deleteSession } from '../../../api/diagnosis';

import {
  isExplorationEnabled,
  diagnosisEntryPath,
} from '../../../config/features';

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

  const [deleting, setDeleting] =
    useState(false);

  const [toDelete, setToDelete] =
    useState<number | null>(null);

  const [deleteError, setDeleteError] =
    useState(false);

  const remove = async () => {
    if (toDelete === null || deleting) return;

    setDeleting(true);
    setDeleteError(false);

    try {
      await deleteSession(toDelete);

      setToDelete(null);
      await history.refresh();
    } catch {
      setDeleteError(true);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section aria-labelledby="diagnosis-history-title">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2
          id="diagnosis-history-title"
          className="text-2xl font-bold text-primary-container"
        >
          진단 이력
        </h2>

        {history.items.length > 0 && (
          <span className="text-sm text-on-surface-variant">
            {history.hasMore
              ? '불러온'
              : '총'}{' '}
            {history.items.length}건
          </span>
        )}

        {history.phase === 'READY' && (
          <button
            type="button"
            onClick={() =>
              void history.refresh()
            }
            className="min-h-[44px] text-sm font-bold text-secondary"
          >
            이력 새로고침
          </button>
        )}
      </div>

      {history.source === 'legacy' &&
        isExplorationEnabled && (
          <p
            role="note"
            className="text-sm text-on-surface-variant mb-4"
          >
            현재 이전 방식 진단 이력만 표시하고 있어요.
          </p>
        )}

      {history.phase === 'LOADING' && (
        <p
          role="status"
          className="py-10 text-center text-on-surface-variant"
        >
          진단 이력을 불러오는 중이에요…
        </p>
      )}

      {history.phase === 'ERROR' && (
        <div
          role="alert"
          className="rounded-2xl bg-white p-8 text-center"
        >
          <p>
            진단 이력을 불러오지 못했어요.
            잠시 후 다시 확인해주세요.
          </p>

          <button
            type="button"
            onClick={() =>
              void history.refresh()
            }
            className="min-h-[44px] mt-3 font-bold text-secondary"
          >
            다시 불러오기
          </button>
        </div>
      )}

      {history.phase === 'READY' &&
        history.items.length === 0 && (
          <div className="rounded-2xl bg-white p-10 text-center text-on-surface-variant">
            <p>진단 기록이 없습니다.</p>

            <button
              type="button"
              onClick={() =>
                navigate(diagnosisEntryPath)
              }
              className="min-h-[44px] mt-3 font-bold text-secondary"
            >
              진단 시작하기
            </button>
          </div>
        )}

      <ul className="space-y-3">
        {history.items.map((item) => {
          const isExploration =
            item.type === 'EXPLORATION_V1';

          const diagnosisName = isExploration
            ? '전공 탐색'
            : isExplorationEnabled
              ? '이전 방식'
              : '전공';

          const title =
            `${diagnosisName} 진단 #${item.sessionId}`;

          const status =
            !isExploration &&
            item.status === 'in_progress'
              ? {
                  label: '서비스 종료',
                  cls: STATUS.abandoned.cls,
                }
              : STATUS[item.status];

          const action =
            historyActionPath(item);

          const unavailable =
            historyUnavailableMessage(item);

          return (
            <li
              key={item.key}
              className="rounded-2xl bg-white px-5 py-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="font-semibold text-on-surface">
                  {title}
                </p>

                <p className="text-xs text-on-surface-variant mt-1">
                  {new Date(item.occurredAt)
                    .toLocaleDateString('ko-KR')}

                  {isExplorationEnabled && (
                    <span className="ml-2 font-semibold text-secondary">
                      {isExploration
                        ? '탐색형'
                        : '이전 방식'}
                    </span>
                  )}
                </p>

                {unavailable && (
                  <p className="text-xs text-on-surface-variant mt-2">
                    {unavailable}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${status.cls}`}
                >
                  {status.label}
                </span>

                {action && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate(action)
                    }
                    className="min-h-[44px] rounded-lg bg-surface-container px-3 text-xs font-bold"
                  >
                    {item.nextAction === 'RESUME'
                      ? '이어하기'
                      : '결과 보기'}
                  </button>
                )}

                {!isExploration && (
                  <button
                    type="button"
                    aria-label={`진단 삭제 — ${title}`}
                    disabled={deleting}
                    onClick={() => {
                      setToDelete(item.sessionId);
                      setDeleteError(false);
                    }}
                    className="min-h-[44px] min-w-[44px] rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/20"
                  >
                    <span
                      className="material-symbols-outlined"
                      aria-hidden="true"
                    >
                      delete
                    </span>
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {history.moreError && (
        <div
          role="alert"
          className="mt-4 text-sm text-error"
        >
          <p>
            이력을 더 불러오지 못했어요.
            다시 시도하거나 이력을
            새로고침해주세요.
          </p>
        </div>
      )}

      {history.hasMore && (
        <button
          type="button"
          disabled={history.loadingMore}
          onClick={() =>
            void history.loadMore()
          }
          className="mt-5 min-h-[44px] w-full rounded-xl border border-outline-variant px-5 py-3 font-bold text-secondary disabled:opacity-50"
        >
          {history.loadingMore
            ? '불러오는 중…'
            : history.moreError
              ? '더 보기 다시 시도'
              : '이력 더 보기'}
        </button>
      )}

      {toDelete !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-history-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <h3
              id="delete-history-title"
              className="text-lg font-bold mb-3"
            >
              진단 삭제
            </h3>

            <p className="text-sm text-on-surface-variant">
              진단 #{toDelete}의 모든 답변과
              결과가 삭제됩니다.
              복구할 수 없습니다.
            </p>

            {deleteError && (
              <p
                role="alert"
                className="mt-4 text-sm text-error"
              >
                진단을 삭제하지 못했어요.
                다시 시도해주세요.
              </p>
            )}

            <div className="flex gap-3 mt-5">
              <button
                type="button"
                disabled={deleting}
                onClick={() =>
                  setToDelete(null)
                }
                className="min-h-[44px] flex-1 rounded-lg border border-outline-variant font-bold"
              >
                취소
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={() =>
                  void remove()
                }
                className="min-h-[44px] flex-1 rounded-lg bg-error text-white font-bold"
              >
                {deleting
                  ? '삭제 중…'
                  : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default DiagnosisHistoryPanel;