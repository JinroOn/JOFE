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

  return Array.isArray(value.nextActivities);
};

// -------------------------
// worksheet_markdown 렌더링
// -------------------------

const renderWorksheetInline = (value: string): ReactNode[] =>
  value
    .split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
    .filter(Boolean)
    .map((part, index) => {
      if (
        part.startsWith('**') &&
        part.endsWith('**')
      ) {
        return (
          <strong
            key={index}
            className="font-bold text-primary-container"
          >
            {part.slice(2, -2)}
          </strong>
        );
      }

      if (
        part.startsWith('`') &&
        part.endsWith('`')
      ) {
        return (
          <code
            key={index}
            className="rounded bg-surface-container px-1 py-0.5 text-xs"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      return part;
    });

const parseTableRow = (line: string): string[] =>
  line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());

const isTableDivider = (
  line: string,
  columnCount: number,
): boolean => {
  if (!line.includes('|')) return false;

  const cells = parseTableRow(line);

  return (
    cells.length === columnCount &&
    cells.every((cell) => /^:?-{3,}:?$/.test(cell))
  );
};

const WorksheetMarkdown = ({
  markdown,
}: {
  markdown: string;
}) => {
  const lines = markdown
    .replace(/\r\n?/g, '\n')
    .split('\n');

  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();

    if (!line) {
      index += 1;
      continue;
    }

    const headers = parseTableRow(line);

    if (
      line.includes('|') &&
      headers.length >= 2 &&
      index + 1 < lines.length &&
      isTableDivider(lines[index + 1], headers.length)
    ) {
      const key = index;
      const rows: string[][] = [];

      index += 2;

      while (
        index < lines.length &&
        lines[index].trim() &&
        lines[index].includes('|')
      ) {
        const values = parseTableRow(lines[index]);

        rows.push(
          headers.map(
            (_, columnIndex) =>
              values[columnIndex] ?? '',
          ),
        );

        index += 1;
      }

      blocks.push(
        <div key={`table-${key}`} className="min-w-0 max-w-full">
          <div
            role="region"
            aria-label="활동 기록 표"
            tabIndex={0}
            className="w-full min-w-0 max-w-full overflow-x-auto rounded-lg border border-outline-variant/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-secondary"
          >
            <table className="w-full min-w-[520px] border-collapse text-left text-sm">
              <thead className="bg-surface-container-low">
                <tr>
                  {headers.map((header, columnIndex) => (
                    <th
                      key={columnIndex}
                      scope="col"
                      className="min-w-[120px] border-b border-r last:border-r-0 border-outline-variant/30 px-3 py-3 align-top font-bold text-primary-container whitespace-normal break-words"
                    >
                      {renderWorksheetInline(header)}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="even:bg-surface-container-low/50"
                  >
                    {row.map((cell, columnIndex) => (
                      <td
                        key={columnIndex}
                        className="min-w-[120px] border-b border-r last:border-r-0 border-outline-variant/20 px-3 py-3 align-top whitespace-normal break-words"
                      >
                        {renderWorksheetInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-1 text-xs text-on-surface-variant sm:hidden">
            표가 넓으면 좌우로 스크롤해서 확인할 수 있습니다.
          </p>
        </div>,
      );

      continue;
    }

    const heading = line.match(
      /^#{1,6}\s+(.+?)\s*$/,
    );

    if (heading) {
      const key = index;
      const level = line.match(/^#+/)?.[0].length ?? 2;
      const title = heading[1].replace(/\s+#+$/, '');

      if (level === 1) {
        blocks.push(
          <h3
            key={`heading-${key}`}
            className="text-lg font-bold text-primary-container"
          >
            {renderWorksheetInline(title)}
          </h3>,
        );
      } else if (level === 2) {
        blocks.push(
          <h4
            key={`heading-${key}`}
            className="text-base font-bold text-primary-container"
          >
            {renderWorksheetInline(title)}
          </h4>,
        );
      } else {
        blocks.push(
          <h5
            key={`heading-${key}`}
            className="text-sm font-bold text-primary-container"
          >
            {renderWorksheetInline(title)}
          </h5>,
        );
      }

      index += 1;
      continue;
    }

    if (/^[-*+]\s+/.test(line)) {
      const key = index;
      const items: string[] = [];

      while (
        index < lines.length &&
        /^[-*+]\s+/.test(lines[index].trim())
      ) {
        items.push(
          lines[index]
            .trim()
            .replace(/^[-*+]\s+/, ''),
        );
        index += 1;
      }

      blocks.push(
        <ul
          key={`list-${key}`}
          className="list-disc space-y-1 pl-5"
        >
          {items.map((item, itemIndex) => (
            <li key={itemIndex} className="leading-relaxed">
              {renderWorksheetInline(item)}
            </li>
          ))}
        </ul>,
      );

      continue;
    }

    if (/^\d+[.)]\s+/.test(line)) {
      const key = index;
      const items: string[] = [];

      while (
        index < lines.length &&
        /^\d+[.)]\s+/.test(lines[index].trim())
      ) {
        items.push(
          lines[index]
            .trim()
            .replace(/^\d+[.)]\s+/, ''),
        );

        index += 1;
      }

      blocks.push(
        <ol
          key={`ordered-${key}`}
          className="list-decimal space-y-1 pl-5"
        >
          {items.map((item, itemIndex) => (
            <li key={itemIndex} className="leading-relaxed">
              {renderWorksheetInline(item)}
            </li>
          ))}
        </ol>,
      );

      continue;
    }

    const paragraphKey = index;
    const paragraphLines: string[] = [];

    while (
      index < lines.length &&
      lines[index].trim()
    ) {
      const current = lines[index].trim();
      const next = lines[index + 1] ?? '';

      if (
        paragraphLines.length > 0 &&
        (
          /^#{1,6}\s+/.test(current) ||
          /^[-*+]\s+/.test(current) ||
          /^\d+[.)]\s+/.test(current) ||
          (
            current.includes('|') &&
            isTableDivider(
              next,
              parseTableRow(current).length,
            )
          )
        )
      ) {
        break;
      }

      paragraphLines.push(current);
      index += 1;
    }

    blocks.push(
      <p
        key={`paragraph-${paragraphKey}`}
        className="leading-relaxed whitespace-pre-line break-words"
      >
        {renderWorksheetInline(
          paragraphLines.join('\n'),
        )}
      </p>,
    );
  }

  return (
    <div className="min-w-0 max-w-full space-y-4 text-sm text-on-surface-variant">
      {blocks}
    </div>
  );
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
          typeof step === 'string' &&
          step.trim().length > 0,
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
    <article className="min-w-0 h-full rounded-brand bg-surface-container-lowest border border-outline-variant/20 p-5 sm:p-6 cloud-shadow">
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
        <details className="mb-4 min-w-0 max-w-full rounded-lg border border-outline-variant/30">
          <summary className="min-h-[44px] flex items-center cursor-pointer px-4 py-3 text-sm font-bold text-primary-container">
            활동 기록 양식 보기
          </summary>

          <div className="min-w-0 max-w-full px-4 pb-4">
            <WorksheetMarkdown
              markdown={activity.worksheet_markdown}
            />
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

  const [data, setData] =
    useState<ActivitiesState | null>(null);

  const [error, setError] =
    useState<ExplorationErrorCode | null>(null);

  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (resultId === null) return;

    let alive = true;

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
                    personalized={current.value.nextActivities.some(
                      (activity) =>
                        activity.preferenceApplied,
                    )}
                    onChanged={() =>
                      setVersion((previous) => previous + 1)
                    }
                  />
                </div>
              )}
          </>
        )}

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
                {current.value.groups.map(
                  (group, index) => (
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
                  ),
                )}
              </div>
            </section>
          )}
        </>
      )}
    </Shell>
  );
};

export default ExplorationActivities;