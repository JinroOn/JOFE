# 진로온 (JinroOn) — Frontend

흥미·활동·학습 응답을 근거로 먼저 탐색해볼 전공을 제안하는 **진로온**의 웹 프론트엔드입니다.
전공 탐색 진단, 결과와 근거, 전공 비교, 탐색 활동, AI 상담, 12주 탐색 계획, 관리자 화면을 제공합니다.

- 서비스 소개: [JinroOn 조직 프로필](https://github.com/JinroOn)
- 백엔드: [JinroOn/JOBE](https://github.com/JinroOn/JOBE)

## 🔗 Quick Links
- **프로덕션 (main):** [jinro-on.vercel.app](https://jinro-on.vercel.app)
- **스테이징 (develop):** [진행 중 브랜치 미리보기](https://jinro-on-git-develop-faitruees-projects.vercel.app)
- **구현 순서:** [노션 바로가기](https://www.notion.so/3679a6af2b478008a158eb672dde7b83)
- **Figma 디자인:** [Figma 바로가기](https://www.figma.com/design/bnMgmSntJGcQ2ePNab7UWT)

## 🛠 Tech Stack

| 구분 | 사용 기술 |
|---|---|
| Framework | React 19, TypeScript |
| Build | Vite |
| Styling | Tailwind CSS (Material Design 3 기반 커스텀 토큰) |
| 상태 관리 | Zustand (`useAuthStore`, `useExplorationStore`) |
| HTTP | Axios (JWT 자동 갱신) |
| Routing | React Router |
| 검증 | Node 테스트 러너(API 계약), Playwright(화면 흐름) |
| 배포 | Vercel (`main` → 프로덕션, `develop` → 미리보기) |

## 🧭 화면

| 화면 | 경로 |
|---|---|
| 메인 | `/` |
| 로그인 · 회원가입 · 비밀번호 찾기 | `/auth/login` · `/auth/signup` · `/auth/find-password` |
| 진단 안내 | `/diagnosis/exploration` |
| 진단 문항 (단계별 진행 · 이어하기 · 중단) | `/diagnosis/exploration/session/:sessionId` |
| 결과 — 전공군 · 전공 · 근거 · 전체 후보 · AI 전공 설명 | `/analysis/exploration/:sessionId` |
| 전공 비교 (2개) | `/analysis/exploration/:sessionId/compare` |
| 탐색 활동 | `/analysis/exploration/:sessionId/activities` |
| AI 상담 | `/analysis/exploration/:sessionId/ask` |
| 12주 탐색 계획 | `/analysis/exploration/:sessionId/plan` |
| 공유된 결과 (비로그인) | `/exploration/share/:token` |
| 마이페이지 — 프로필 · 관심 전공 · 진단 이력 | `/mypage` |
| 공지사항 | `/library` |
| 관리자 — 전공 · 공지 · 탐색 카탈로그 검토 | `/admin` · `/admin/exploration-catalogs` |

진단 화면은 다음 문항과 단계를 직접 계산하지 않습니다. 서버가 응답의 `nextAction`(`ANSWER` · `NEXT` · `ADVANCE` · `COMPLETE`)으로 알려 주는 대로 표시하고, 추천 순위도 서버가 준 값을 그대로 씁니다.

> 기존 진단(전공 진단 폼 → 성향 평가 → 역량 퀴즈) 화면 코드는 남아 있지만 쓰지 않습니다. `/diagnosis`, `/diagnosis/tendency` 등 기존 경로는 탐색 진단 안내로 이동하고, 백엔드도 기존 진단 API를 차단했습니다.

## 📂 Project Structure
```text
src/
 ├─ api/                      # axios 인스턴스 + 엔드포인트별 함수
 │   ├─ exploration.ts        #   탐색 진단 API (/exploration/v1)
 │   ├─ explorationAdmin.ts   #   관리자 탐색 카탈로그 API
 │   └─ exploration*Mock.ts   #   VITE_EXPLORATION_MOCK=true일 때 쓰는 mock 어댑터
 ├─ assets/                   # 이미지, 폰트 등 정적 파일
 ├─ components/layout/        # Header, Footer
 ├─ config/features.ts        # 기능 플래그
 ├─ hooks/                    # 커스텀 훅 (useExplorationResult 등)
 ├─ pages/
 │   ├─ Auth/                 # 로그인 · 회원가입 · 비밀번호 찾기
 │   ├─ Home/                 # 메인
 │   ├─ Diagnosis/Exploration/  # 진단 안내(Intro) · 문항(Question)
 │   ├─ Analysis/
 │   │   ├─ ExplorationResult/     # 결과
 │   │   ├─ ExplorationCompare/    # 전공 비교
 │   │   ├─ ExplorationActivities/ # 탐색 활동
 │   │   ├─ ExplorationAsk/        # AI 상담
 │   │   ├─ ExplorationPlan/       # 12주 계획
 │   │   └─ ExplorationShared/     # 공유된 결과
 │   ├─ MyPage/  Library/  Admin/  Error/
 │   └─ (기존 진단 화면: Diagnosis/Major·Tendency·Quiz·Loading, Analysis/Dashboard 등 — 사용 안 함)
 ├─ store/                    # Zustand 전역 상태 (use*Store.ts)
 ├─ styles/                   # global.css (Tailwind 기반)
 ├─ types/                    # TypeScript 타입 (exploration.ts 등)
 ├─ utils/
 └─ App.tsx                   # 라우팅
scripts/                      # API 계약 테스트 · Playwright 화면 점검
docs/                         # 연동 확인 기록
```

### 폴더 사용 규칙

| 작업 | 위치 |
|------|------|
| axios 인스턴스 및 API 호출 함수 작성 | `api/` |
| 헤더, 푸터 등 레이아웃 | `components/layout/` |
| 새 페이지 추가 | `pages/섹션명/페이지명/index.tsx` |
| 인증 관련 페이지 | `pages/Auth/페이지명/` |
| 진단 결과 관련 페이지 | `pages/Analysis/페이지명/` |
| 전역 상태 관리 | `store/use*Store.ts` |
| 커스텀 훅 | `hooks/use*.ts` |
| 타입, 인터페이스 정의 | `types/` |

> **주의사항**
> - 페이지 진입점은 반드시 `index.tsx`로 만드세요.
> - 컴포넌트 안에 axios를 직접 쓰지 말고, `api/`에 함수를 만들어 호출하세요.
> - 특정 페이지에서만 쓰는 컴포넌트는 `pages/섹션명/페이지명/components/`에 넣으세요.
> - 전역 상태는 반드시 store action을 통해서만 변경하세요.

## ⚙️ Getting Started

### Prerequisites
- Node.js (최신 LTS 버전 권장)

### Installation
```bash
# 저장소 복제
git clone https://github.com/JinroOn/JOFE.git
cd JOFE

# 의존성 설치
npm install
```

### Scripts

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 (http://localhost:5173) |
| `npm run build` | 타입 검사 + 프로덕션 빌드 |
| `npm run lint` | ESLint |
| `npm test` | API 계약 · 점수 표시 · 중단 · 계획 · 관리자 활동 회귀 테스트 |
| `npm run test:comparison-ui` · `test:history-ui` · `test:abandon-ui` | Playwright로 비교 · 이력 · 중단 화면 흐름 점검 |

> 백엔드 CORS 기본 허용 포트는 5173 · 4173입니다. 5173이 사용 중이라 Vite가 다른 포트로 뜨면 API 요청이 막힙니다.

## 🌐 Environment Variables

프로젝트 루트에 `.env` 파일을 만들고 필요한 값을 넣습니다.

```env
VITE_API_BASE_URL=https://52-78-58-82.sslip.io/api
VITE_FEATURE_EXPLORATION=true
VITE_EXPLORATION_MOCK=false
```

| 변수 | 기본값 | 설명 |
|---|---|---|
| `VITE_API_BASE_URL` | `https://52-78-58-82.sslip.io/api` | 백엔드 API 주소 |
| `VITE_FEATURE_EXPLORATION` | 꺼짐 | `true`여야 탐색 진단 · 결과 · 공유 · 관리자 카탈로그 화면이 열립니다. 꺼져 있으면 해당 경로가 다른 화면으로 이동합니다 |
| `VITE_EXPLORATION_MOCK` | 꺼짐 | `true`면 백엔드 없이 mock 어댑터로 탐색 화면을 확인합니다 |

백엔드에서 탐색 진단을 켜는 방법은 [JOBE README의 "탐색 진단 켜기"](https://github.com/JinroOn/JOBE#탐색-진단-켜기)를 참고하세요.

## 🔐 API 연동

인증 · 회원 · 전공 · 공지 API와 함께, 탐색 진단은 `src/api/exploration.ts`에서 아래 API를 씁니다. 모두 `/exploration/v1` 아래 경로입니다.

| 기능 | 엔드포인트 |
|---|---|
| 회차 시작 · 목록 · 조회 · 중단 | `POST /sessions` · `GET /sessions` · `GET /sessions/{id}` · `POST /sessions/{id}/abandon` |
| 문항 진행 | `POST /sessions/{id}/next` · `PUT /sessions/{id}/answers/{issuedId}` · `POST /sessions/{id}/advance` |
| 완료 · 결과 | `POST /sessions/{id}/complete` · `GET /sessions/{id}/result` |
| 전공 비교 | `GET /results/{id}/comparison` |
| 탐색 활동 · 결과 후 질문 | `GET /results/{id}/activities` · `/results/{id}/support` |
| 전공 자세히 보기 | `GET /majors/{code}/profile` |
| AI 상담 | `POST /results/{id}/consultations` · `POST /consultations/{id}/messages` |
| 12주 계획 | `POST · GET /results/{id}/plans` · `GET /plans/{id}` · `POST /plans/{id}/retry` |
| 결과 공유 | `GET · POST /results/{id}/share` · `POST /results/{id}/share/revoke` · `GET /shared-results/{token}` |

- 진행 중인 회차가 있으면 `POST /sessions`가 `409 EXPLORATION_IN_PROGRESS`와 기존 회차 id를 돌려주고, 화면은 그 회차로 이어갑니다.
- 답변 저장 · 단계 진행은 `revision`으로 충돌을 확인합니다. 다른 기기에서 먼저 바뀌었으면 최신 상태를 다시 불러와 확인하게 합니다.

---
© 2026 JinroOn · 영남대학교 종합설계
