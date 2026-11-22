// 탐색형 진단 진입점 기능 플래그. 배포 환경에서 탐색 기능의 활성 여부를 제어한다.
export const isExplorationEnabled = import.meta.env.VITE_FEATURE_EXPLORATION === 'true';

// 백엔드 /api/exploration/v1 구현 전까지 mock 어댑터 사용
export const isExplorationMock = import.meta.env.VITE_EXPLORATION_MOCK === 'true';

// 모든 새 진단은 전공 탐색 진단에서 시작한다.
export const diagnosisEntryPath = '/diagnosis/exploration';
