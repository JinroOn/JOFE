import type { DiagnosisHistoryItem } from '../types/history';

// links는 API 주소이므로 이동에 사용하지 않는다. 서버의 nextAction만 화면 경로로 옮긴다.
export const historyActionPath = (item: DiagnosisHistoryItem): string | null => {
  if (item.nextAction === 'RESUME') return item.type === 'EXPLORATION_V1'
    ? `/diagnosis/exploration/session/${item.sessionId}` : null;
  if (item.nextAction !== 'VIEW_RESULT' || item.resultAvailability !== 'AVAILABLE') return null;
  if (item.type === 'EXPLORATION_V1') return `/analysis/exploration/${item.sessionId}`;
  return `/analysis/dashboard?view=legacy${item.resultId === null ? '' : `&resultId=${item.resultId}`}`;
};

export const historyUnavailableMessage = (item: DiagnosisHistoryItem): string | null => {
  if (item.type === 'LEGACY' && item.status === 'in_progress') return '이전 방식의 진단이 종료됐어요.';
  if (item.status !== 'completed') return null;
  switch (item.resultAvailability) {
    case 'MISSING': return '완료된 진단이지만 저장된 결과가 없어요.';
    case 'AMBIGUOUS': return '결과가 여러 개 있어 확인이 필요해요.';
    case 'UNAVAILABLE': return '결과 자료를 확인할 수 없어 열 수 없어요.';
    default: return null;
  }
};
