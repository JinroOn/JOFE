import { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { getDashboardSummary } from '../../../api/dashboard';
import { isExplorationEnabled } from '../../../config/features';
import Dashboard from '../Dashboard';

type Decision =
  | { kind: 'LOADING' }
  | { kind: 'LEGACY' }
  | { kind: 'EXPLORATION'; sessionId: number };

// 어떤 결과를 먼저 보여줄지는 서버가 정한다 — /dashboard/summary 의 latestResult 를 그대로 따른다.
// 두 종류 비교, 손상된 결과 건너뛰기, 탐색형 사용 가능 여부 판정 모두 서버 몫이다. (JOFE#127)
// 기존 결과는 ?view=legacy 로 그대로 열린다.
const ExplorationAwareHome = () => {
  const [decision, setDecision] = useState<Decision>({ kind: 'LOADING' });

  useEffect(() => {
    let alive = true;

    getDashboardSummary()
      .then((summary) => {
        if (!alive) return;
        const latest = summary.latestResult;
        // 탐색형을 쓸 수 없으면 서버가 UNAVAILABLE과 레거시 정보만 준다.
        if (summary.exploration === 'UNAVAILABLE' || latest?.type !== 'EXPLORATION_V1') {
          setDecision({ kind: 'LEGACY' });
          return;
        }
        setDecision({ kind: 'EXPLORATION', sessionId: latest.sessionId });
      })
      // 요약을 못 받으면 기존 결과 화면으로 연다. 탐색형 결과를 임의로 고르지는 않는다.
      .catch(() => {
        if (alive) setDecision({ kind: 'LEGACY' });
      });

    return () => {
      alive = false;
    };
  }, []);

  if (decision.kind === 'LOADING') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p role="status" className="text-sm text-on-surface-variant">
          최근 결과를 확인하고 있어요…
        </p>
      </div>
    );
  }

  if (decision.kind === 'EXPLORATION') {
    return <Navigate to={`/analysis/exploration/${decision.sessionId}`} replace />;
  }

  return <Dashboard />;
};

const ResultHome = () => {
  const [params] = useSearchParams();

  if (!isExplorationEnabled || params.get('view') === 'legacy') {
    return <Dashboard />;
  }

  return <ExplorationAwareHome />;
};

export default ResultHome;
