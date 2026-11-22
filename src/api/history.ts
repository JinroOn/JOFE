import api from './axios';
import { isExplorationMock } from '../config/features';
import * as mock from './explorationMock';

import type {
  DiagnosisHistoryPage,
  DiagnosisHistoryQuery,
} from '../types/history';

export type HistorySource = 'unified' | 'legacy';

export type LoadedHistoryPage = DiagnosisHistoryPage & {
  source: HistorySource;
};

const onlyExploration = (
  page: DiagnosisHistoryPage,
): DiagnosisHistoryPage => ({
  ...page,
  items: page.items.filter(
    (item) => item.type === 'EXPLORATION_V1',
  ),
});

// 기존 진단을 요청하는 type 값이 들어와도
// 항상 탐색 진단 이력만 조회합니다.
export const getDiagnosisHistorySessions = async (
  query: DiagnosisHistoryQuery = {},
): Promise<DiagnosisHistoryPage> => {
  const params = {
    type: 'EXPLORATION_V1' as const,
    status: query.status,
    limit: query.limit,
    cursor: query.cursor,
  };

  const page = isExplorationMock
    ? await mock.historySessions(params)
    : await api
        .get<DiagnosisHistoryPage>(
          '/exploration/v1/history/sessions',
          { params },
        )
        .then((response) => response.data);

  return onlyExploration(page);
};

// 통합 이력 조회 실패 시 기존 진단 목록으로
// 대체하지 않고 오류를 상위 화면으로 전달합니다.
export const loadInitialDiagnosisHistory = async (
  enabled: boolean,
  limit: number,
): Promise<LoadedHistoryPage> => {
  if (!enabled) {
    throw new Error(
      '전공 탐색 진단을 이용할 수 없어 이력을 조회할 수 없습니다.',
    );
  }

  const page = await getDiagnosisHistorySessions({
    limit,
  });

  return {
    ...page,
    source: 'unified',
  };
};