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

type ResultSection =
  | 'compare'
  | 'activities'
  | 'ask'
  | 'plan';

type Decision =
  | {
      kind: 'LOADING' | 'EMPTY' | 'UNAVAILABLE' | 'ERROR';
    }
  | {
      kind: 'READY';
      sessionId: number;
    };

const resultSection = (
  value: string | null,
): ResultSection | null => {
  if (
    value === 'compare' ||
    value === 'activities' ||
    value === 'ask' ||
    value === 'plan'
  ) {
    return value;
  }
  return null;
};

const ResultHome = () => {
  const [params] = useSearchParams();
  const section = resultSection(params.get('next'));

  const [decision, setDecision] = useState<Decision>({
    kind: 'LOADING',
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!isExplorationEnabled) return;

    let active = true;

    getDashboardSummary()
      .then((summary) => {
        if (!active) return;

        if (summary.exploration === 'UNAVAILABLE') {
          setDecision({ kind: 'UNAVAILABLE' });
          return;
        }

        // 기존 진단 결과는 새 서비스의 결과로 사용하지 않습니다.
        const latest =
          summary.latestByType.EXPLORATION_V1 ??
          (
            summary.latestResult?.type === 'EXPLORATION_V1'
              ? summary.latestResult
              : null
          );

        setDecision(
          latest
            ? {
                kind: 'READY',
                sessionId: latest.sessionId,
              }
            : { kind: 'EMPTY' },
        );
      })
      .catch(() => {
        if (active) {
          setDecision({ kind: 'ERROR' });
        }
      });

    return () => {
      active = false;
    };
  }, [attempt]);

  if (
    isExplorationEnabled &&
    decision.kind === 'READY'
  ) {
    const destination =
      `/analysis/exploration/${decision.sessionId}` +
      (section ? `/${section}` : '');

    // view=legacy, resultId 등 이전 쿼리 파라미터는
    // 목적지로 전달하지 않습니다.
    return <Navigate to={destination} replace />;
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
    <main className="flex min-h-[60vh] items-center justify-center px-4">
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
                : '전공 탐색 진단을 완료하면 추천 전공, 비교, 탐색 활동과 상담을 확인할 수 있습니다.'}
            </p>

            {unavailable ? (
              <Link
                to="/"
                className="mt-6 inline-flex rounded-lg bg-primary-container px-5 py-3 text-white"
              >
                홈으로 돌아가기
              </Link>
            ) : error ? (
              <button
                type="button"
                className="mt-6 rounded-lg bg-primary-container px-5 py-3 text-white"
                onClick={() => {
                  setDecision({ kind: 'LOADING' });
                  setAttempt((previous) => previous + 1);
                }}
              >
                다시 불러오기
              </button>
            ) : (
              <Link
                to={diagnosisEntryPath}
                className="mt-6 inline-flex rounded-lg bg-primary-container px-5 py-3 text-white"
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

export default ResultHome;