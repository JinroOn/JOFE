import { useEffect, useState } from 'react';
import {
  Link,
  Navigate,
  useSearchParams,
} from 'react-router-dom';

import { getDashboardSummary } from '../../../api/dashboard';

import {
  diagnosisEntryPath,
  isExplorationEnabled,
} from '../../../config/features';

import Dashboard from '../Dashboard';

type ResultSection =
  | 'compare'
  | 'activities'
  | 'ask'
  | 'plan';

type Decision =
  | {
      kind:
        | 'LOADING'
        | 'EMPTY'
        | 'UNAVAILABLE'
        | 'ERROR';
    }
  | {
      kind: 'READY';
      sessionId: number;
    };

function resultSection(
  value: string | null,
): ResultSection | null {
  return value === 'compare' ||
    value === 'activities' ||
    value === 'ask' ||
    value === 'plan'
    ? value
    : null;
}

const ExplorationResultHome = ({
  section,
}: {
  section: ResultSection | null;
}) => {
  const [decision, setDecision] = useState<Decision>({
    kind: 'LOADING',
  });

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!isExplorationEnabled) return;

    let alive = true;

    getDashboardSummary()
      .then((summary) => {
        if (!alive) return;

        if (summary.exploration === 'UNAVAILABLE') {
          setDecision({
            kind: 'UNAVAILABLE',
          });

          return;
        }

        const latest =
          summary.latestByType.EXPLORATION_V1 ??
          (summary.latestResult?.type === 'EXPLORATION_V1'
            ? summary.latestResult
            : null);

        setDecision(
          latest
            ? {
                kind: 'READY',
                sessionId: latest.sessionId,
              }
            : {
                kind: 'EMPTY',
              },
        );
      })
      .catch(() => {
        if (alive) {
          setDecision({
            kind: 'ERROR',
          });
        }
      });

    return () => {
      alive = false;
    };
  }, [attempt]);

  if (
    isExplorationEnabled &&
    decision.kind === 'READY'
  ) {
    const path =
      '/analysis/exploration/' +
      decision.sessionId +
      (section ? '/' + section : '');

    return (
      <Navigate
        to={path}
        replace
      />
    );
  }

  const unavailable =
    !isExplorationEnabled ||
    decision.kind === 'UNAVAILABLE';

  const loading =
    !unavailable &&
    decision.kind === 'LOADING';

  const error =
    !unavailable &&
    decision.kind === 'ERROR';

  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4">
      <section className="max-w-lg text-center">
        {loading ? (
          <p
            role="status"
            className="text-sm text-on-surface-variant"
          >
            최근 탐색 결과를 확인하고 있어요…
          </p>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-primary-container">
              {unavailable
                ? '전공 탐색 진단을 이용할 수 없어요'
                : error
                  ? '탐색 결과를 불러오지 못했어요'
                  : '전공 탐색 진단을 먼저 완료해 주세요'}
            </h1>

            <p className="mt-3 text-sm text-on-surface-variant">
              {unavailable || error
                ? '잠시 후 다시 확인해 주세요.'
                : '진단을 완료하면 후보 전공을 비교하고, 활동이나 상담을 이어갈 수 있어요.'}
            </p>

            {unavailable ? (
              <Link
                to="/"
                className="inline-flex mt-6 px-5 py-3 rounded-lg bg-primary-container text-white"
              >
                홈으로 돌아가기
              </Link>
            ) : error ? (
              <button
                type="button"
                className="mt-6 px-5 py-3 rounded-lg bg-primary-container text-white"
                onClick={() => {
                  setDecision({
                    kind: 'LOADING',
                  });

                  setAttempt(
                    (value) => value + 1,
                  );
                }}
              >
                다시 불러오기
              </button>
            ) : (
              <Link
                to={diagnosisEntryPath}
                className="inline-flex mt-6 px-5 py-3 rounded-lg bg-primary-container text-white"
              >
                전공 탐색 진단 시작하기
              </Link>
            )}
          </>
        )}
      </section>
    </main>
  );
};

const ResultHome = () => {
  const [params] = useSearchParams();

  if (params.get('view') === 'legacy') {
    return <Dashboard />;
  }

  return (
    <ExplorationResultHome
      section={resultSection(params.get('next'))}
    />
  );
};

export default ResultHome;