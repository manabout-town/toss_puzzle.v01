# 기술 스택 결정 근거

각 선택지를 "왜 이걸 골랐는가 / 어떻게 쓸 것인가"로 정리합니다.
가이드의 표를 그대로 따르되, 실제 프로젝트에 적용되는 디테일을 덧붙였습니다.

---

## Frontend — Next.js (App Router) + TypeScript

**왜?**
- Server Components/Route Handlers로 점수 검증 같은 민감 로직을 클라이언트와 분리.
- 정적 export(`output: 'export'`)로 Capacitor 번들 가능.
- Vercel 무료 호스팅으로 웹 데모와 어드민도 함께 운영.

**어떻게 쓰는가**
- 게임 화면처럼 빈번한 상호작용은 Client Component로.
- 점수/가챠 검증은 항상 Route Handler 또는 Edge Function.
- `typedRoutes`로 라우트 오타 방지.

---

## Backend — Supabase (Auth / Postgres / Edge Functions)

**왜?**
- RLS 한 번 잘 잡으면 클라이언트 SDK만으로도 안전하게 SELECT 가능.
- Auth(소셜/Apple/Anonymous)·Storage·Edge Functions가 한 번에 묶여 있음.
- Postgres 그대로 쓰므로 SQL 학습 곡선이 자연스러움.

**어떻게 쓰는가**
- 모든 테이블에 RLS 활성화.
- 변경이 필요한 비즈니스 로직(점수 검증, 가챠, 탈퇴)은 Edge Function.
- `supabase gen types typescript`로 DB 스키마 → TS 타입 자동화.

---

## Animation — Framer Motion

**왜?**
- React에 자연스럽게 녹는 spring/keyframe.
- `layoutId`로 탭 인디케이터·카드 전환 같은 공유 요소 모션이 쉬움.

**어떻게 쓰는가**
- 게임 보드 매칭 시 타일 팝/낙하 애니메이션 — `AnimatePresence`.
- 탭 전환 인디케이터 — `layoutId="tab-indicator"`.
- 단순 CSS 트랜지션으로 충분한 곳은 Tailwind에 위임 → 번들 사이즈 관리.

---

## State — Zustand

**왜?**
- 게임 보드처럼 자주 갱신되는 상태에 redux 보일러플레이트가 부담.
- Provider 없이 import만으로 store 사용 — 모바일 번들에 유리.

**어떻게 쓰는가**
- 도메인별 store 분리(`gameStore`, `userStore`, `toastStore`).
- selector로 필요한 슬라이스만 구독해 리렌더 최소화.
- 게임 루프(`requestAnimationFrame`)는 store 메서드만 호출.

---

## Mobile — Capacitor (iOS / Android)

**왜?**
- 웹 빌드를 그대로 패키징 → 코드 1벌로 iOS/Android.
- Plugin 시스템으로 Haptics, StatusBar, Preferences 등 네이티브 기능 활용.
- 앱인토스의 미니앱 패키징 흐름과도 호환.

**어떻게 쓰는가**
- `next build && next export` → `out/` → `npx cap sync`.
- 햅틱/사운드/안전영역은 Phase 3 문서 참고.
- 푸시는 출시 후 별도 검토(Capacitor Push Notifications + Supabase 트리거).

---

## Audio — Howler.js

**왜?**
- 모바일 자동재생 정책 회피, 동시 재생 채널 관리, 모바일 음소거 토글 등 기본 처리.
- iOS Safari에서도 안정적인 재생 보장.

**어떻게 쓰는가**
- 첫 인터랙션 시 `Howler.ctx.resume()`.
- BGM/SFX 풀을 `src/lib/audio/soundManager.ts`에서 단일화.
- 백그라운드 진입 시 자동 일시정지(Capacitor App 이벤트).

---

## 그 외 도구

| 도구 | 용도 |
| --- | --- |
| Tailwind CSS | 디자인 토큰 + 빠른 반복. safe-area 토큰까지 통합. |
| Zod | 입력 검증(가챠 풀, 점수 페이로드). |
| ESLint + TypeScript | 빌드 시점에 회귀 잡기. |
| Supabase CLI | 마이그레이션·타입 생성·로컬 DB 부팅. |
