import { useState } from 'react';
import { activateExplorationCatalog, reviewExplorationCatalog } from '../../../../api/explorationAdmin';
import { toExplorationErrorCode } from '../../../../api/exploration';
import type { CatalogAction, CatalogSummary } from '../../../../types/explorationAdmin';

const CONFIRM: Record<CatalogAction, { title: string; body: string; button: string }> = {
  REVIEW: {
    title: '검토 완료로 표시할까요?',
    body: '내용을 확인했다는 기록으로 검토자에 내 이름이 남아요. 아직 사용자에게는 적용되지 않아요.',
    button: '검토 완료',
  },
  ACTIVATE: {
    title: '이 버전을 사용할까요?',
    body: '새로 시작하는 검사부터 이 버전이 적용돼요. 진행 중이거나 완료된 회차는 시작할 때의 버전을 그대로 써요. 지금 사용 중인 같은 종류의 버전은 보관으로 바뀌어요.',
    button: '사용 시작',
  },
  ROLLBACK: {
    title: '이 버전으로 되돌릴까요?',
    body: '예전에 사용했던 이 버전을 새 검사의 기본으로 다시 사용해요. 진행 중이거나 완료된 회차는 바뀌지 않아요.',
    button: '되돌리기',
  },
};

const ERROR_TEXT: Record<string, string> = {
  STALE_REVISION: '다른 관리자가 먼저 상태를 바꿨어요. 목록을 새로 불러와 주세요.',
  SELF_REVIEW: '직접 작성한 카탈로그는 다른 관리자가 검토해야 해요.',
};

interface CatalogActionsProps {
  catalog: CatalogSummary;
  onChanged: (updated: CatalogSummary) => void;
}

// 서버가 허용한 동작만 버튼으로 보여주고, 실행 전에 영향을 안내한다
const CatalogActions = ({ catalog, onChanged }: CatalogActionsProps) => {
  const [pending, setPending] = useState<CatalogAction | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: CatalogAction) => {
    setBusy(true);
    setError(null);
    try {
      const updated =
        action === 'REVIEW'
          ? await reviewExplorationCatalog(catalog.catalogId, catalog.status)
          : await activateExplorationCatalog(catalog.catalogId, catalog.status);
      setPending(null);
      onChanged(updated);
    } catch (e) {
      const code = (e as { response?: { data?: { code?: string } } })?.response?.data?.code ?? toExplorationErrorCode(e);
      setError(ERROR_TEXT[code] ?? '상태를 바꾸지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setBusy(false);
    }
  };

  if (catalog.allowedActions.length === 0) {
    return catalog.blockedReason ? <p className="text-xs text-on-surface-variant">{catalog.blockedReason}</p> : null;
  }

  return (
    <div className="space-y-2">
      {!pending && (
        <div className="flex flex-wrap gap-2">
          {catalog.allowedActions.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setPending(a)}
              className="min-h-[40px] px-4 rounded-lg bg-secondary text-white text-sm font-bold hover:bg-secondary/90"
            >
              {CONFIRM[a].button}
            </button>
          ))}
        </div>
      )}
      {pending && (
        <div role="alertdialog" aria-labelledby={`confirm-${catalog.catalogId}`} className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-4 text-left">
          <p id={`confirm-${catalog.catalogId}`} className="font-bold text-primary mb-1">{CONFIRM[pending].title}</p>
          <p className="text-sm text-on-surface-variant mb-3">{CONFIRM[pending].body}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void run(pending)}
              className="min-h-[40px] px-4 rounded-lg bg-secondary text-white text-sm font-bold disabled:opacity-50"
            >
              {busy ? '처리 중…' : CONFIRM[pending].button}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setPending(null)}
              className="min-h-[40px] px-4 rounded-lg border border-outline-variant text-sm font-semibold text-primary"
            >
              취소
            </button>
          </div>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-error">{error}</p>}
    </div>
  );
};

export default CatalogActions;
