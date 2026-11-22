import { useCallback, useEffect, useRef, useState } from 'react';
import { getDiagnosisHistorySessions, loadInitialDiagnosisHistory } from '../api/history';
import type { HistorySource } from '../api/history';
import { isExplorationEnabled } from '../config/features';
import type { DiagnosisHistoryItem } from '../types/history';

const PAGE_LIMIT = 5;
interface HistoryState {
  items: DiagnosisHistoryItem[];
  phase: 'LOADING' | 'READY' | 'ERROR';
  source: HistorySource | null;
  cursor: string | null;
  hasMore: boolean;
  loadingMore: boolean;
  moreError: boolean;
  revision: number;
}
const initial: HistoryState = { items: [], phase: 'LOADING', source: null, cursor: null, hasMore: false, loadingMore: false, moreError: false, revision: 0 };

const useDiagnosisHistory = () => {
  const [state, setState] = useState<HistoryState>(initial);
  const generation = useRef(0);
  const pendingMore = useRef(false);

  const fetchInitial = useCallback(async () => {
    const current = ++generation.current;
    pendingMore.current = false;
    try {
      const page = await loadInitialDiagnosisHistory(isExplorationEnabled, PAGE_LIMIT);
      if (generation.current !== current) return;
      setState({ ...initial, revision: current, items: page.items, phase: 'READY', source: page.source,
        hasMore: page.hasMore, cursor: page.hasMore ? page.nextCursor : null });
    } catch {
      if (generation.current === current) setState({ ...initial, phase: 'ERROR' });
    }
  }, []);

  const cancelPending = useCallback(() => { generation.current++; }, []);
  useEffect(() => {
    let alive = true;
    void Promise.resolve().then(() => { if (alive) return fetchInitial(); });
    return () => { alive = false; cancelPending(); };
  }, [fetchInitial, cancelPending]);

  const refresh = useCallback(() => {
    setState(initial);
    return fetchInitial();
  }, [fetchInitial]);

  const loadMore = async () => {
    if (!state.cursor || !state.hasMore || pendingMore.current) return;
    pendingMore.current = true;
    const current = generation.current;
    setState((prev) => ({ ...prev, loadingMore: true, moreError: false }));
    try {
      const page = await getDiagnosisHistorySessions({ limit: PAGE_LIMIT, cursor: state.cursor });
      if (generation.current !== current) return;
      setState((prev) => {
        const seen = new Set(prev.items.map((item) => item.key));
        return { ...prev, items: [...prev.items, ...page.items.filter((item) => !seen.has(item.key))],
          hasMore: page.hasMore, cursor: page.hasMore ? page.nextCursor : null, loadingMore: false };
      });
    } catch {
      if (generation.current === current) setState((prev) => ({ ...prev, loadingMore: false, moreError: true }));
    } finally {
      if (generation.current === current) pendingMore.current = false;
    }
  };

  return { ...state, refresh, loadMore };
};

export type DiagnosisHistoryController = ReturnType<typeof useDiagnosisHistory>;
export default useDiagnosisHistory;
