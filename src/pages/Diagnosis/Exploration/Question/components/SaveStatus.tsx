import type { ExplorationSaveState } from '../../../../../store/useExplorationStore';

interface SaveStatusProps {
  saveState: ExplorationSaveState;
  onRetry: () => void;
  onReload: () => void;
  onExit: () => void;
}

const MESSAGES: Partial<Record<ExplorationSaveState, string>> = {
  SAVE_FAILED: '답변을 저장하지 못했어요. 고른 답은 그대로 남아 있어요.',
  OFFLINE: '인터넷 연결이 끊겼어요. 연결되면 다시 시도해주세요. 고른 답은 그대로 남아 있어요.',
  STALE_REVISION: '다른 기기나 창에서 이 검사가 먼저 바뀌었어요. 최신 상태를 불러온 뒤 답을 다시 골라주세요.',
};

// 저장 상태는 스크린리더가 읽도록 live region에 둔다
const SaveStatus = ({ saveState, onRetry, onReload, onExit }: SaveStatusProps) => {
  const message = MESSAGES[saveState];
  return (
    <div aria-live="polite" className="min-h-[24px]">
      {saveState === 'SAVING' && <p className="text-xs text-on-surface-variant">저장 중…</p>}
      {message && (
        <div role="alert" className="rounded-brand bg-error-container px-4 py-3 text-sm text-on-error-container">
          <p className="mb-3">{message}</p>
          <div className="flex flex-wrap gap-2">
            {saveState === 'STALE_REVISION' ? (
              <button
                type="button"
                onClick={onReload}
                className="min-h-[44px] px-4 rounded-lg bg-primary-container text-white text-sm font-bold"
              >
                최신 상태 불러오기
              </button>
            ) : (
              <button
                type="button"
                onClick={onRetry}
                className="min-h-[44px] px-4 rounded-lg bg-primary-container text-white text-sm font-bold"
              >
                다시 시도
              </button>
            )}
            <button
              type="button"
              onClick={onExit}
              className="min-h-[44px] px-4 rounded-lg border border-outline-variant text-sm font-semibold text-primary-container bg-surface-container-lowest"
            >
              나가기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaveStatus;
