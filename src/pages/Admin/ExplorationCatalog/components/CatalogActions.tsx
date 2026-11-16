import { useState } from 'react';

import {
  reviewExplorationCatalog,
  activateExplorationCatalog,
  archiveExplorationCatalog,
} from '../../../../api/explorationAdmin';

import { toExplorationErrorCode } from '../../../../api/exploration';

import type {
  CatalogAction,
  CatalogSummary,
  CatalogReviewKind,
  CatalogReviewDecision,
  CatalogActivationScope,
} from '../../../../types/explorationAdmin';

const ACTION_LABEL: Record<CatalogAction, string> = {
  REVIEW: '검토 기록',
  ACTIVATE: '사용 시작',
  ARCHIVE: '보관',
};

const ERROR_TEXT: Record<string, string> = {
  STALE_REVISION: '다른 관리자가 먼저 상태를 변경했습니다.',
  CATALOG_SELF_APPROVAL: '승인한 관리자 본인은 활성화할 수 없습니다.',
  CATALOG_APPROVAL_MISSING: '필요한 검토 승인이 완료되지 않았습니다.',
  CATALOG_ACTIVATION_NOT_ALLOWED: '검토 완료된 자료만 활성화할 수 있습니다.',
  CATALOG_IN_USE: '현재 실행 설정에서 사용 중인 자료입니다.',
  CATALOG_ALREADY_ARCHIVED: '이미 보관된 자료입니다.',
  CATALOG_REVIEW_ARCHIVED: '보관된 자료는 검토할 수 없습니다.',
  CATALOG_REVIEW_PREREQUISITE: 'DEV 검토를 먼저 완료해야 합니다.',
  INVALID_INPUT: '요청 내용을 확인해주세요.',
  NOT_FOUND: '대상 카탈로그를 찾을 수 없습니다.',
};

interface CatalogActionsProps {
  catalog: CatalogSummary;
  onChanged: () => void;
}

