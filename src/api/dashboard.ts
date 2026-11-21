import api from './axios';
import { isExplorationMock } from '../config/features';
import * as mock from './explorationMock';
import type { DashboardSummary } from '../types/dashboard';

// 레거시·탐색형을 서버가 비교해 고른 요약. 프런트는 다시 비교하지 않는다. (JOFE#127, JinroOn/JOBE#102)
// 탐색형을 쓸 수 없는 사용자도 실패 대신 exploration: 'UNAVAILABLE'과 레거시 정보를 받는다.
export const getDashboardSummary = () =>
  isExplorationMock
    ? mock.dashboardSummary()
    : api.get<DashboardSummary>('/dashboard/summary').then((r) => r.data);
