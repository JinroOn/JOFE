import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getExplorationActivities,
  toExplorationErrorCode,
} from '../../../api/exploration';
import { isExplorationMock } from '../../../config/features';
import useExplorationResult from '../../../hooks/useExplorationResult';
import type {
  ExplorationActivities as MockActivities,
  ExplorationErrorCode,
} from '../../../types/exploration';
import MockBanner from '../../Diagnosis/Exploration/components/MockBanner';
import ActivityCard from './components/ActivityCard';
import SupportPanel from './components/SupportPanel';

interface ApprovedActivitySource {
  source_id: string;
  title: string;
  publisher: string;
  url: string;
}

interface ApprovedActivity {
  activity_id: string;
  version: string;
  major_code: string | null;
  title: string;
  kind: string;
  body_markdown: string;
  steps: string[];
  artifacts: string[];
  example_output: string;
  worksheet_markdown: string;
  alternative: string;
  duration_minutes_proposal: number | null;
  requirements: unknown;
  sources: ApprovedActivitySource[];
  selectionReason?: string;
  preferenceApplied?: boolean;
}

interface BackendActivities {
  resultId: number;
  supportRevision: number | null;
  targetMajorCode?: string | null;
  activityAvailability: 'AVAILABLE' | 'UNAVAILABLE';
  activityMessage: string;
  reasonCode?: string;
  nextActivities: ApprovedActivity[];
}

type ActivitiesState =
  | {
      resultId: number;
      kind: 'MOCK';
      value: MockActivities;
    }
  | {
      resultId: number;
      kind: 'BACKEND';
      value: BackendActivities;
    };

const ACTIVITY_KIND_LABEL: Record<string, string> = {
  INFORMATION: '정보 확인',
  SMALL_TASK: '작은 활동',
  REFLECTION_AND_NEXT_STEP: '돌아보기·다음 단계',
};

// 알 수 없는 데이터 형식일 때 빈 화면이나 런타임 오류 대신
// 명시적인 불러오기 실패 상태를 표시합니다.
const isRecord = (
  value: unknown,
): value is Record<string, unknown> =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value);

const isMockActivities = (
  value: unknown,
): value is MockActivities =>
  isRecord(value) &&
  Array.isArray(value.base) &&
  Array.isArray(value.groups) &&
  typeof value.personalized === 'boolean';

const isBackendActivities = (
  value: unknown,
): value is BackendActivities => {
  if (!isRecord(value)) return false;

  const availability = value.activityAvailability;

  if (
    availability !== 'AVAILABLE' &&
    availability !== 'UNAVAILABLE'
  ) {
    return false;
  }

  // 백엔드는 승인 여부와 관계없이 nextActivities를 배열로 반환합니다.
  return Array.isArray(value.nextActivities);
};

const Shell = ({
  children,
}: {
  children: ReactNode;
}) => (
  <div className="min-h-screen bg-surface">
    <div className="max-w-[1040px] w-full mx-auto px-4 sm:px-8 pt-8 pb-24">
      {isExplorationMock && <MockBanner />}
      {children}
    </div>
  </div>
);

