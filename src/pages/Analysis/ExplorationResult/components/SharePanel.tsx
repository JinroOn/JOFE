import { useEffect, useState } from 'react';
import { createExplorationShare, disableExplorationShare, getExplorationShare } from '../../../../api/exploration';
import type { ExplorationShareState } from '../../../../types/exploration';

const formatDate = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
};

const shareUrl = (token: string) => `${window.location.origin}/exploration/share/${encodeURIComponent(token)}`;

const btn = 'min-h-[44px] px-4 rounded-lg text-sm font-bold disabled:opacity-50';

// D-28: 기본 꺼짐, 30일 만료, 즉시 끄기 / D-29: 공개·비공개 정보 안내
const SharePanel = ({ resultId }: { resultId: number }) => {
  const [share, setShare] = useState<ExplorationShareState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOff, setConfirmOff] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    getExplorationShare(resultId)
      .then((res) => alive && setShare(res))
      .catch(() => alive && setError('공유 상태를 불러오지 못했어요.'));
    return () => {
      alive = false;
    };
  }, [resultId]);

  const run = async (fn: () => Promise<ExplorationShareState>, failMessage: string) => {
    setBusy(true);
    setError(null);
    try {
      setShare(await fn());
      setConfirmOff(false);
      setCopied(false);
    } catch {
      setError(failMessage);
    } finally {
      setBusy(false);
    }
  };

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setError('복사하지 못했어요. 링크를 길게 눌러 직접 복사해주세요.');
    }
  };

  const active = share?.status === 'ACTIVE' && share.token;

  return (
    <section aria-labelledby="share-title" className="rounded-brand border border-outline-variant/30 bg-surface-container-lowest p-5 sm:p-6 mb-8">
      <h2 id="share-title" className="font-bold text-primary-container mb-1">결과 공유</h2>
      <p className="text-sm text-on-surface-variant mb-4">
        {active ? '링크를 가진 사람은 로그인 없이 아래 공개 정보를 볼 수 있어요.' : '공유는 꺼져 있어요. 링크를 만들어야만 다른 사람이 볼 수 있어요.'}
      </p>

      {!active && (
        <details className="mb-4 text-sm">
          <summary className="cursor-pointer min-h-[44px] flex items-center font-semibold text-secondary">공유하면 무엇이 보이나요?</summary>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            <div className="rounded-lg bg-surface-container-low p-4">
              <p className="font-semibold text-primary-container mb-1">보이는 것</p>
              <ul className="list-disc pl-4 text-on-surface-variant space-y-0.5">
                <li>공개 닉네임</li>
                <li>탐색 전공군과 대표 전공</li>
                <li>짧게 줄인 추천 근거</li>
                <li>탐색 활동 제안</li>
                <li>정보 부족 등 안내 문구</li>
              </ul>
            </div>
            <div className="rounded-lg bg-surface-container-low p-4">
              <p className="font-semibold text-primary-container mb-1">보이지 않는 것</p>
              <ul className="list-disc pl-4 text-on-surface-variant space-y-0.5">
                <li>이메일·실명·연락처</li>
                <li>검사 답변 원문과 내부 점수</li>
                <li>과목 자신감·부담에 대한 답</li>
                <li>AI 상담 기록, 계획 진행 상황</li>
              </ul>
            </div>
          </div>
        </details>
      )}

      {(share?.status === 'EXPIRED' || share?.status === 'DISABLED') && (
        <p className="mb-3 text-xs text-on-surface-variant">
          {share.status === 'EXPIRED' ? `이전 링크는 ${formatDate(share.expiresAt)}에 만료됐어요.` : '이전 링크는 꺼져 있어요.'} 다시
          공유하려면 새 링크를 만들어야 해요.
        </p>
      )}

      {active && share.token && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="share-url" className="sr-only">공유 링크</label>
            <input
              id="share-url"
              readOnly
              value={shareUrl(share.token)}
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 rounded-lg bg-surface-container-low px-3 py-2.5 text-sm text-primary-container"
            />
            <button type="button" onClick={() => void copy(shareUrl(share.token!))} className={`${btn} bg-primary-container text-white`}>
              {copied ? '복사했어요' : '링크 복사'}
            </button>
          </div>
          <p className="text-xs text-on-surface-variant" aria-live="polite">
            {formatDate(share.expiresAt)}까지 열려요 (만든 날부터 30일). 만료되면 자동으로 닫혀요.
          </p>
          {!confirmOff ? (
            <button type="button" onClick={() => setConfirmOff(true)} className={`${btn} border border-outline-variant text-primary-container`}>
              공유 끄기
            </button>
          ) : (
            <div role="alertdialog" aria-labelledby="share-off-msg" className="rounded-lg bg-surface-container-low p-4">
              <p id="share-off-msg" className="text-sm text-primary-container mb-3">
                끄면 지금 링크로는 다시 볼 수 없어요. 다시 공유하려면 새 링크를 만들어야 해요.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void run(() => disableExplorationShare(resultId), '공유를 끄지 못했어요. 다시 시도해주세요.')}
                  className={`${btn} bg-error text-on-error`}
                >
                  지금 끄기
                </button>
                <button type="button" onClick={() => setConfirmOff(false)} className={`${btn} border border-outline-variant text-primary-container`}>
                  취소
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {share && !active && (
        <button
          type="button"
          disabled={busy}
          onClick={() => void run(() => createExplorationShare(resultId), '링크를 만들지 못했어요. 다시 시도해주세요.')}
          className={`${btn} bg-primary-container text-white`}
        >
          {busy ? '만드는 중…' : share.status === 'NONE' ? '공유 링크 만들기' : '새 링크 만들기'}
        </button>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-error">{error}</p>
      )}
    </section>
  );
};

export default SharePanel;
