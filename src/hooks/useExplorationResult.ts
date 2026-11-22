import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  getExplorationResult,
  toExplorationErrorCode,
} from '../api/exploration';

import useAuthStore from '../store/useAuthStore';
import useExplorationStore from '../store/useExplorationStore';

import type {
  ExplorationErrorCode,
  ExplorationResult,
  ExplorationResultResponse,
} from '../types/exploration';

type ResultLoadState =
  | { kind: 'LOADING' }
  | { kind: 'GENERATING' }
  | { kind: 'READY'; result: ExplorationResult }
  | { kind: 'TIMEOUT' }
  | { kind: 'ERROR'; code: ExplorationErrorCode };

interface ResultSnapshot {
  sessionId: number;
  state: ResultLoadState;
}

const MAX_WAIT_MS = 60_000;
const MAX_INTERVAL_MS = 5_000;

// 같은 결과의 동시 GET 요청만 공유합니다.
// 요청이 완료되면 Map에서 제거하므로
// 나중에 다시 방문해도 최신 활동을 조회할 수 있습니다.
const pendingResultRequests = new Map<
  string,
  Promise<ExplorationResultResponse>
>();

const getFreshResult = (
  sessionId: number,
): Promise<ExplorationResultResponse> => {
  const auth = useAuthStore.getState();

  // 서로 다른 로그인 세션의 요청을 합치지 않습니다.
  const requestKey = [
    auth.sessionVersion,
    auth.user?.id ?? 'anonymous',
    sessionId,
  ].join(':');

  const pending =
    pendingResultRequests.get(requestKey);

  if (pending) {
    return pending;
  }

  const request = getExplorationResult(sessionId)
    .finally(() => {
      if (
        pendingResultRequests.get(requestKey) ===
        request
      ) {
        pendingResultRequests.delete(requestKey);
      }
    });

  pendingResultRequests.set(requestKey, request);

  return request;
};

// 완료 응답이 저장된 경우 가져옵니다.
// 현재 URL의 sessionId와 같은 결과만 사용합니다.
const cachedResult = (
  sessionId: number,
): ExplorationResult | null => {
  const cached =
    useExplorationStore.getState().result;

  return cached?.sessionId === sessionId
    ? cached
    : null;
};

// 네트워크 장애, 서버 오류 등의 경우에는
// 완료 응답을 대체 결과로 표시할 수 있습니다.
//
// 반대로 401·403·404 같은 접근 오류에서는
// 이전에 저장된 결과를 보여주지 않습니다.
const canFallbackToCompletedResult = (
  error: unknown,
): boolean => {
  const status = (
    error as {
      response?: {
        status?: number;
      };
    } | null
  )?.response?.status;

  return (
    status === undefined ||
    status === 429 ||
    status >= 500
  );
};

// 완료 POST는 재요청하지 않습니다.
//
// 실제 백엔드는 결과 GET에 현재 승인된 활동을
// 포함해서 반환합니다.
//
// GENERATING은 기존 Mock 어댑터를 위해 유지합니다.
const useExplorationResult = (
  sessionId: number,
) => {
  // 완료 응답이 캐시에 있더라도 바로 READY로
  // 표시하지 않습니다.
  //
  // 먼저 GET 결과를 확인해야 완료 직후
  // "승인된 탐색 활동 안내를 준비 중입니다."라는
  // 과거 시점의 문구가 잠깐 나타나는 현상을 막습니다.
  const [snapshot, setSnapshot] =
    useState<ResultSnapshot>(() => ({
      sessionId,
      state: { kind: 'LOADING' },
    }));

  const [attempt, setAttempt] =
    useState(0);

  // 라우트의 sessionId가 바뀌면
  // 이전 회차의 결과를 표시하지 않습니다.
  const state: ResultLoadState =
    snapshot.sessionId === sessionId
      ? snapshot.state
      : { kind: 'LOADING' };

  useEffect(() => {
    let alive = true;

    const startedAt = Date.now();
    let interval = 0;

    let timer:
      | ReturnType<typeof setTimeout>
      | null = null;

    // 완료 직후의 응답은 실패 시 사용할 수 있도록
    // 백업으로 보관합니다.
    const completedResult =
      cachedResult(sessionId);

    const updateState = (
      next: ResultLoadState,
    ) => {
      if (!alive) return;

      setSnapshot({
        sessionId,
        state: next,
      });
    };

    const poll = async () => {
      try {
        // 핵심 수정:
        // 캐시가 있어도 반드시 결과 GET을 호출합니다.
        //
        // GET /api/exploration/v1/sessions/
        //     {sessionId}/result
        const response =
          await getFreshResult(sessionId);

        if (!alive) return;

        if (response.state === 'READY') {
          const freshResult = response.result;

          // 완료 응답을 저장한 스토어도
          // GET으로 받은 최신 결과로 갱신합니다.
          //
          // 다른 회차의 결과를 덮어쓰지 않습니다.
          if (cachedResult(sessionId)) {
            useExplorationStore.setState({
              result: freshResult,
            });
          }

          updateState({
            kind: 'READY',
            result: freshResult,
          });

          return;
        }

        // Mock 생성 대기 시간 초과
        if (
          Date.now() - startedAt > MAX_WAIT_MS
        ) {
          // 완료 응답이 이미 있다면
          // 진단 결과 자체는 계속 확인할 수 있습니다.
          if (completedResult) {
            updateState({
              kind: 'READY',
              result: completedResult,
            });
          } else {
            updateState({
              kind: 'TIMEOUT',
            });
          }

          return;
        }

        updateState({
          kind: 'GENERATING',
        });

        interval = Math.min(
          Math.max(
            response.retryAfterMs,
            interval * 1.5,
            500,
          ),
          MAX_INTERVAL_MS,
        );

        timer = setTimeout(
          () => void poll(),
          interval,
        );
      } catch (error) {
        if (!alive) return;

        // 결과 GET이 일시적으로 실패했더라도
        // 완료 응답이 있으면 결과 화면을 유지합니다.
        if (
          completedResult &&
          canFallbackToCompletedResult(error)
        ) {
          updateState({
            kind: 'READY',
            result: completedResult,
          });

          return;
        }

        // 완료 응답이 없는 경우나
        // 접근 권한 오류는 기존 오류 화면을 유지합니다.
        updateState({
          kind: 'ERROR',
          code: toExplorationErrorCode(error),
        });
      }
    };

    void poll();

    return () => {
      alive = false;

      if (timer !== null) {
        clearTimeout(timer);
      }
    };
  }, [sessionId, attempt]);

  const retry = useCallback(() => {
    // 사용자가 직접 재확인할 때만
    // 조회 시도를 새로 시작합니다.
    setSnapshot({
      sessionId,
      state: { kind: 'LOADING' },
    });

    setAttempt(
      (previous) => previous + 1,
    );
  }, [sessionId]);

  return {
    state,
    retry,
  };
};

export default useExplorationResult;