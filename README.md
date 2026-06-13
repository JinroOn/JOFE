# 🚀 JinroOn (진로온) - Front-end

**JinroOn**은 수천 개의 학과 데이터와 실시간 취업 트렌드를 AI로 분석하여 학생들에게 최적의 전공 경로를 제안하는 맞춤형 전공 설계 플랫폼입니다. 이 프로젝트는 진로 탐색의 어려움을 해결하고, 데이터에 기반한 체계적인 진로 설계를 돕기 위해 시작되었습니다.

## 🔗 Quick Links
- **프로덕션 (main):** [jinro-on.vercel.app](https://jinro-on.vercel.app)
- **스테이징 (develop):** [진행 중 브랜치 미리보기](https://jinro-on-git-develop-faitruees-projects.vercel.app)
- **구현 순서:** [노션 바로가기](https://www.notion.so/3679a6af2b478008a158eb672dde7b83)
- **Figma 디자인:** [Figma 바로가기](https://www.figma.com/design/bnMgmSntJGcQ2ePNab7UWT)

## 🛠 Tech Stack
- **Framework:** React 19 (TypeScript)
- **Build Tool:** Vite
- **Styling:** Tailwind CSS (Material Design 3 기반 커스텀 토큰)
- **HTTP Client:** Axios
- **전역 상태:** Zustand
- **Routing:** React Router DOM
- **Deployment:** Vercel

## 📂 Project Structure
```text
src/
 ├─ api/                      # axios 인스턴스 + 엔드포인트별 함수
 ├─ assets/                   # 이미지, 폰트 등 정적 파일
 ├─ components/
 │   ├─ common/               # Button, Input 등 공통 UI 컴포넌트
 │   └─ layout/               # Header, Footer 레이아웃
 ├─ hooks/                    # 커스텀 훅 (파일명: use*.ts)
 ├─ pages/
 │   ├─ Auth/                 # 인증 섹션 (로그인/회원가입 등)
 │   │   ├─ Login/
 │   │   ├─ Signup/
 │   │   ├─ FindPassword/
 │   │   ├─ components/       # AuthLayout, SessionModal
 │   │   └─ constants.ts      # 공통 입력 스타일, 유효성 검사 함수
 │   ├─ Home/                 # 메인 페이지
 │   ├─ Diagnosis/            # 역량진단 섹션 (전공진단, 성향평가, 퀴즈, 로딩)
 │   │   ├─ Major/            # 1단계: 전공 진단
 │   │   ├─ Tendency/         # 2단계: 성향 평가 (12문항 A/B)
 │   │   ├─ Quiz/             # 3단계: 역량 평가 퀴즈
 │   │   └─ Loading/          # 분석 로딩
 │   ├─ Analysis/             # 진로분석 결과 섹션
 │   │   ├─ Dashboard/
 │   │   ├─ SharedResult/     # 공유 결과 페이지
 │   │   ├─ WeakCapability/   # components/RadarChart.tsx (9축 듀얼 차트)
 │   │   ├─ MajorExplore/     # types.ts + components/ (RadarChart, MajorCard, DetailPanel, FilterContent)
 │   │   └─ MajorCompare/
 │   ├─ Library/              # 자료실 섹션
 │   ├─ AiChat/               # AI 상담 채팅 — types.ts + components/ (Sidebar, MessageList, InputArea)
 │   ├─ MyPage/               # 마이페이지
 │   ├─ Admin/                # 관리자
 │   └─ Error/                # 오류 안내
 ├─ store/                    # Zustand 전역 상태 (파일명: use*Store.ts)
 ├─ styles/                   # global.css (Tailwind 기반)
 ├─ types/                    # TypeScript 타입/인터페이스 (auth, user, major, consultation)
 └─ App.tsx                   # 루트 컴포넌트 (라우팅 설정)
```

### 폴더 사용 규칙

| 작업 | 위치 |
|------|------|
| axios 인스턴스 및 API 호출 함수 작성 | `api/` |
| 여러 페이지에서 공통으로 쓰는 컴포넌트 | `components/common/` |
| 헤더, 푸터, 사이드바 등 레이아웃 | `components/layout/` |
| 새 페이지 추가 | `pages/섹션명/페이지명/index.tsx` |
| 인증 관련 페이지 | `pages/Auth/페이지명/` |
| 진로분석 결과 관련 페이지 | `pages/Analysis/페이지명/` |
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

# 의존성 설치
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

## 🌐 Environment Variables
프로젝트 루트에 `.env` 파일을 생성하고 아래 변수를 설정해 주세요.
```env
VITE_API_BASE_URL=http://52.79.202.196:8080/api
```

> 설정하지 않으면 `http://52.79.202.196:8080/api` 로 자동 연결됩니다.

## 📋 화면 구현 현황

| 화면 | 상태 |
|------|------|
| 메인 페이지 (`/`) | 구현됨 |
| 로그인 (`/auth/login`) | API 연동 완료 |
| 회원가입 (`/auth/signup`) | API 연동 완료 (약관 동의 모달 + 이메일 인증 2단계) |
| 비밀번호 찾기 (`/auth/find-password`) | API 연동 완료 (Gmail SMTP 설정 필요) |
| 마이페이지 (`/mypage`) | API 연동 완료 (관심전공·프로필편집·비밀번호변경·회원탈퇴·누적진단횟수·마지막진단일, 즐겨찾기 404 자동 삭제) |
| 전공 진단 (`/diagnosis`) | API 연동 완료 (이어하기·새 진단, 스냅샷 자동저장) |
| 성향 평가 (`/diagnosis/tendency`) | API 연동 완료 (12문항 A/B, 9축 벡터 계산·저장) |
| 역량 평가 퀴즈 (`/diagnosis/quiz`) | API 연동 완료 (문항 그리드, 진행 바, 이전 단계 초기화 확인) |
| 분석 로딩 (`/diagnosis/loading`) | API 연동 완료 (세션 완료·진단결과·전공점수·플랜 생성 전체 흐름) |
| 공지사항·자료실 (`/library`) | API 연동 완료 |
| 학습 콘텐츠 (`/library/content`) | API 연동 완료 |
| AI 상담 채팅 (`/ai-chat`) | API 연동 완료 (세션/로그, AI 응답은 백엔드 미연동) |
| 전공 탐색 (`/diagnosis/explore`) | API 연동 완료 |
| 취약 역량 분석 (`/analysis/weak`) | API 연동 완료 (역량벡터·TOP3·레이더차트·12주 로드맵) |
| 전공 시뮬레이션 (`/analysis/compare`) | API 연동 완료 |
| 결과 대시보드 (`/analysis/dashboard`) | API 연동 완료 (진단결과·전공점수·AI 코멘트 생성) |
| 공유 결과 (`/analysis/shared/:id`) | 구현됨 |
| 관리자 (`/admin`) | API 연동 완료 (전공 관리 CRUD, 대시보드 통계는 목업) |

## 🔐 API 연동 현황

### Auth (`src/api/auth.ts`)

| 기능 | 메서드 | 엔드포인트 |
|------|--------|------------|
| 회원가입 | POST | `/auth/signup` |
| 로그인 | POST | `/auth/login` |
| 토큰 갱신 | POST | `/auth/refresh` |
| 로그아웃 | POST | `/auth/logout` |
| 비밀번호 변경 | POST | `/auth/password` |
| 비밀번호 재설정 코드 발송 | POST | `/auth/password-resets` |
| 비밀번호 재설정 확인 | POST | `/auth/password-resets/confirm` |
| 이메일 인증 코드 발송 | POST | `/auth/email-verifications` |
| 이메일 인증 확인 | POST | `/auth/email-verifications/confirm` |

> 이메일 인증(`email-verifications`)은 **가입 완료 후** 호출합니다. 회원가입 플로우: 폼 제출 → 계정 생성 → 이메일 인증 코드 발송 → 6자리 코드 입력 확인 → 로그인 페이지.

### User (`src/api/user.ts`)

| 기능 | 메서드 | 엔드포인트 |
|------|--------|------------|
| 내 정보 조회 | GET | `/users/me` |
| 내 정보 수정 (닉네임·아바타) | PATCH | `/users/me` |
| 회원 탈퇴 | DELETE | `/users/me` |
| 관심 전공 목록 | GET | `/users/me/favorites` |
| 관심 전공 삭제 | DELETE | `/users/favorites/{id}` |

### Consultation (`src/api/consultation.ts`)

| 기능 | 메서드 | 엔드포인트 |
|------|--------|------------|
| 내 세션 목록 | GET | `/consultations/sessions/me` |
| 세션 생성 | POST | `/consultations/sessions` |
| 세션 로그(대화 내역) | GET | `/consultations/sessions/{id}/logs` |
| 메시지 저장 | POST | `/consultations/logs` |
| 세션 종료 | POST | `/consultations/sessions/{id}/end` |

### Major (`src/api/major.ts`)

| 기능 | 메서드 | 엔드포인트 |
|------|--------|------------|
| 전공 목록 | GET | `/majors` |
| 전공 단건 조회 | GET | `/majors/{id}` |
| 전공 생성 (관리자) | POST | `/majors` |
| 전공 수정 (관리자) | PUT | `/majors/{id}` |
| 전공 삭제 (관리자) | DELETE | `/majors/{id}` |

### Diagnosis (`src/api/diagnosis.ts`)

| 기능 | 메서드 | 엔드포인트 |
|------|--------|------------|
| 세션 생성 | POST | `/diagnoses/sessions` |
| 세션 업데이트 | PATCH | `/diagnoses/sessions/{id}` |
| 세션 삭제 | DELETE | `/diagnoses/sessions/{id}` |
| 진행 중 세션 조회 | GET | `/diagnoses/sessions/me/in-progress` |
| 내 세션 목록 | GET | `/diagnoses/sessions/me` |
| 문제 목록 조회 | GET | `/diagnoses/questions` |
| 객관식 답변 저장 | POST | `/diagnoses/exam-answers` |
| 서술형 답변 저장 | POST | `/diagnoses/essay-answers` |
| 역량 점수 계산 | POST | `/diagnoses/sessions/{id}/score` |

### Results (`src/api/results.ts`)

| 기능 | 메서드 | 엔드포인트 |
|------|--------|------------|
| 진단 결과 생성 | POST | `/results` |
| 내 진단 결과 목록 | GET | `/results/me` |
| 전공별 점수 생성 | POST | `/results/major-scores` |
| 전공별 점수 목록 | GET | `/results/{resultId}/major-scores` |
| AI 코멘트 생성 | POST | `/results/{id}/ai-comment` |

### Plan (`src/api/plan.ts`)

| 기능 | 메서드 | 엔드포인트 |
|------|--------|------------|
| 플랜 생성 | POST | `/plans` |
| 결과별 플랜 목록 | GET | `/plans/results/{resultId}` |
| 플랜 아이템 목록 | GET | `/plans/{planId}/items` |
| 플랜 아이템 완료 | PATCH | `/plans/items/{id}/complete` |

---
© 2026 JinroOn AI. Empowering the next generation of scholars.
