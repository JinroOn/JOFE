import type { DiagnosisHistoryItem } from '../types/history';

export const historyActionPath = (
  item: DiagnosisHistoryItem,
): string | null => {
  // 이전 방식 진단의 이어하기와 완료 결과 모두 차단
  if (item.type !== 'EXPLORATION_V1') {
    return null;
  }

  if (item.nextAction === 'RESUME') {
    return `/diagnosis/exploration/session/${item.sessionId}`;
  }

  if (
    item.nextAction === 'VIEW_RESULT' &&
    item.resultAvailability === 'AVAILABLE'
  ) {
    return `/analysis/exploration/${item.sessionId}`;
  }

  return null;
};

export const historyUnavailableMessage = (
  item: DiagnosisHistoryItem,
): string | null => {
  if (item.type !== 'EXPLORATION_V1') {
    return null;
  }

  if (item.status !== 'completed') {
    return null;
  }

  switch (item.resultAvailability) {
    case 'MISSING':
      return '완료된 진단이지만 저장된 결과가 없어요.';

    case 'AMBIGUOUS':
      return '결과가 여러 개 있어 확인이 필요해요.';

    case 'UNAVAILABLE':
      return '결과 자료를 확인할 수 없어 열 수 없어요.';

    default:
      return null;
  }
};