// 서버에서 승인된 활동의 상세 정보를 표시합니다.
// 활동 내용을 임의로 만들어내지 않고 API 응답만 사용합니다.
const ApprovedActivityCard = ({
  activity,
}: {
  activity: ApprovedActivity;
}) => {
  const kindLabel =
    ACTIVITY_KIND_LABEL[activity.kind] ?? '탐색 활동';

  const steps = Array.isArray(activity.steps)
    ? activity.steps.filter(
        (step): step is string =>
          typeof step === 'string' && step.trim().length > 0,
      )
    : [];

  const artifacts = Array.isArray(activity.artifacts)
    ? activity.artifacts.filter(
        (artifact): artifact is string =>
          typeof artifact === 'string' &&
          artifact.trim().length > 0,
      )
    : [];

  const sources = Array.isArray(activity.sources)
    ? activity.sources.filter(
        (source) =>
          source &&
          typeof source.url === 'string' &&
          /^https?:\/\//i.test(source.url),
      )
    : [];

  return (
    <article className="h-full rounded-brand bg-surface-container-lowest border border-outline-variant/20 p-5 sm:p-6 cloud-shadow">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="rounded-full bg-secondary-container/20 px-3 py-1 text-xs font-bold text-secondary">
          {kindLabel}
        </span>

        {typeof activity.duration_minutes_proposal === 'number' &&
          activity.duration_minutes_proposal > 0 && (
            <span className="text-xs text-on-surface-variant">
              약 {activity.duration_minutes_proposal}분
            </span>
          )}
      </div>

      <h3 className="text-lg font-bold text-primary-container mb-3">
        {activity.title}
      </h3>

      {activity.body_markdown && (
        <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap mb-5">
          {activity.body_markdown}
        </p>
      )}

      {steps.length > 0 && (
        <section className="mb-5">
          <h4 className="text-sm font-bold text-primary-container mb-2">
            진행 방법
          </h4>

          <ol className="list-decimal list-inside space-y-2">
            {steps.map((step, index) => (
              <li
                key={`${activity.activity_id}-step-${index}`}
                className="text-sm text-on-surface-variant leading-relaxed"
              >
                {step}
              </li>
            ))}
          </ol>
        </section>
      )}

      {artifacts.length > 0 && (
        <section className="mb-5">
          <h4 className="text-sm font-bold text-primary-container mb-2">
            만들어볼 결과물
          </h4>

          <ul className="list-disc list-inside space-y-1">
            {artifacts.map((artifact, index) => (
              <li
                key={`${activity.activity_id}-artifact-${index}`}
                className="text-sm text-on-surface-variant leading-relaxed"
              >
                {artifact}
              </li>
            ))}
          </ul>
        </section>
      )}

      {activity.example_output && (
        <div className="rounded-lg bg-surface-container-low p-4 mb-4">
          <p className="text-xs font-bold text-primary-container mb-1">
            결과물 예시
          </p>

          <p className="text-sm text-on-surface-variant whitespace-pre-wrap leading-relaxed">
            {activity.example_output}
          </p>
        </div>
      )}

      {activity.alternative && (
        <div className="mb-4">
          <p className="text-xs font-bold text-primary-container mb-1">
            다른 방법으로 해보기
          </p>

          <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">
            {activity.alternative}
          </p>
        </div>
      )}

      {activity.worksheet_markdown && (
        <details className="mb-4 rounded-lg border border-outline-variant/30">
          <summary className="min-h-[44px] flex items-center cursor-pointer px-4 py-3 text-sm font-bold text-primary-container">
            활동 기록 양식 보기
          </summary>

          <div className="px-4 pb-4 text-sm text-on-surface-variant whitespace-pre-wrap leading-relaxed">
            {activity.worksheet_markdown}
          </div>
        </details>
      )}

      {sources.length > 0 && (
        <div className="border-t border-outline-variant/20 pt-4">
          <p className="text-xs font-bold text-primary-container mb-2">
            참고 자료
          </p>

          <ul className="space-y-2">
            {sources.map((source) => (
              <li key={source.source_id}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-secondary underline underline-offset-2 break-words"
                >
                  {source.title || source.publisher}
                </a>

                {source.publisher && (
                  <span className="ml-2 text-xs text-on-surface-variant">
                    {source.publisher}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
};

const ExplorationActivities = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const id = Number(sessionId);

  const {
    state: resultState,
    retry: retryResult,
  } = useExplorationResult(id);

  const resultId =
    resultState.kind === 'READY'
      ? resultState.result.resultId
      : null;

  const [data, setData] = useState<ActivitiesState | null>(
    null,
  );

  const [error, setError] =
    useState<ExplorationErrorCode | null>(null);

  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (resultId === null) return;

    let alive = true;

    // 결과 회차 또는 맞춤 질문 답변이 변경되면 다시 읽습니다.
    // 이전 회차의 데이터를 새 회차에 표시하지 않습니다.
    void getExplorationActivities(resultId)
      .then((response: unknown) => {
        if (!alive) return;

        if (isExplorationMock) {
          if (!isMockActivities(response)) {
            setData(null);
            setError('UNKNOWN');
            return;
          }

          setData({
            resultId,
            kind: 'MOCK',
            value: response,
          });

          setError(null);
          return;
        }

        // 실제 JOBE 응답의 activityAvailability와
        // nextActivities 필드를 기준으로 처리합니다.
        if (!isBackendActivities(response)) {
          setData(null);
          setError('UNKNOWN');
          return;
        }

        setData({
          resultId,
          kind: 'BACKEND',
          value: response,
        });

        setError(null);
      })
      .catch((caught) => {
        if (!alive) return;

        setData(null);
        setError(toExplorationErrorCode(caught));
      });

    return () => {
      alive = false;
    };
  }, [resultId, version]);

  const backToResult = () =>
    navigate(`/analysis/exploration/${id}`);

  const current =
    data?.resultId === resultId
      ? data
      : null;

  const failed =
    resultState.kind === 'ERROR' ||
    resultState.kind === 'TIMEOUT' ||
    error !== null;

  const retry = () => {
    setError(null);
    setData(null);

    if (resultState.kind !== 'READY') {
      retryResult();
    }

    setVersion((previous) => previous + 1);
  };

  return (
    <Shell>
      <header className="mb-8">
        <button
          type="button"
          onClick={backToResult}
          className="min-h-[44px] inline-flex items-center gap-1 text-sm font-semibold text-secondary mb-2"
        >
          <span
            className="material-symbols-outlined text-[18px]"
            aria-hidden="true"
          >
            arrow_back
          </span>

          결과로 돌아가기
        </button>

        <h1 className="text-2xl sm:text-3xl font-bold text-primary-container">
          탐색 활동
        </h1>

        <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
          후보 전공을 직접 알아보는 작은 활동이에요.
          해보면서 생각이 바뀌어도 괜찮아요.
        </p>
      </header>

      {failed && (
        <div
          role="alert"
          className="rounded-brand bg-error-container px-5 py-4 text-sm text-on-error-container mb-8"
        >
          <p className="mb-3">
            활동을 불러오지 못했어요.
            잠시 후 다시 시도해주세요.
          </p>

          <button
            type="button"
            className="min-h-[44px] px-4 rounded-lg bg-primary-container text-white text-sm font-bold"
            onClick={retry}
          >
            다시 시도
          </button>
        </div>
      )}

      {!failed && !current && (
        <p
          role="status"
          className="text-sm text-on-surface-variant"
        >
          활동을 불러오는 중이에요…
        </p>
      )}

      {/* 실제 백엔드가 활동을 제공할 수 없는 상태 */}
      {!failed &&
        current?.kind === 'BACKEND' &&
        current.value.activityAvailability ===
          'UNAVAILABLE' && (
          <section
            role="status"
            className="rounded-brand bg-surface-container-lowest border border-outline-variant/30 p-8 sm:p-12 text-center"
          >
            <span
              className="material-symbols-outlined text-4xl text-secondary mb-4"
              aria-hidden="true"
            >
              info
            </span>

            <h2 className="text-lg sm:text-xl font-bold text-primary-container mb-3">
              {current.value.activityMessage?.trim() ||
                '승인된 탐색 활동 안내를 준비 중입니다.'}
            </h2>

            <p className="text-sm text-on-surface-variant leading-relaxed">
              활동 안내가 준비되면 이 화면에서 확인할 수 있어요.
              진단 결과와 추천 전공은 그대로 보관됩니다.
            </p>

            <button
              type="button"
              onClick={backToResult}
              className="mt-6 min-h-[44px] rounded-lg bg-primary-container px-6 py-3 text-sm font-bold text-white"
            >
              진단 결과로 돌아가기
            </button>
          </section>
        )}

      {/* 실제 백엔드에서 승인된 활동을 제공하는 경우 */}
      {!failed &&
        current?.kind === 'BACKEND' &&
        current.value.activityAvailability ===
          'AVAILABLE' && (
          <>
            <section
              aria-labelledby="approved-activity-title"
              className="mb-8"
            >
              <h2
                id="approved-activity-title"
                className="text-lg font-bold text-primary-container mb-2"
              >
                이번에 해볼 수 있는 탐색 활동
              </h2>

              {current.value.activityMessage && (
                <p className="text-sm text-on-surface-variant mb-5 leading-relaxed">
                  {current.value.activityMessage}
                </p>
              )}

              {current.value.nextActivities.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {current.value.nextActivities.map(
                    (activity) => (
                      <ApprovedActivityCard
                        key={activity.activity_id}
                        activity={activity}
                      />
                    ),
                  )}
                </div>
              ) : (
                <p
                  role="status"
                  className="rounded-brand bg-surface-container-low px-5 py-5 text-sm text-on-surface-variant"
                >
                  현재 표시할 탐색 활동이 없습니다.
                  나중에 다시 확인해주세요.
                </p>
              )}
            </section>

            {current.value.nextActivities.length > 0 &&
              resultId !== null && (
                <div className="mb-10">
                  <SupportPanel
                    key={resultId}
                    resultId={resultId}
                    personalized={current.value.nextActivities.some((activity) => activity.preferenceApplied)}
                    onChanged={() =>
                      setVersion((previous) => previous + 1)
                    }
                  />
                </div>
              )}
          </>
        )}

      {/* 기존 MOCK 형식은 별도 분기로 그대로 유지 */}
      {!failed && current?.kind === 'MOCK' && (
        <>
          <section
            aria-labelledby="base-title"
            className="mb-8"
          >
            <h2
              id="base-title"
              className="text-lg font-bold text-primary-container mb-1"
            >
              이번 주에 해볼 수 있는 활동
            </h2>

            <p
              className="text-sm text-on-surface-variant mb-4"
              aria-live="polite"
            >
              {current.value.personalizationNote ??
                '짧은 정보 확인, 직접 해보기, 비교·질문을 하나씩 골랐어요.'}
            </p>

            <ol className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {current.value.base.map((activity) => (
                <li key={activity.activityCode}>
                  <ActivityCard activity={activity} />
                </li>
              ))}
            </ol>
          </section>

          {resultId !== null && (
            <div className="mb-10">
              <SupportPanel
                resultId={resultId}
                personalized={current.value.personalized}
                onChanged={() =>
                  setVersion((previous) => previous + 1)
                }
              />
            </div>
          )}

          {current.value.groups.length > 0 && (
            <section aria-labelledby="group-title">
              <h2
                id="group-title"
                className="text-lg font-bold text-primary-container mb-1"
              >
                전공군·전공별로 더 해볼 수 있는 활동
              </h2>

              <p className="text-sm text-on-surface-variant mb-4">
                관심 가는 전공군을 펼쳐서 골라보세요.
              </p>

              <div className="space-y-3">
                {current.value.groups.map((group, index) => (
                  <details
                    key={group.groupCode}
                    open={index === 0}
                    className="group rounded-brand bg-surface-container-low"
                  >
                    <summary className="min-h-[44px] cursor-pointer list-none flex items-center justify-between gap-2 px-5 py-4 font-bold text-primary-container">
                      {group.groupName}

                      <span
                        className="material-symbols-outlined text-[20px] group-open:rotate-180 motion-safe:transition-transform"
                        aria-hidden="true"
                      >
                        expand_more
                      </span>
                    </summary>

                    <div className="px-5 pb-5">
                      <h3 className="text-sm font-semibold text-on-surface-variant mb-2">
                        전공군 공통 활동
                      </h3>

                      <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                        {group.common.map((activity) => (
                          <li key={activity.activityCode}>
                            <ActivityCard
                              activity={activity}
                              compact
                            />
                          </li>
                        ))}
                      </ul>

                      <h3 className="text-sm font-semibold text-on-surface-variant mb-2">
                        전공별 활동
                      </h3>

                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {group.majors.map((major) => (
                          <li key={major.majorCode}>
                            <p className="text-xs font-bold text-secondary mb-1">
                              {major.name}
                            </p>

                            <ActivityCard
                              activity={major.activity}
                              compact
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </Shell>
  );
};

export default ExplorationActivities;
