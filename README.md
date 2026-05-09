# 🚀 JinroOn (진로온) - Front-end

**JinroOn**은 수천 개의 학과 데이터와 실시간 취업 트렌드를 AI로 분석하여 학생들에게 최적의 전공 경로를 제안하는 맞춤형 전공 설계 플랫폼입니다. 이 프로젝트는 진로 탐색의 어려움을 해결하고, 데이터에 기반한 체계적인 진로 설계를 돕기 위해 시작되었습니다.

## 🔗 Quick Links
- **서비스 바로가기:** [https://jinro-on.vercel.app](https://jinro-on.vercel.app)

## 🛠 Tech Stack
- **Framework:** React 19 (TypeScript)
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios
- **Deployment:** Vercel

## 📂 Project Structure
```text
src/
 ├─ api/                  # API 호출 함수 (axios 인스턴스, 엔드포인트별 함수)
 ├─ assets/               # 이미지, 폰트 등 정적 파일
 ├─ components/
 │   ├─ common/           # 버튼, 인풋 등 여러 페이지에서 쓰는 공통 UI
 │   └─ layout/           # Header, Footer 등 레이아웃 컴포넌트
 ├─ hooks/                # 커스텀 React Hooks (파일명: use*.ts)
 ├─ pages/
 │   └─ PageName/
 │       ├─ index.tsx     # 페이지 진입점
 │       └─ components/  # 해당 페이지에서만 쓰는 컴포넌트 (선택)
 ├─ styles/               # 전역 스타일 및 Tailwind 설정
 ├─ types/                # TypeScript 타입/인터페이스 정의
 └─ App.tsx               # 루트 컴포넌트 (라우팅 설정)
```

### 폴더 사용 규칙

| 작업 | 위치 |
|------|------|
| axios 인스턴스 및 API 호출 함수 작성 | `api/` |
| 여러 페이지에서 공통으로 쓰는 컴포넌트 | `components/common/` |
| 헤더, 푸터, 사이드바 등 레이아웃 | `components/layout/` |
| 새 페이지 추가 | `pages/페이지명/index.tsx` |
| useState/useEffect 묶은 커스텀 훅 | `hooks/` |
| 타입, 인터페이스 정의 | `types/` |

> **주의사항**
> - 페이지는 반드시 `pages/페이지명/` 폴더로 만들고 `index.tsx`를 진입점으로 사용하세요.
> - 컴포넌트 안에 axios를 직접 쓰지 말고, `api/`에 함수를 만들어 호출하세요.
> - 특정 페이지에서만 쓰는 컴포넌트는 `pages/페이지명/components/`에 넣으세요.

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
