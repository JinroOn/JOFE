# 프론트 연동 확인과 후속 작업

확인일: 2026-11-16. 프론트 작업만 수행하며 백엔드는 계약 확인용으로 읽는다.

## 확인 기준

- JOFE `develop`: `22942e3` (PR #119 인증·사용자 계약, PR #120 후보 비교 반영).
- JOBE `develop`: `392e479` (PR #103 결과 표시 문구·근거·주의 안내 반영).
- 루트는 두 Git 저장소와 기획 자료를 담는 폴더다. 프론트 변경은 JOFE에서만 커밋한다.

## 이번 변경: 후보 전공 비교

근거: JOFE #118, 백엔드 `ExplorationComparisonController`, `ResultComparisonProjector`, `ExplorationComparisonApiTest`.

- 미선택·1개 선택: 쿼리 없이 `GET /exploration/v1/results/{resultId}/comparison`으로 서버 후보를 조회한다. 결과 첫 화면에 보이는 7개 밖의 후보도 선택할 수 있다.
- 두 전공 선택: `leftMajorCode`와 `rightMajorCode`만 보낸다. 선택 순서를 좌우에 보존한다.
- 세 전공 비교는 제공하지 않는다. 결과 화면과 비교 화면 모두 최대 2개를 선택한다.
- 설명은 `comparisonSets[].leftDirections/rightDirections[].descriptions[].text`와 봉인된 `focusResponses[].answerText`를 표시한다. 축 코드·전공군 코드를 표시용 문구로 쓰거나 없는 진로 정보를 만들어내지 않는다.
- `SAME_DIRECTIONS`, `NO_SHARED_COMPARISON_SET`, `available: false`를 구분한다. 생략 항목은 문자열이 아닌 `{ comparisonSet, reasonCode, declaredSkipPair }` 객체다.
- `MAJOR_NOT_IN_RESULT` 오류는 후보 재선택으로 연결한다. 비교 대상 변경 후 이전 응답·오류를 표시하지 않는다.
- mock도 같은 백엔드 DTO를 반환하고 같은 변환 함수를 거친다.

## 검증

- `npm test`: 인증·오류 코드·비교 API·mock·결과 표시·과거 응답 호환 회귀 테스트 23개.
- `npm run lint`, `npm run build`: 린트와 TypeScript·Vite 빌드.
- `npm run test:comparison-ui`: 로컬 프론트의 실제 브라우저에서 비교 8개와 새 결과 표시·과거 결과 2개 흐름 검증. 검증용 API 응답을 요청 경계에 제공하며 실서버 인수 테스트와 구분한다.

## 결과 표시 계약 반영

`ExplorationResultStore`와 `ExplorationResultDisplay`의 새 응답에 맞춰 전공군 이름·요약, 전공 근거·근거 수준·접기 여부, 재확인 축 이름을 표시한다. 프론트는 응답 순서와 결과를 재계산하지 않는다.

`cautions`는 서버가 승인 조건을 확인한 전공별 안내다. `preparationResponses`의 검사 당시 답변은 별도 접이식 영역에 원문으로 표시한다. 과거 백엔드가 `cautions`에 준비 답변만 주던 형식도 두 의미를 혼동하지 않고 읽는다. `SEALED_RESULT_PROJECTION`의 승인 자료 부재는 확인 안내 불가로 유지한다.

브라우저 검증 서버 실행 예시(PowerShell):

```powershell
$env:VITE_FEATURE_EXPLORATION='true'
$env:VITE_EXPLORATION_MOCK='false'
$env:VITE_API_BASE_URL='http://127.0.0.1:5175/api'
npm run dev -- --host 127.0.0.1 --port 5175 --strictPort
```

다른 터미널에서 `npm run test:comparison-ui`를 실행한다. 다른 로컬 포트를 쓰면 `COMPARISON_UI_BASE_URL`도 맞춘다. 브라우저가 설치돼 있어야 하며, 스크린샷과 보고서는 Git에서 제외한 `output/playwright/`에 생성된다.

실행 중인 DEV 백엔드가 없어 실제 MySQL·DEV 서버에서 완료된 회차로 결과→비교 흐름을 검증하는 항목은 남아 있다. 이번 검증을 실서버 통합 통과로 기록하지 않는다.

## 후속 순서

| 작업 | 확인 상태와 프론트 조치 |
|---|---|
| 공유 (#115) | 발급 본문에 `expectedShareRevision`·`includeNickname`, 철회는 `POST /share/revoke`와 멱등키, 공개 조회는 `/shared-results/{token}`으로 맞춘다. 현재 공유는 DEV 검증 범위이며 공개 프록시 제약을 별도 확인한다. |
| 관리자 카탈로그 | 백엔드 검토·활성화는 `/admin/exploration/reviews`, `/activations`다. 프론트 요청·검토 근거 입력·이력 화면을 맞춘다. 목록·상세 API는 백엔드 #101 의존성이 남아 있다. |
| 결과 표시 문구 (#100, PR #103) | 새 DTO와 이전 준비 답변 형식 연결 완료. 전공군·근거·확인 안내·과거 결과 가용성을 검증했다. 실제 DEV 서버 인수는 남아 있다. |
| AI 상담·12주 계획·전공 상세 (#101) | 화면은 있으나 탐색형 소비자 API가 없다. 실제 엔드포인트와 DTO가 확정되기 전 기능을 공개하지 않는다. |
| 통합 이력·대시보드 | 서버의 통합 API를 확인해 마이페이지·최근 결과 진입·요약을 연결한다. 진행 중 검사 폐기와 동시 수정 안내도 정리한다. |
| main 릴리스 (#111) | 레거시 진단 안내의 문항 수·2차 심화 설명을 실제 흐름으로 수정한다. 프로덕션 기능 플래그·API 대상과 스테이징 레거시 회귀를 확인한 뒤 별도 릴리스한다. |

카탈로그 활성화 API가 구현돼도 런타임은 현재 DEV만 허용한다. PILOT/PUBLIC 공개, 전문가 검수, 활동 카탈로그 승인은 프론트 버튼을 켜는 것과 별개다.
