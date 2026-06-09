# JOFE (진로온 프론트엔드) — Claude 작업 가이드

## 프로젝트 개요
React 19 + TypeScript + Vite + Tailwind CSS 기반 SPA.  
백엔드: [JinroOn/JOBE](https://github.com/JinroOn/JOBE) (Spring Boot, base URL: `/api`)

## 브랜치 전략
- `main` — 프로덕션
- `develop` — 스테이징 (PR 베이스 브랜치)
- 작업 브랜치: `develop`에서 분기 → PR → `develop` 머지

## API 호출 규칙
- 모든 API 함수는 `src/api/auth.ts` 또는 도메인별 파일에 작성
- 컴포넌트 안에서 axios 직접 호출 금지 — 반드시 `api/` 함수를 통해 호출
- axios 인스턴스: `src/api/axios.ts`

## Auth API 구조 (JOBE PR #48 기준)

### 비밀번호 재설정 플로우 (FindPassword 페이지)
1. `POST /auth/password-resets` — `{ email }` → 6자리 코드 이메일 발송
2. 코드 입력 후 UI에서만 형식 검증 (별도 verify 엔드포인트 없음)
3. `POST /auth/password-resets/confirm` — `{ email, code, newPassword }` → 완료 + 전체 세션 만료

### 이메일 인증 플로우 (email-verifications)
- `POST /auth/email-verifications` — **이미 가입된 유저** 대상으로 인증 코드 발송
- `POST /auth/email-verifications/confirm` — `{ email, token }` → 인증 완료
- **회원가입 전에는 호출 불가** (백엔드에서 `USER_NOT_FOUND` 에러 발생)
- 가입 완료 후 별도 인증 화면에서 처리해야 함

### 회원가입 (Signup 페이지)
- `POST /auth/signup` 단일 호출로 완결 — 이메일 인증은 가입 후 별도 진행

## 커밋 / PR 규칙
- 커밋 메시지와 PR 본문에 `Co-Authored-By: Claude`, `Generated with Claude`, `🤖` 등 AI 관련 문구를 포함하지 않는다.
