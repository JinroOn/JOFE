import { useEffect, useState } from 'react';
import api from '../../../../api/axios';
import { isExplorationMock } from '../../../../config/features';
import type {
  EvidenceLevel,
  ExplorationMajorCard,
  ExplorationReason,
} from '../../../../types/exploration';
import EvidenceBadge from './EvidenceBadge';
import MajorDetailDialog from './MajorDetailDialog';
import type { CompareSelection } from './GroupCard';

interface CandidateReason {
  kind: string;
  reasonCode: string;
  text: string;
}

interface CandidateItem {
  majorCode: string;
  name: string;
  groupCode: string;
  isFirstScreen: boolean;
  evidenceLevel: string;
  reasons: CandidateReason[];
  explanation: string | null;
  reasonAvailability: string;
  reasonUnavailableCode: string | null;
  basisGroupId: string | null;
}

interface CandidateGroup {
  groupCode: string;
  name: string | null;
  labelAvailability: string;
  candidateCount: number;
  additionalCount: number;
}

interface BasisGroup {
  id: string;
  kind: string;
  majorCodes: string[];
  message: string;
}

interface CandidateView {
  viewVersion: string;
  basisPolicyVersion: string;
  resultId: number;
  resultVersion: string;
  source: string;
  status: string;
  runMode: string;
  testOnly: boolean;
  totalCount: number;
  firstScreenCount: number;
  additionalCount: number;
  groups: CandidateGroup[];
  items: CandidateItem[];
  basisGroups: BasisGroup[];
}

interface CandidateBrowserProps {
  resultId: number;
  compare: CompareSelection;
}

type FetchState =
  | { resultId: number; kind: 'READY'; data: CandidateView }
  | { resultId: number; kind: 'ERROR' };

const isEvidenceLevel = (value: string): value is EvidenceLevel =>
  value === 'CONFIRMED' ||
  value === 'LOW_EVIDENCE' ||
  value === 'NO_EVIDENCE';

const isReasonKind = (
  value: string,
): value is ExplorationReason['kind'] =>
  value === 'INTEREST' ||
  value === 'ACTIVITY' ||
  value === 'LEARNING';

const toMajorCard = (item: CandidateItem): ExplorationMajorCard => ({
  majorCode: item.majorCode,
  majorId: null,
  name: item.name,
  evidenceLevel: isEvidenceLevel(item.evidenceLevel)
    ? item.evidenceLevel
    : undefined,
  reasons: item.reasons
    .filter((reason) => isReasonKind(reason.kind))
    .map((reason) => ({
      kind: reason.kind as ExplorationReason['kind'],
      reasonCode: reason.reasonCode,
      text: reason.text,
    })),
  collapsed: false,
  explanation: item.explanation ?? undefined,
});

