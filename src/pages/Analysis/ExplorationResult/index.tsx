import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../../api/axios';
import { isExplorationMock } from '../../../config/features';
import useExplorationResult from '../../../hooks/useExplorationResult';
import type { ExplorationResult } from '../../../types/exploration';
import MockBanner from '../../Diagnosis/Exploration/components/MockBanner';
import GroupCard from './components/GroupCard';
import CandidateBrowser from './components/CandidateBrowser';
import SharePanel from './components/SharePanel';
import PreparationResponses from './components/PreparationResponses';

const ACTIVITY_LABEL: Record<
  string,
  { text: string; icon: string }
> = {
  INFORMATION: {
    text: '정보 확인',
    icon: 'search',
  },
  SMALL_TASK: {
    text: '작은 활동',
    icon: 'construction',
  },
  REFLECTION_AND_NEXT_STEP: {
    text: '돌아보기·다음 단계',
    icon: 'rate_review',
  },
  INFO_CHECK: {
    text: '정보 확인',
    icon: 'search',
  },
  HANDS_ON: {
    text: '직접 해보기',
    icon: 'construction',
  },
  COMPARE_ASK: {
    text: '비교·질문',
    icon: 'compare_arrows',
  },
};

const DEFAULT_ACTIVITY_LABEL = {
  text: '탐색 활동',
  icon: 'explore',
};

interface ResultActivityCard {
  id: string;
  title: string;
  label: string;
  icon: string;
  duration: string;
  description: string;
  outcome: string;
  outcomeLabel: string;
}

const getText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const toResultActivityCard = (
  raw: unknown,
  index: number,
): ResultActivityCard | null => {
  if (
    typeof raw !== 'object' ||
    raw === null ||
    Array.isArray(raw)
  ) {
    return null;
  }

  const activity = raw as Record<string, unknown>;
  const kind = getText(activity.kind);

  const kindLabel =
    ACTIVITY_LABEL[kind] ?? DEFAULT_ACTIVITY_LABEL;

  const id =
    getText(activity.activity_id) ||
    getText(activity.activityCode) ||
    `activity-${index}`;

  const title =
    getText(activity.title) ||
    '제목이 등록되지 않은 탐색 활동';

  const isBackendActivity =
    'activity_id' in activity ||
    'duration_minutes_proposal' in activity;

  let duration = '';

  if (isBackendActivity) {
    const minutes = activity.duration_minutes_proposal;

    if (
      typeof minutes === 'number' &&
      Number.isFinite(minutes) &&
      minutes > 0
    ) {
      duration = `약 ${minutes}분`;
    }
  } else {
    duration = getText(activity.duration);
  }

  // 수정: 사용자에게 보여줄 description만 사용합니다.
  // selectionReason은 내부 추천 사유 코드이므로 표시하지 않습니다.
  // body_markdown도 결과 요약 카드에서는 출력하지 않습니다.
  const description = getText(activity.description);

  const mockOutcome = getText(activity.outcome);
  const backendOutput = getText(activity.example_output);

  return {
    id,
    title,
    label: kindLabel.text,
    icon: kindLabel.icon,
    duration,
    description,
    outcome: mockOutcome || backendOutput,
    outcomeLabel: mockOutcome
      ? '알게 되는 것'
      : '예상 결과물',
  };
};

const primaryBtn =
  'min-h-[44px] px-6 py-3 rounded-lg bg-primary-container text-white font-bold motion-safe:transition-transform hover:scale-[1.02] active:scale-95';

const secondaryBtn =
  'min-h-[44px] px-6 py-3 rounded-lg border border-outline-variant text-primary-container font-semibold bg-surface-container-lowest';

