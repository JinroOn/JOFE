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
 ├─ api/         # API 통신 설정 (Axios)
 ├─ components/  # 재사용 가능한 UI 컴포넌트
 ├─ hooks/       # 커스텀 React Hooks
 ├─ pages/       # 페이지 단위 컴포넌트
 ├─ styles/      # 전역 스타일 및 Tailwind 설정
 ├─ types/       # 타입스크립트 타입 정의
 └─ App.tsx      # 루트 컴포넌트
```

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
