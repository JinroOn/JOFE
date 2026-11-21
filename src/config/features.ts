// 탐색형 진단 진입점 기능 플래그. 기본값은 꺼짐(레거시 진단만 노출).
export const isExplorationEnabled = import.meta.env.VITE_FEATURE_EXPLORATION === 'true';

// 백엔드 /api/exploration/v1 구현 전까지 mock 어댑터 사용
export const isExplorationMock = import.meta.env.VITE_EXPLORATION_MOCK === 'true';

// 진단 시작 입구. 플래그가 켜지면 새 진입은 탐색형으로 보낸다 (04 문서 Frontend 1절).
// 레거시 회차 이어하기와 레거시 화면 안의 이동은 계속 /diagnosis 를 쓴다.
export const diagnosisEntryPath = isExplorationEnabled ? '/diagnosis/exploration' : '/diagnosis';