const CandidateBrowser = ({
  resultId,
  compare,
}: CandidateBrowserProps) => {
  const [fetchState, setFetchState] = useState<FetchState | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState<{
    major: ExplorationMajorCard;
    groupName: string;
  } | null>(null);

  useEffect(() => {
    if (isExplorationMock) return;

    let active = true;

    // 쿼리 파라미터를 보내지 않는다.
    void api
      .get<CandidateView>(
        `/exploration/v1/results/${resultId}/candidates`,
      )
      .then(({ data }) => {
        if (active) {
          setFetchState({
            resultId,
            kind: 'READY',
            data,
          });
        }
      })
      .catch(() => {
        if (active) {
          setFetchState({
            resultId,
            kind: 'ERROR',
          });
        }
      });

    return () => {
      active = false;
    };
  }, [resultId, requestVersion]);

  if (isExplorationMock) return null;

  const current =
    fetchState?.resultId === resultId ? fetchState : null;

  if (current?.kind === 'ERROR') {
    return (
      <div
        role="alert"
        className="mb-10 rounded-brand bg-surface-container-low px-5 py-4"
      >
        <p className="text-sm text-on-surface-variant">
          추가 후보 목록을 불러오지 못했어요.
        </p>
        <button
          type="button"
          onClick={() => setRequestVersion((value) => value + 1)}
          className="mt-2 min-h-[44px] text-sm font-bold text-secondary"
        >
          다시 불러오기
        </button>
      </div>
    );
  }

  if (!current || current.kind !== 'READY') return null;

  const view = current.data;
  if (view.additionalCount <= 0) return null;

  const additionalItems = view.items.filter(
    (item) => !item.isFirstScreen,
  );

  const additionalCodes = new Set(
    additionalItems.map((item) => item.majorCode),
  );

  const additionalGroups = view.groups
    .map((group) => ({
      ...group,
      members: additionalItems.filter(
        (item) => item.groupCode === group.groupCode,
      ),
    }))
    .filter((group) => group.members.length > 0);

  const relatedBasisGroups = view.basisGroups.filter(
    (group) =>
      group.majorCodes.some((code) => additionalCodes.has(code)),
  );

  return (
    <section
      className="mb-10"
      aria-labelledby="additional-candidates-title"
    >
      <div className="rounded-brand bg-surface-container-lowest border border-outline-variant/30 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2
              id="additional-candidates-title"
              className="text-lg font-bold text-primary-container"
            >
              더 살펴볼 수 있는 전공
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              첫 화면 {view.firstScreenCount}개 · 추가 후보{' '}
              {view.additionalCount}개 · 전체 {view.totalCount}개
            </p>
          </div>

          <button
            type="button"
            aria-expanded={expanded}
            aria-controls="additional-candidate-list"
            onClick={() => setExpanded((previous) => !previous)}
            className="min-h-[44px] inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-bold text-white"
          >
            <span
              className="material-symbols-outlined text-[20px]"
              aria-hidden="true"
            >
              {expanded ? 'expand_less' : 'expand_more'}
            </span>

            {expanded
              ? '추가 후보 접기'
              : `후보 ${view.additionalCount}개 더 보기`}
          </button>
        </div>

        {expanded && (
          <div id="additional-candidate-list" className="mt-6 space-y-6">
            <p className="text-sm text-on-surface-variant leading-relaxed">
              추가 후보도 검사 결과에 포함된 전공이에요.
              제시 순서는 능력이나 합격 가능성의 순위가 아닙니다.
            </p>

            {additionalGroups.map((group) => {
              const groupName =
                group.name?.trim() || `전공군 ${group.groupCode}`;

              return (
                <section
                  key={group.groupCode}
                  className="rounded-brand bg-surface-container-low p-4 sm:p-5"
                >
                  <h3 className="font-bold text-primary-container mb-2">
                    {groupName}
                  </h3>

                  <p className="text-xs text-on-surface-variant mb-4">
                    이 전공군의 추가 후보 {group.members.length}개
                  </p>

                  <ul className="space-y-3">
                    {group.members.map((item) => {
                      const picked = compare.selected.includes(
                        item.majorCode,
                      );
                      const full =
                        !picked &&
                        compare.selected.length >= compare.max;
                      const major = toMajorCard(item);

                      return (
                        <li
                          key={item.majorCode}
                          className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                            <h4 className="font-bold text-primary-container">
                              {item.name}
                            </h4>

                            {major.evidenceLevel && (
                              <EvidenceBadge
                                level={major.evidenceLevel}
                              />
                            )}
                          </div>

                          {major.reasons.length > 0 ? (
                            <ul className="space-y-2 mb-3">
                              {major.reasons.map((reason) => (
                                <li
                                  key={`${reason.kind}:${reason.reasonCode}`}
                                  className="text-sm text-on-surface-variant leading-relaxed"
                                >
                                  <span className="font-bold text-secondary">
                                    {reason.kind === 'INTEREST'
                                      ? '관심'
                                      : reason.kind === 'ACTIVITY'
                                        ? '활동'
                                        : '학습'}
                                    {' · '}
                                  </span>
                                  {reason.text}
                                </li>
                              ))}
                            </ul>
                          ) : item.reasonAvailability === 'UNAVAILABLE' ? (
                            <p className="mb-3 text-sm text-on-surface-variant">
                              이 후보의 설명 자료는 현재 제공되지 않아요.
                            </p>
                          ) : (
                            item.explanation && (
                              <p className="mb-3 text-sm text-on-surface-variant">
                                {item.explanation}
                              </p>
                            )
                          )}

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setDetail({
                                  major,
                                  groupName,
                                })
                              }
                              className="min-h-[44px] rounded-lg border border-outline-variant/40 px-3 text-sm font-semibold text-primary-container"
                            >
                              자세히 보기
                            </button>

                            <button
                              type="button"
                              aria-pressed={picked}
                              disabled={full}
                              onClick={() =>
                                compare.onToggle(item.majorCode)
                              }
                              className={`min-h-[44px] rounded-lg px-3 text-sm font-semibold disabled:opacity-50 ${
                                picked
                                  ? 'bg-secondary text-white'
                                  : 'bg-surface-container-low text-secondary'
                              }`}
                            >
                              {picked
                                ? '비교에 담음'
                                : full
                                  ? '비교는 최대 2개'
                                  : '비교에 담기'}
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}

            {relatedBasisGroups.length > 0 && (
              <section className="rounded-brand border border-outline-variant/30 p-4">
                <h3 className="font-bold text-primary-container mb-3">
                  추천 근거가 같은 후보 안내
                </h3>

                <div className="space-y-4">
                  {relatedBasisGroups.map((group) => (
                    <div key={group.id}>
                      <p className="text-sm font-semibold text-primary-container">
                        {group.majorCodes
                          .map(
                            (code) =>
                              view.items.find(
                                (item) => item.majorCode === code,
                              )?.name ?? code,
                          )
                          .join(' · ')}
                      </p>

                      <p className="mt-1 text-sm text-on-surface-variant leading-relaxed">
                        {group.message}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {detail && (
        <MajorDetailDialog
          major={detail.major}
          groupName={detail.groupName}
          picked={compare.selected.includes(detail.major.majorCode)}
          compareFull={
            !compare.selected.includes(detail.major.majorCode) &&
            compare.selected.length >= compare.max
          }
          onToggleCompare={() =>
            compare.onToggle(detail.major.majorCode)
          }
          onClose={() => setDetail(null)}
        />
      )}
    </section>
  );
};

export default CandidateBrowser;
