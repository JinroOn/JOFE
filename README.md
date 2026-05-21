# 🚀 JinroOn (진로온) - Front-end

**JinroOn**은 수천 개의 학과 데이터와 실시간 취업 트렌드를 AI로 분석하여 학생들에게 최적의 전공 경로를 제안하는 맞춤형 전공 설계 플랫폼입니다. 이 프로젝트는 진로 탐색의 어려움을 해결하고, 데이터에 기반한 체계적인 진로 설계를 돕기 위해 시작되었습니다.

## 🔗 Quick Links
- **서비스 바로가기:** [https://jinro-on.vercel.app](https://jinro-on.vercel.app)
- **구현 순서:** [프론트엔드 구현순서](https://www.notion.so/3679a6af2b478008a158eb672dde7b83)
- **Figma 디자인:** [바로가기](https://www.figma.com/design/bnMgmSntJGcQ2ePNab7UWT)

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
 │   │   └─ components/
 │   ├─ Home/                 # 메인 페이지
 │   ├─ Diagnosis/            # 역량진단 섹션
 │   ├─ Analysis/             # 진로분석 결과 섹션
 │   │   ├─ Dashboard/
 │   │   ├─ WeakCapability/
 │   │   ├─ MajorExplore/
 │   │   └─ MajorCompare/
 │   ├─ Library/              # 자료실 섹션
 │   ├─ AiChat/               # AI 상담 채팅
 │   ├─ MyPage/               # 마이페이지
 │   ├─ Admin/                # 관리자
 │   └─ Error/                # 오류 안내
 ├─ store/                    # Zustand 전역 상태 (파일명: use*Store.ts)
 ├─ styles/                   # global.css (Tailwind 기반)
 ├─ types/                    # TypeScript 타입/인터페이스
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
VITE_API_BASE_URL=your_api_server_url
```

---
© 2024 JinroOn AI. Empowering the next generation of scholars.
