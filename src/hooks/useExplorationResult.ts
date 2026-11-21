import { useCallback, useEffect, useRef, useState } from 'react';
import { getExplorationResult, toExplorationErrorCode } from '../api/exploration';
import useExplorationStore from '../store/useExplorationStore';
import type { ExplorationErrorCode, ExplorationResult } from '../types/exploration';

type ResultLoadState =
  | { kind: 'LOADING' }
  | { kind: 'GENERATING' }
  | { kind: 'READY'; result: ExplorationResult }
  | { kind: 'TIMEOUT' }
  | { kind: 'ERROR'; code: ExplorationErrorCode };

const MAX_WAIT_MS = 60_000;
const MAX_INTERVAL_MS = 5_000;

// 방금 완료한 회차는 complete 응답으로 이미 결과를 받아 스토어에 있다 — 다시 조회하지 않는다.
const cachedResult = (sessionId: number) => {
  const cached = useExplorationStore.getState().result;
  return cached && cached.sessionId === sessionId ? cached : null;
};

// 완료 요청은 다시 보내지 않는다.
// GENERATING 분기는 mock 어댑터 전용이다 — 실제 백엔드는 202를 주지 않는다 (JOFE#113).
const useExplorationResult = (sessionId: number) => {
  const [state, setState] = useState<ResultLoadState>(() => {
    const cached = cachedResult(sessionId);
    return cached ? { kind: 'READY', result: cached } : { kind: 'LOADING' };
  });
  const [attempt, setAttempt] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    const startedAt = Date.now();
    let interval = 0;

    const poll = async () => {
      try {
        const cached = cachedResult(sessionId);
        if (cached) {
          if (alive) setState({ kind: 'READY', result: cached });
          return;
        }
        const res = await getExplorationResult(sessionId);
        if (!alive) return;
        if (res.state === 'READY') {
          setState({ kind: 'READY', result: res.result });
          return;
        }
        if (Date.now() - startedAt > MAX_WAIT_MS) {
          setState({ kind: 'TIMEOUT' });
          return;
        }
        setState({ kind: 'GENERATING' });
        interval = Math.min(Math.max(res.retryAfterMs, interval * 1.5, 500), MAX_INTERVAL_MS);
        timer.current = setTimeout(poll, interval);
      } catch (e) {
        if (alive) setState({ kind: 'ERROR', code: toExplorationErrorCode(e) });
      }
    };

    void poll();
    return () => {
      alive = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [sessionId, attempt]);

  const retry = useCallback(() => {
    setState({ kind: 'LOADING' });
    setAttempt((n) => n + 1);
  }, []);

  return { state, retry };
};

export default useExplorationResult;
