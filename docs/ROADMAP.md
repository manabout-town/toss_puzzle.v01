# Toss Puzzle — 통합 로드맵

> 원본 가이드(`Toss_Puzzle_Full_Reference_Guide.pdf`)의 5개 Phase를 그대로 옮기고,
> 각 항목에 담당 디렉토리/파일 포인터를 더해 실행 가능한 체크리스트로 만들었습니다.
> 항목을 완료하면 `[x]`로 바꿔주세요.

---

## Phase 1 — 핵심 도메인 및 백엔드 설계
세부 명세: [phase-1-core-domain.md](phase-1-core-domain.md)

- [ ] **퍼즐 메커니즘 정의**: 드래그 앤 드롭, 타일 매칭 등 핵심 게임 로직 확정 및 알고리즘 설계
  - 산출물: `docs/game-mechanics.md`, `src/lib/stores/gameStore.ts`
- [ ] **데이터 모델링 (Supabase)**: Stages, User_Progress, Inventory 등 정규화된 테이블 구조 설계
  - 산출물: `docs/data-model.md`, `supabase/migrations/0001_initial_schema.sql`
- [ ] **v0 기반 UI 퍼블리싱**: 게임 보드, 상단 스코어보드, 아이템 슬롯 등 핵심 UI 컴포넌트 생성
  - 산출물: `src/components/game/GameBoard.tsx`, `Scoreboard.tsx`, `ItemSlot.tsx`
- [ ] **상태 관리 설계 (Zustand)**: 게임판 데이터, 타이머, 실시간 점수를 관리할 전역 Store 구축
  - 산출물: `src/lib/stores/gameStore.ts`
- [ ] **가챠(Gacha) 시스템**: 보상 아이템 획득 확률 공지 페이지 및 결과 저장 히스토리 로직 설계
  - 산출물: `supabase/functions/gacha-roll/index.ts`, `src/app/shop/page.tsx`

---

## Phase 2 — 인프라 및 보안 강화 (Supabase)
세부 명세: [phase-2-infrastructure.md](phase-2-infrastructure.md)

- [ ] **Auth 연동**: Google/카카오 소셜 로그인 및 게스트 로그인 세팅
  - 산출물: `src/app/login/page.tsx`, `src/lib/supabase/client.ts`
- [ ] **RLS 정책 설정**: 유저별 데이터 접근 제어 및 보안 정책(Row Level Security) 전수 점검
  - 산출물: `supabase/migrations/0002_rls_policies.sql`
- [ ] **서버 액션 정리**: 정답 검증 로직, 에러 핸들링, 사용자 토스트 알림 통합 관리
  - 산출물: `src/app/api/score/route.ts`, `supabase/functions/validate-answer/index.ts`
- [ ] **자동 저장 트리거**: 회원가입 시 프로필 자동 생성 및 본인인증 데이터(`is_verified`) 처리 로직
  - 산출물: `supabase/migrations/0003_triggers.sql`

---

## Phase 3 — 모바일 앱 전용 UI/UX 전환
세부 명세: [phase-3-mobile-uiux.md](phase-3-mobile-uiux.md)

- [ ] **하단 탭 바 구현**: Home, Ranking, Shop, My 구성 및 활성 탭 인디케이터 적용
  - 산출물: `src/components/layout/BottomTabBar.tsx`
- [ ] **세이프 에어리어 대응**: `pt-safe`, `pb-safe` 적용으로 노치 및 홈 바 디자인 회피
  - 산출물: `src/components/layout/SafeAreaWrapper.tsx`, `src/app/globals.css`
- [ ] **앱 인터랙션 최적화**: `active:scale-95` 피드백, 햅틱 진동 연동, 웹 전용 효과(`hover` 등) 제거
  - 산출물: `src/lib/audio/soundManager.ts`, `src/components/ui/Button.tsx`
- [ ] **로딩 최적화**: 페이지 전환 시 Skeleton UI 적용 및 이미지 Lazy Loading 처리
  - 산출물: `src/components/ui/Skeleton.tsx`

---

## Phase 4 — 운영 및 관리자 기능
세부 명세: [phase-4-operations.md](phase-4-operations.md)

- [ ] **관리자 전용 화면**: 스테이지 데이터 수정, 유저 제재(차단), 신고 내역 확인 대시보드
  - 산출물: `src/app/admin/page.tsx`
- [ ] **고객센터 연동**: 앱 내 문의하기 채널 및 FAQ 섹션 구현
  - 산출물: `src/app/my/page.tsx` (FAQ 섹션 포함)

---

## Phase 5 — 앱스토어 심사 및 출시 준비
세부 명세: [phase-5-launch.md](phase-5-launch.md), [app-store-checklist.md](app-store-checklist.md)

- [ ] **회원 탈퇴 기능**: 마이페이지 내 즉시 탈퇴 기능 및 데이터 파기 정책 자동화
- [ ] **UGC 정책 준수**: 부적절한 유저/댓글 신고 및 차단(Block) 기능 구현
- [ ] **법적 문서 연결**: 이용약관 및 개인정보처리방침 페이지 구축
- [ ] **Apple 로그인**: iOS 출시를 위한 Sign in with Apple 필수 연동

---

## 핵심 기술 스택 (Tech Stack)

| 영역 | 선택 | 결정 근거 |
| --- | --- | --- |
| Frontend | Next.js (App Router) + TypeScript | 서버 액션·라우트 핸들러로 검증 로직을 안전하게 분리 |
| Backend | Supabase (Auth / Postgres / Edge Functions) | RLS로 클라이언트 단 보안 + 빠른 인프라 |
| Animation | Framer Motion | 타일 팝/셔플 등 게임 UX의 자연스러운 모션 |
| State | Zustand | 게임 보드처럼 자주 갱신되는 상태에 가벼운 store |
| Mobile | Capacitor (iOS / Android) | 앱인토스 미니앱 패키징 + 햅틱·StatusBar 플러그인 |
| Audio | Howler.js | SFX/BGM 동시 제어와 모바일 자동 재생 정책 대응 |

세부 근거는 [tech-stack.md](tech-stack.md) 참고.