const CatalogActions = ({
  catalog,
  onChanged,
}: CatalogActionsProps) => {
  const [pending, setPending] = useState<CatalogAction | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [reviewKind, setReviewKind] =
    useState<CatalogReviewKind>('IMPLEMENTATION');

  const [decision, setDecision] =
    useState<CatalogReviewDecision>('APPROVED');

  const [evidenceReference, setEvidenceReference] =
    useState('');

  const [scope, setScope] =
    useState<CatalogActivationScope>('DEV');

  const [reason, setReason] = useState('');

  const startAction = (action: CatalogAction) => {
    setPending(action);
    setError(null);
    setReason('');
    setEvidenceReference('');
    setReviewKind('IMPLEMENTATION');
    setDecision('APPROVED');
    setScope('DEV');
  };

  const cancel = () => {
    if (busy) return;
    setPending(null);
    setError(null);
  };

  const run = async () => {
    if (!pending) return;

    if (pending === 'REVIEW' && !evidenceReference.trim()) {
      setError('검토 근거를 입력해주세요.');
      return;
    }

    if (
      (pending === 'ACTIVATE' || pending === 'ARCHIVE') &&
      !reason.trim()
    ) {
      setError('처리 사유를 입력해주세요.');
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const target = {
        targetType: catalog.targetType,
        targetId: catalog.targetId,
      };

      if (pending === 'REVIEW') {
        await reviewExplorationCatalog({
          ...target,
          reviewKind,
          decision,
          evidenceReference: evidenceReference.trim(),
        });
      }

      if (pending === 'ACTIVATE') {
        await activateExplorationCatalog({
          ...target,
          scope,
          reason: reason.trim(),
        });
      }

      if (pending === 'ARCHIVE') {
        await archiveExplorationCatalog({
          ...target,
          reason: reason.trim(),
        });
      }

      setPending(null);
      onChanged();
    } catch (e: unknown) {
      const code =
        (e as {
          response?: {
            data?: { code?: string };
          };
        })?.response?.data?.code ??
        toExplorationErrorCode(e);

      setError(
        ERROR_TEXT[code] ??
          '상태를 변경하지 못했습니다. 잠시 후 다시 시도해주세요.',
      );
    } finally {
      setBusy(false);
    }
  };

  const allowedActions = catalog.allowedActions ?? [];

  const blockedEntries = Object.entries(
    catalog.blockedReasons ?? {},
  ) as [CatalogAction, string][];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {allowedActions.map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => startAction(action)}
            disabled={busy}
            className="min-h-[40px] px-4 rounded-lg bg-secondary text-white text-sm font-bold hover:bg-secondary/90 disabled:opacity-50"
          >
            {ACTION_LABEL[action]}
          </button>
        ))}
      </div>

      {blockedEntries.length > 0 && (
        <div className="space-y-1">
          {blockedEntries.map(([action, code]) => (
            <p
              key={action}
              className="text-xs text-on-surface-variant"
            >
              {ACTION_LABEL[action]} 불가:{' '}
              {ERROR_TEXT[code] ?? code}
            </p>
          ))}
        </div>
      )}

      {allowedActions.length === 0 &&
        blockedEntries.length === 0 && (
          <p className="text-xs text-on-surface-variant">
            현재 가능한 작업이 없습니다.
          </p>
        )}

      {pending && (
        <div
          role="alertdialog"
          aria-modal="true"
          className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-4 space-y-3"
        >
          <h4 className="font-bold text-primary">
            {ACTION_LABEL[pending]}
          </h4>

          {pending === 'REVIEW' && (
            <>
              <div>
                <label className="block text-sm font-semibold mb-1">
                  검토 종류
                </label>
                <select
                  value={reviewKind}
                  onChange={(e) =>
                    setReviewKind(
                      e.target.value as CatalogReviewKind,
                    )
                  }
                  className="w-full min-h-[40px] rounded-lg border border-outline-variant bg-white px-3 text-sm"
                >
                  <option value="IMPLEMENTATION">구현 검토</option>
                  <option value="DOMAIN">내용 검토</option>
                  <option value="PILOT">시범 운영 검토</option>
                  <option value="RELEASE">공개 출시 검토</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  검토 결정
                </label>
                <select
                  value={decision}
                  onChange={(e) =>
                    setDecision(
                      e.target.value as CatalogReviewDecision,
                    )
                  }
                  className="w-full min-h-[40px] rounded-lg border border-outline-variant bg-white px-3 text-sm"
                >
                  <option value="APPROVED">승인</option>
                  <option value="REJECTED">반려</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  검토 근거
                </label>
                <textarea
                  value={evidenceReference}
                  onChange={(e) =>
                    setEvidenceReference(e.target.value)
                  }
                  maxLength={2000}
                  rows={3}
                  placeholder="검토 문서 URL 또는 근거 자료 식별자를 입력해주세요."
                  className="w-full rounded-lg border border-outline-variant bg-white p-3 text-sm"
                />
              </div>
            </>
          )}

          {pending === 'ACTIVATE' && (
            <>
              <div>
                <label className="block text-sm font-semibold mb-1">
                  활성화 범위
                </label>
                <select
                  value={scope}
                  onChange={(e) =>
                    setScope(
                      e.target.value as CatalogActivationScope,
                    )
                  }
                  className="w-full min-h-[40px] rounded-lg border border-outline-variant bg-white px-3 text-sm"
                >
                  <option value="DEV">DEV - 개발</option>
                  <option value="PILOT">PILOT - 시범 운영</option>
                  <option value="PUBLIC">PUBLIC - 공개</option>
                </select>
                <p className="mt-1 text-xs text-on-surface-variant">
                  선택한 범위에 필요한 모든 검토 승인이 완료되어야 합니다.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  활성화 사유
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={2000}
                  rows={2}
                  placeholder="활성화 사유를 입력해주세요."
                  className="w-full rounded-lg border border-outline-variant bg-white p-3 text-sm"
                />
              </div>
            </>
          )}

          {pending === 'ARCHIVE' && (
            <div>
              <label className="block text-sm font-semibold mb-1">
                보관 사유
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={2000}
                rows={2}
                placeholder="보관 사유를 입력해주세요."
                className="w-full rounded-lg border border-outline-variant bg-white p-3 text-sm"
              />
              <p className="mt-1 text-xs text-on-surface-variant">
                보관된 버전은 다시 활성화할 수 없습니다.
                다른 검토 완료 버전을 활성화해야 합니다.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={
                busy ||
                (pending === 'REVIEW'
                  ? !evidenceReference.trim()
                  : !reason.trim())
              }
              onClick={() => void run()}
              className="min-h-[40px] px-4 rounded-lg bg-secondary text-white text-sm font-bold disabled:opacity-50"
            >
              {busy ? '처리 중...' : '확인'}
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={cancel}
              className="min-h-[40px] px-4 rounded-lg border border-outline-variant text-sm font-semibold"
            >
              취소
            </button>
          </div>

          {error && (
            <p role="alert" className="text-sm text-error">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CatalogActions;
