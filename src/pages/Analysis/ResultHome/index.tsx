import { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { listExplorationSessions } from '../../../api/exploration';
import { getDiagnosisResults } from '../../../api/results';
import { isExplorationEnabled } from '../../../config/features';
import Dashboard from '../Dashboard';

type Decision = { kind: 'LOADING' } | { kind: 'LEGACY' } | { kind: 'EXPLORATION'; sessionId: number };

const time = (iso: string | null | undefined) => {
  const t = iso ? new Date(iso).getTime() : NaN;
  return Number.isNaN(t) ? 0 : t;
};

// D-30: 탐색형 결과가 기존 결과보다 최신이면 탐색형 결과를 기본으로 보여준다.
// 기존 결과는 ?view=legacy 로 그대로 열린다. 기존 대시보드 코드는 바꾸지 않는다.
const ExplorationAwareHome = () => {
  const [decision, setDecision] = useState<Decision>({ kind: 'LOADING' });

  useEffect(() => {
    let alive = true;
    Promise.allSettled([listExplorationSessions(), getDiagnosisResults()]).then(([explorations, legacy]) => {
      if (!alive) return;
      const latestExploration =
        explorations.status === 'fulfilled'
          ? explorations.value
              .filter((s) => s.diagnosisType === 'EXPLORATION_V1' && s.status === 'completed')
              .sort((a, b) => time(b.completedAt ?? b.startedAt) - time(a.completedAt ?? a.startedAt) || b.sessionId - a.sessionId)[0]
          : undefined;
      const latestLegacy =
        legacy.status === 'fulfilled' ? Math.max(0, ...legacy.value.map((r) => time(r.createdAt))) : 0;
      if (latestExploration && time(latestExploration.completedAt ?? latestExploration.startedAt) >= latestLegacy) {
        setDecision({ kind: 'EXPLORATION', sessionId: latestExploration.sessionId });
      } else {
        setDecision({ kind: 'LEGACY' });
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  if (decision.kind === 'LOADING') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p role="status" className="text-sm text-on-surface-variant">최근 결과를 확인하고 있어요…</p>
      </div>
    );
  }
  if (decision.kind === 'EXPLORATION') return <Navigate to={`/analysis/exploration/${decision.sessionId}`} replace />;
  return <Dashboard />;
};

const ResultHome = () => {
  const [params] = useSearchParams();
  if (!isExplorationEnabled || params.get('view') === 'legacy') return <Dashboard />;
  return <ExplorationAwareHome />;
};

export default ResultHome;
