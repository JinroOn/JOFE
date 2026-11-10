// 탐색형 진단 진입점 기능 플래그. 기본값은 꺼짐(레거시 진단만 노출).
export const isExplorationEnabled = import.meta.env.VITE_FEATURE_EXPLORATION === 'true';

// 백엔드 /api/exploration/v1 구현 전까지 mock 어댑터 사용
export const isExplorationMock = import.meta.env.VITE_EXPLORATION_MOCK === 'true';
