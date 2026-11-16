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

## 실제 DEV 서버 인수 검증 (2026-11-17 통과)

앞선 확인에서 남아 있던 "실행 중인 DEV 백엔드로 완료된 회차의 결과→비교 흐름" 항목을 실제로 돌려 통과했다.

환경: JOBE `develop` `bf73ee4`(PR #106까지), JOFE `develop` `ffd82e1`(PR #124까지).
MySQL 8.0 컨테이너(호스트 13307), 백엔드 `SERVER_PORT=18080`,
`SPRING_PROFILES_ACTIVE=dev,exploration-dev`, `EXPLORATION_RUN_MODE=DEV`,
`EXPLORATION_DEV_USER_IDS`에 호출 사용자 포함. 프런트는 `VITE_EXPLORATION_MOCK=false`,
`VITE_API_BASE_URL=http://localhost:18080/api`.

- Flyway V8~V11이 기존 V7 DB에 순서대로 적용됐다.
- 결과 조회: `GET /exploration/v1/sessions/{id}/result` 200.
  `displaySource: SEALED_RESULT_PROJECTION`, `displayVersion: RESULT_DISPLAY_V1_0`.
- 결과 화면: 전공군 이름·요약(예술·생명·경영·경제)과 전공별 근거 3종(관심·활동·학습) 문장,
  근거 수준 배지, 재확인 축 이름 8개가 모두 표시됐다. 코드가 노출된 자리는 없다.
- 확인 안내: `cautionAvailability: UNAVAILABLE`,
  `cautionUnavailableReason: APPROVAL_SNAPSHOT_NOT_AVAILABLE`인 과거 봉인 결과에서
  "당시 확인된 안내 자료가 없어 전공별 확인 안내를 제공하지 않아요"로 표시되고,
  검사 당시 준비 답변 7건은 접이식 영역에 원문으로 남았다. 두 의미가 섞이지 않았다.
- 비교(방향이 갈리는 쌍, 미생물학과·생명과학과): `leftMajorCode`·`rightMajorCode`로 200.
  `comparisonSets`의 방향 문구("미생물 중심의 학습 내용" 대 "생명 원리 중심의 학습 내용")가 표시됐다.
- 비교(공유 세트 없는 쌍, 디지털디자인학과·무용학과): `comparisonState: NO_SHARED_COMPARISON_SET`에서
  "같은 기준으로 나눠 보여줄 비교 항목이 아직 없어요" 안내로 처리되고 방향 차이 영역은 숨었다.
- 기능 가용성: `planAvailable: false`, `sharingAvailable: false`,
  `activityAvailability: UNAVAILABLE`에 따라 12주 계획·공유 패널·활동 섹션이 노출되지 않았다.
- 브라우저 콘솔 오류 0. `npm test` 23개 통과.

공유는 `exploration.sharing.enabled`가 꺼진 상태라 발급·철회 흐름은 범위 밖이다.

### `COMPLETION_SNAPSHOT` 경로도 통과 (2026-11-17)

위에서 남겨 둔 "새로 완료한 회차의 승인 주의 태그" 경로를 같은 환경에서 이어 확인했다.
회차를 새로 시작해 73문항(1단계 39 → 2단계 24 → 3단계 10)을 끝까지 응답하고 완료했다.

- `displaySource: COMPLETION_SNAPSHOT`, `cautionAvailability: EVALUATED`,
  `cautionUnavailableReason: null`.
- 승인 주의 태그 2건(`CAUTION_PRACTICE`, `CAUTION_SCIENCE`)이 `usage: DEV_EXPLORATION_CHECK_ONLY`로
  내려오고, 화면 "탐색하면서 확인해볼 점"에 전공명 + 안내 문구 + "이렇게 확인해보세요 ·" + 확인 행동으로
  표시됐다.
- 검사 당시 준비 답변 7건은 "내가 답한 준비 상황 보기" 접이식에 그대로 남았고,
  과거 결과에서 나오던 "당시 확인된 안내 자료가 없어…" 문구는 출력되지 않았다.
  **승인 안내와 준비 답변 두 의미가 섞이지 않는다.**
- 적재된 주의 태그는 `APPROVED_FOR_IMPLEMENTATION` 139건 / `PENDING` 48건으로 명세와 같고,
  결과에는 승인분만 나왔다.
- 콘솔 오류는 외부 폰트 CDN(Google Fonts·jsdelivr) 차단 4건뿐이고 앱 요청은 모두 200이다.

### 전환 시 알아둘 점 — 런타임 번들은 회차 시작 시점에 고정된다

확인 중에 드러난 사실이다. 주의 태그는 회차 시작 때 고정된 런타임 스냅샷에서 읽는다
(`ExplorationRuntimeCatalog`가 `cautionTags`를 payload에 넣고 `exploration_session_pin`으로 묶는다).

- JOBE PR #103 **이전에 시작된** 회차는 완료를 #103 이후에 해도 번들에 `cautionTags`가 없어
  확인 안내가 영구히 `UNAVAILABLE`이다. 실제로 이전 회차 둘은 같은 구 스냅샷을 공유했고
  (`JSON_CONTAINS_PATH($.cautionTags)` = 0), 새로 시작한 회차만 새 스냅샷을 고정해 `EVALUATED`가 됐다.
- 결과 불변·재현성 원칙상 맞는 동작이다. 소급 적용하거나 기존 결과를 재봉인하지 않는다.
- 다만 파일럿에서 "같은 서비스인데 어떤 회차는 확인 안내가 없다"로 보일 수 있으므로,
  진행 중 회차가 있는 상태로 전환할 때의 안내 문구를 제품 쪽에서 정해야 한다.

## 후속 순서

| 작업 | 확인 상태와 프론트 조치 |
|---|---|
| 공유 (#115, PR #122) | 발급 본문 `expectedShareRevision`·`includeNickname`, 철회 `POST /share/revoke`와 멱등키, 공개 조회 `/shared-results/{token}` 반영 완료. 이슈는 닫았다. `exploration.sharing.enabled`가 꺼져 있어 발급·철회 실서버 인수와 공개 프록시 제약은 남아 있다. |
| 관리자 카탈로그 (PR #124) | 백엔드 검토·활성화(`/admin/exploration/reviews`, `/activations`)와 목록·상세(JOBE PR #104)가 모두 들어와 프론트 연동을 맞췄다. 실서버 인수는 남아 있다. |
| 결과 표시 문구 (#100, PR #103) | 새 DTO와 이전 준비 답변 형식 연결 완료. **2026-11-17 실제 DEV 서버에서 과거 봉인 결과 경로와 새 회차의 `COMPLETION_SNAPSHOT` 경로를 모두 인수 검증했다**(위 절 참고). 런타임 번들이 회차 시작 시점에 고정되는 전환 안내만 제품 쪽 결정이 남았다. |
| AI 상담·12주 계획 (#101) | 전공 상세는 JOBE PR #105로 생겼다. 상담 2개·계획 3개는 여전히 없어 기능을 공개하지 않는다. |
| 통합 이력·대시보드 | 서버의 통합 API를 확인해 마이페이지·최근 결과 진입·요약을 연결한다. 진행 중 검사 폐기와 동시 수정 안내도 정리한다. |
| main 릴리스 (#111) | 레거시 진단 안내의 문항 수·2차 심화 설명을 실제 흐름으로 수정한다. 프로덕션 기능 플래그·API 대상과 스테이징 레거시 회귀를 확인한 뒤 별도 릴리스한다. |

카탈로그 활성화 API가 구현돼도 런타임은 현재 DEV만 허용한다. PILOT/PUBLIC 공개, 전문가 검수, 활동 카탈로그 승인은 프론트 버튼을 켜는 것과 별개다.