const formatDate = (iso: string) => {
  const d = new Date(iso);

  return Number.isNaN(d.getTime())
    ? ''
    : `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
};

const Shell = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-surface">
    <div className="max-w-[880px] w-full mx-auto px-4 sm:px-8 pt-8 pb-24">
      {isExplorationMock && <MockBanner />}
      {children}
    </div>
  </div>
);

const StatusPanel = ({
  title,
  body,
  children,
}: {
  title: string;
  body?: string;
  children?: ReactNode;
}) => (
  <div className="bg-surface-container-lowest rounded-brand border border-outline-variant/20 p-6 sm:p-10 text-center cloud-shadow">
    <h1 className="text-xl sm:text-2xl font-bold text-primary-container mb-3">
      {title}
    </h1>

    {body && (
      <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
        {body}
      </p>
    )}

    {children}
  </div>
);

const COMPARE_MAX = 2;

interface CandidateNamesResponse {
  resultId: number;
  items: {
    majorCode: string;
    name: string;
  }[];
}

interface ResultViewProps {
  result: ExplorationResult;
  onExit: () => void;
  onCompare: (majorCodes: string[]) => void;
  onActivities: () => void;
  onAsk: () => void;
  onPlan: () => void;
}

const ResultView = ({
  result,
  onExit,
  onCompare,
  onActivities,
  onAsk,
  onPlan,
}: ResultViewProps) => {
  const noCandidate =
    result.status === 'NO_SUPPORTED_CANDIDATE';

  const caps = result.capabilities;
  const canCompare = caps?.comparisonAvailable ?? true;
  const canPlan = caps?.planAvailable ?? true;
  const canShare = caps?.sharingAvailable ?? true;
  const canActivities =
    result.activityAvailability !== 'UNAVAILABLE';
  const canAsk = caps?.consultationAvailable ?? true;

  const notes = result.notes ?? [];
  const recheckAxes = result.recheckAxes ?? [];

  const nextActivities = useMemo(() => {
    if (!Array.isArray(result.nextActivities)) {
      return [];
    }

    return result.nextActivities
      .map((activity, index) =>
        toResultActivityCard(activity, index),
      )
      .filter(
        (activity): activity is ResultActivityCard =>
          activity !== null,
      );
  }, [result.nextActivities]);

  const majorNames = useMemo(
    () =>
      new Map(
        result.groups
          .flatMap((group) => group.majors)
          .map((major) => [
            major.majorCode,
            major.name,
          ]),
      ),
    [result.groups],
  );

  const presentation = result.presentation;

  const [candidateNames, setCandidateNames] = useState<{
    resultId: number;
    names: Record<string, string>;
  } | null>(null);

  useEffect(() => {
    if (
      isExplorationMock ||
      presentation?.source !== 'USER_REPORTED'
    ) {
      return;
    }

    const reactionCodes = [
      ...(presentation.unexpected ?? []),
      ...(presentation.unfamiliar ?? []),
    ];

    const hasUnknownName = reactionCodes.some(
      (code) => !majorNames.has(code),
    );

    if (!hasUnknownName) return;

    let active = true;

    void api
      .get<CandidateNamesResponse>(
        `/exploration/v1/results/${result.resultId}/candidates`,
      )
      .then(({ data }) => {
        if (
          !active ||
          data.resultId !== result.resultId ||
          !Array.isArray(data.items)
        ) {
          return;
        }

        const names: Record<string, string> = {};

        for (const item of data.items) {
          if (
            typeof item.majorCode === 'string' &&
            typeof item.name === 'string' &&
            item.name.trim().length > 0
          ) {
            names[item.majorCode] = item.name.trim();
          }
        }

        setCandidateNames({
          resultId: result.resultId,
          names,
        });
      })
      .catch(() => {
        // 후보 이름 추가 조회에 실패해도 결과 화면은 유지합니다.
      });

    return () => {
      active = false;
    };
  }, [
    result.resultId,
    majorNames,
    presentation?.source,
    presentation?.unexpected,
    presentation?.unfamiliar,
  ]);

  const getReactionMajorName = (code: string): string => {
    const firstScreenName = majorNames.get(code);

    const fullCandidateName =
      candidateNames?.resultId === result.resultId
        ? candidateNames.names[code]
        : undefined;

    const name = firstScreenName || fullCandidateName;

    return name?.trim() || '다른 후보';
  };

  const [selected, setSelected] = useState<string[]>([]);
  const [compareHint, setCompareHint] = useState(false);

  const toggle = (code: string) => {
    setCompareHint(false);

    setSelected((previous) =>
      previous.includes(code)
        ? previous.filter((item) => item !== code)
        : previous.length >= COMPARE_MAX
          ? previous
          : [...previous, code],
    );
  };

  const startCompare = () => {
    if (selected.length >= 2) {
      onCompare(selected);
    } else {
      setCompareHint(true);

      document
        .getElementById('groups-title')
        ?.parentElement?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
    }
  };

  const compare = {
    selected,
    max: COMPARE_MAX,
    onToggle: toggle,
  };

  return (
    <>
      <header className="mb-8">
        <p className="text-xs text-on-surface-variant mb-2">
          {formatDate(result.createdAt)} 완료한 전공 탐색 진단
          {' · '}
          <Link
            to="/mypage"
            className="font-semibold text-secondary underline underline-offset-2"
          >
            다른 회차는 진단 이력에서 보기
          </Link>
        </p>

        <h1 className="text-2xl sm:text-3xl font-bold text-primary-container leading-snug">
          {noCandidate
            ? '탐색을 시작할 작은 활동부터 해볼까요?'
            : '먼저 탐색해볼 수 있는 전공이에요'}
        </h1>

        {!noCandidate && (
          <p className="text-sm sm:text-base text-on-surface-variant mt-3 leading-relaxed">
            응답에서 나타난 관심·활동·공부 방식을
            바탕으로 골랐어요. 순서는 먼저 살펴보기 좋은
            차례일 뿐, 잘하거나 못하는 정도를 뜻하지 않아요.
          </p>
        )}
      </header>

      {result.displayTextMissing && (
        <p
          role="note"
          className="rounded-brand border border-outline-variant/30 px-5 py-4 mb-8 text-sm text-on-surface-variant"
        >
          일부 전공 설명을 준비 중이에요.
          전공 이름과 후보 묶음을 먼저 확인해주세요.
        </p>
      )}

      {notes.length > 0 && (
        <div
          role="note"
          className="rounded-brand bg-secondary-container/15 px-5 py-4 mb-8 text-sm text-primary-container space-y-1"
        >
          {notes.map((note) => (
            <p key={note}>{note}</p>
          ))}
        </div>
      )}

      {presentation?.source === 'USER_REPORTED' && (
        <section
          aria-labelledby="candidate-reaction-title"
          className="mb-8 rounded-brand border border-outline-variant/30 bg-surface-container-lowest p-5 sm:p-6"
        >
          <h2
            id="candidate-reaction-title"
            className="text-lg font-bold text-primary-container mb-3"
          >
            내가 표시한 후보 반응
          </h2>

          <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
            검사 중에 선택한 반응이에요.
            이 반응은 후보를 보여주는 방식에 활용되며,
            추천 점수나 순위를 변경하지는 않아요.
          </p>

          {(presentation.unexpected?.length ?? 0) === 0 &&
          (presentation.unfamiliar?.length ?? 0) === 0 ? (
            <p className="text-sm text-on-surface-variant">
              별도로 선택한 후보 반응이 없습니다.
            </p>
          ) : (
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-semibold text-secondary mb-1">
                  예상과 달랐던 후보
                </dt>

                <dd className="text-sm text-primary-container leading-relaxed break-words">
                  {presentation.unexpected?.length
                    ? presentation.unexpected
                        .map(getReactionMajorName)
                        .join(' · ')
                    : '선택 없음'}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-semibold text-secondary mb-1">
                  아직 낯설었던 후보
                </dt>

                <dd className="text-sm text-primary-container leading-relaxed break-words">
                  {presentation.unfamiliar?.length
                    ? presentation.unfamiliar
                        .map(getReactionMajorName)
                        .join(' · ')
                    : '선택 없음'}
                </dd>
              </div>
            </dl>
          )}
        </section>
      )}

      {result.groups.length > 0 && (
        <section
          aria-labelledby="groups-title"
          className="mb-10"
        >
          <h2 id="groups-title" className="sr-only">
            탐색 후보 전공군
          </h2>

          {compareHint && (
            <p
              role="status"
              className="rounded-brand bg-secondary-container/15 px-4 py-3 mb-4 text-sm text-secondary"
            >
              비교할 전공을 2개 &quot;비교에 담기&quot;
              해주세요.
            </p>
          )}

          <div className="space-y-4">
            {result.groups.map((group, index) => (
              <GroupCard
                key={group.groupCode}
                group={group}
                index={index}
                compare={compare}
              />
            ))}
          </div>
        </section>
      )}

      {!noCandidate && (
        <CandidateBrowser
          resultId={result.resultId}
          compare={compare}
        />
      )}

      {recheckAxes.length > 0 && (
        <section
          aria-labelledby="recheck-title"
          className="mb-10"
        >
          <h2
            id="recheck-title"
            className="text-lg font-bold text-primary-container mb-2"
          >
            다시 확인해볼 관심 분야
          </h2>

          <p className="text-sm text-on-surface-variant mb-3">
            아래 분야는 응답만으로는 판단할 정보가
            충분하지 않았어요. 관련 활동을 해본 뒤
            다시 확인해보세요.
          </p>

          <ul className="flex flex-wrap gap-2">
            {recheckAxes.map((axis) => (
              <li
                key={axis.metricCode}
                className="rounded-full bg-surface-container-high px-4 py-2 text-sm font-semibold text-primary-container"
              >
                {axis.name}
              </li>
            ))}
          </ul>
        </section>
      )}

      {result.cautions.length > 0 && (
        <section
          aria-labelledby="caution-title"
          className="mb-10"
        >
          <h2
            id="caution-title"
            className="text-lg font-bold text-primary-container mb-3"
          >
            탐색하면서 확인해볼 점
          </h2>

          <ul className="space-y-3">
            {result.cautions.slice(0, 2).map((caution) => (
              <li
                key={`${caution.majorCode ?? ''}:${caution.tagCode}`}
                className="rounded-brand border border-outline-variant/30 bg-surface-container-lowest p-5"
              >
                {caution.majorCode &&
                  majorNames.has(caution.majorCode) && (
                    <p className="text-xs font-bold text-secondary mb-2">
                      {majorNames.get(caution.majorCode)}
                    </p>
                  )}

                <p className="flex items-start gap-2 font-semibold text-primary-container mb-2">
                  <span
                    className="material-symbols-outlined text-[18px] text-secondary mt-0.5"
                    aria-hidden="true"
                  >
                    info
                  </span>
                  {caution.text}
                </p>

                {caution.checkAction ? (
                  <p className="text-sm text-on-surface-variant leading-relaxed pl-7">
                    <span className="font-semibold text-primary-container">
                      이렇게 확인해보세요 ·{' '}
                    </span>
                    {caution.checkAction}
                  </p>
                ) : (
                  caution.answerText && (
                    <p className="text-sm text-on-surface-variant leading-relaxed pl-7">
                      <span className="font-semibold text-primary-container">
                        내가 답한 내용 ·{' '}
                      </span>
                      {caution.answerText}
                    </p>
                  )
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {result.cautionAvailability === 'UNAVAILABLE' &&
        result.cautionUnavailableReason ===
          'APPROVAL_SNAPSHOT_NOT_AVAILABLE' && (
          <p
            role="note"
            className="rounded-brand border border-outline-variant/30 px-5 py-4 mb-8 text-sm text-on-surface-variant"
          >
            이 결과에는 당시 확인된 안내 자료가 없어
            전공별 확인 안내를 제공하지 않아요.
          </p>
        )}

      <PreparationResponses
        responses={result.preparationResponses ?? []}
      />

      {!canActivities && result.activityMessage && (
        <p
          role="note"
          className="rounded-brand bg-surface-container-low px-5 py-4 mb-8 text-sm text-on-surface-variant"
        >
          {result.activityMessage}
        </p>
      )}

      {canActivities && (
        <section
          aria-labelledby="activity-title"
          className="mb-10"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2
              id="activity-title"
              className="text-lg font-bold text-primary-container"
            >
              이번 주에 해볼 수 있는 탐색 활동
            </h2>

            <button
              type="button"
              onClick={onActivities}
              className="min-h-[44px] inline-flex items-center gap-1 text-sm font-semibold text-secondary"
            >
              활동 더 보기·내 상황에 맞게 바꾸기

              <span
                className="material-symbols-outlined text-[18px]"
                aria-hidden="true"
              >
                arrow_forward
              </span>
            </button>
          </div>

          {nextActivities.length === 0 ? (
            <p
              role="status"
              className="rounded-brand bg-surface-container-low px-5 py-5 text-sm text-on-surface-variant"
            >
              지금 표시할 추천 활동이 없습니다.
              활동 더 보기에서 다른 활동을 확인할 수 있어요.
            </p>
          ) : (
            <ol className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {nextActivities.map((activity, index) => (
                <li
                  key={`${activity.id}-${index}`}
                  className="flex flex-col rounded-brand bg-surface-container-lowest border border-outline-variant/20 p-5 cloud-shadow"
                >
                  <p className="inline-flex flex-wrap items-center gap-1 text-xs font-bold text-secondary mb-2">
                    <span
                      className="material-symbols-outlined text-[16px]"
                      aria-hidden="true"
                    >
                      {activity.icon}
                    </span>

                    <span>{activity.label}</span>

                    {activity.duration && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{activity.duration}</span>
                      </>
                    )}
                  </p>

                  <p className="font-bold text-primary-container mb-2">
                    {activity.title}
                  </p>

                  {/* 설명이 없으면 빈 줄도 표시하지 않습니다. */}
                  {activity.description && (
                    <p className="text-sm text-on-surface-variant leading-relaxed mb-3 whitespace-pre-line line-clamp-4">
                      {activity.description}
                    </p>
                  )}

                  {activity.outcome && (
                    <p className="mt-auto text-xs text-on-surface-variant border-t border-outline-variant/20 pt-3">
                      <span className="font-semibold text-primary-container">
                        {activity.outcomeLabel} ·{' '}
                      </span>
                      {activity.outcome}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {canShare && (
        <SharePanel resultId={result.resultId} />
      )}

      <section
        aria-labelledby="next-title"
        className="rounded-brand bg-surface-container-low p-5 sm:p-6 mb-8"
      >
        <h2
          id="next-title"
          className="font-bold text-primary-container mb-3"
        >
          다음으로 할 수 있는 것
        </h2>

        <div className="flex flex-wrap gap-2">
          {!noCandidate && canCompare && (
            <button
              type="button"
              onClick={startCompare}
              className={secondaryBtn}
            >
              후보 전공 비교하기
              {selected.length > 0
                ? ` (${selected.length}개 담음)`
                : ''}
            </button>
          )}

          {canActivities && (
            <button
              type="button"
              onClick={onActivities}
              className={secondaryBtn}
            >
              탐색 활동 보기
            </button>
          )}

          {canAsk && (
            <button
              type="button"
              onClick={onAsk}
              className={secondaryBtn}
            >
              결과에 대해 AI에게 묻기
            </button>
          )}

          {!noCandidate && canPlan && (
            <button
              type="button"
              onClick={onPlan}
              className={secondaryBtn}
            >
              12주 탐색 계획 만들기
            </button>
          )}

          <button
            type="button"
            onClick={onExit}
            className={primaryBtn}
          >
            검사 안내로
          </button>
        </div>
      </section>

      {/* 수정: 사용자용 안내 문구는 유지, 결과 버전만 제거 */}
      <p className="text-xs text-on-surface-variant leading-relaxed">
        이 결과는 능력이나 적성을 판정하거나 합격·취업
        가능성을 예측하지 않아요. 지금의 응답을 바탕으로
        먼저 살펴볼 방향을 제안한 것이며, 탐색하면서
        생각이 바뀌면 다시 검사할 수 있어요. 완료된
        결과는 바뀌지 않고 그대로 보관돼요.
      </p>

      {selected.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant/30 bg-surface-container-lowest/95 backdrop-blur px-4 py-3">
          <div className="max-w-[880px] mx-auto flex flex-wrap items-center justify-between gap-2">
            <p
              className="text-sm text-primary-container"
              aria-live="polite"
            >
              비교에 담은 전공 {selected.length}/{COMPARE_MAX}

              {selected.length < 2 && (
                <span className="text-on-surface-variant">
                  {' · '}1개 더 담으면 비교할 수 있어요
                </span>
              )}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelected([])}
                className="min-h-[44px] px-4 text-sm font-semibold text-on-surface-variant"
              >
                비우기
              </button>

              <button
                type="button"
                onClick={startCompare}
                disabled={selected.length < 2}
                className={`${primaryBtn} disabled:opacity-50 disabled:hover:scale-100`}
              >
                비교하기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const ExplorationResultPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const id = Number(sessionId);
  const { state, retry } = useExplorationResult(id);

  const exit = () =>
    navigate('/diagnosis/exploration');

  if (!Number.isFinite(id)) {
    return (
      <Shell>
        <StatusPanel title="결과 주소가 올바르지 않아요.">
          <button
            type="button"
            className={primaryBtn}
            onClick={exit}
          >
            검사 안내로
          </button>
        </StatusPanel>
      </Shell>
    );
  }

  if (
    state.kind === 'LOADING' ||
    state.kind === 'GENERATING'
  ) {
    return (
      <Shell>
        <StatusPanel
          title={
            state.kind === 'GENERATING'
              ? '결과를 정리하고 있어요'
              : '결과를 불러오는 중이에요'
          }
          body="응답을 바탕으로 먼저 살펴볼 전공과 근거를 정리하고 있어요. 이 화면을 나가도 결과는 저장돼요."
        >
          <div
            role="status"
            aria-live="polite"
            className="flex justify-center"
          >
            <span
              className="material-symbols-outlined text-[32px] text-secondary motion-safe:animate-spin"
              aria-hidden="true"
            >
              progress_activity
            </span>

            <span className="sr-only">
              결과를 기다리는 중
            </span>
          </div>
        </StatusPanel>
      </Shell>
    );
  }

  if (
    state.kind === 'TIMEOUT' ||
    state.kind === 'ERROR'
  ) {
    const notFound =
      state.kind === 'ERROR' &&
      state.code === 'NOT_FOUND';

    const invalidInput =
      state.kind === 'ERROR' &&
      state.code === 'INVALID_INPUT';

    const title = notFound
      ? '결과를 찾을 수 없어요'
      : invalidInput
        ? '결과 요청 정보가 올바르지 않아요'
        : state.kind === 'TIMEOUT'
          ? '결과 정리가 평소보다 오래 걸리고 있어요'
          : '결과를 불러오지 못했어요';

    const body = notFound
      ? '검사를 끝까지 마쳤는지 확인해주세요.'
      : invalidInput
        ? '검사 안내로 돌아가 다시 확인해주세요.'
        : '답변은 저장되어 있어요. 잠시 후 다시 확인해주세요.';

    return (
      <Shell>
        <StatusPanel title={title} body={body}>
          <div
            role="alert"
            className="flex flex-wrap justify-center gap-2"
          >
            {!notFound && !invalidInput && (
              <button
                type="button"
                className={primaryBtn}
                onClick={retry}
              >
                다시 확인하기
              </button>
            )}

            <button
              type="button"
              className={secondaryBtn}
              onClick={exit}
            >
              검사 안내로
            </button>
          </div>
        </StatusPanel>
      </Shell>
    );
  }

  return (
    <Shell>
      <ResultView
        result={state.result}
        onExit={exit}
        onActivities={() =>
          navigate(`/analysis/exploration/${id}/activities`)
        }
        onAsk={() =>
          navigate(`/analysis/exploration/${id}/ask`)
        }
        onPlan={() =>
          navigate(`/analysis/exploration/${id}/plan`)
        }
        onCompare={(codes) =>
          navigate(
            `/analysis/exploration/${id}/compare?majors=${codes
              .map(encodeURIComponent)
              .join(',')}`,
          )
        }
      />
    </Shell>
  );
};

export default ExplorationResultPage;