# Toss Puzzle

> 앱인토스(미니앱) 출시를 목표로 하는 풀스택 퍼즐 게임 프로젝트.
> Toss Puzzle Full Reference Guide를 기반으로 5단계(Phase) 로드맵에 따라 구성되어 있습니다.

## 한눈에 보기

| 영역 | 기술 |
| --- | --- |
| Frontend | Next.js (App Router) + TypeScript + Tailwind CSS |
| State | Zustand |
| Animation | Framer Motion |
| Backend | Supabase (Auth / Postgres / Edge Functions / RLS) |
| Mobile | Capacitor (iOS / Android) — 앱인토스 미니앱 패키징 |
| Audio | Howler.js |

## 디렉토리 구조

```
tosspuzzle/
├── README.md                         # 본 파일
├── package.json                      # 의존성/스크립트
├── tsconfig.json                     # TypeScript 설정
├── next.config.mjs                   # Next.js 설정 (정적 export 옵션 포함)
├── tailwind.config.ts                # Tailwind + safe-area 토큰
├── postcss.config.mjs
├── capacitor.config.ts               # iOS/Android 패키징 설정
├── .env.example                      # 환경 변수 템플릿
├── .gitignore
│
├── docs/                             # 기획·설계 문서 모음
│   ├── ROADMAP.md                    # 5 Phase 통합 로드맵 (체크리스트)
│   ├── phase-1-core-domain.md        # 퍼즐 메커니즘·데이터 모델·v0 UI·Zustand·가챠
│   ├── phase-2-infrastructure.md     # Supabase Auth, RLS, 서버 액션, 트리거
│   ├── phase-3-mobile-uiux.md        # 탭 바, safe area, 햅틱, 스켈레톤
│   ├── phase-4-operations.md         # 관리자 화면, 고객센터
│   ├── phase-5-launch.md             # 회원 탈퇴, UGC, 약관, Apple 로그인
│   ├── tech-stack.md                 # 기술 스택 결정 근거
│   ├── data-model.md                 # Supabase 테이블/관계 명세
│   ├── game-mechanics.md             # 드래그앤드롭·매칭·점수·가챠 알고리즘
│   ├── app-store-checklist.md        # iOS/Android 심사 체크리스트
│   └── Toss_Puzzle_Full_Reference_Guide.pdf  # 원본 레퍼런스
│
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # 루트 레이아웃 + 탭 바
│   │   ├── page.tsx                  # Home (스테이지 선택)
│   │   ├── globals.css
│   │   ├── play/page.tsx             # 게임 플레이 화면
│   │   ├── ranking/page.tsx          # 랭킹
│   │   ├── shop/page.tsx             # 상점/가챠
│   │   ├── my/page.tsx               # 마이페이지
│   │   ├── login/page.tsx            # 소셜/Apple/게스트 로그인
│   │   ├── admin/page.tsx            # 관리자 대시보드
│   │   └── api/score/route.ts        # 점수 검증 API 라우트
│   ├── components/
│   │   ├── game/                     # GameBoard, Scoreboard, ItemSlot, Timer
│   │   ├── layout/                   # BottomTabBar, SafeAreaWrapper
│   │   ├── ui/                       # Skeleton, Button, Toast
│   │   ├── shop/                     # GachaModal, ItemCard
│   │   └── ranking/                  # RankRow
│   ├── lib/
│   │   ├── supabase/                 # client / server / middleware
│   │   ├── stores/                   # Zustand stores (game, user, toast)
│   │   ├── audio/                    # Howler 기반 사운드 매니저
│   │   └── utils.ts
│   ├── types/                        # database.ts (생성된 타입), game.ts
│   └── styles/                       # 추가 CSS 토큰
│
├── supabase/
│   ├── migrations/
│   │   ├── 0001_initial_schema.sql   # profiles / stages / user_progress / inventory / gacha_history
│   │   ├── 0002_rls_policies.sql     # Row Level Security 전수 적용
│   │   ├── 0003_triggers.sql         # 회원가입 시 프로필 자동 생성, updated_at 트리거
│   │   └── 0004_seed_stages.sql      # 초기 스테이지 시드
│   └── functions/
│       ├── validate-answer/index.ts  # 정답 서버 검증 Edge Function
│       └── gacha-roll/index.ts       # 가챠 확률 서버 검증 + 히스토리 저장
│
└── public/
    ├── icons/                        # 앱 아이콘 / 탭 아이콘
    └── sounds/                       # SFX/BGM
```

## 시작하기 (로컬)

```bash
# 1. 의존성 설치
pnpm install   # 또는 npm install / yarn

# 2. 환경 변수
cp .env.example .env.local
#  └─ NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY 설정

# 3. Supabase 마이그레이션 적용 (Supabase CLI 사용)
supabase db reset                # 로컬 DB 초기화
supabase db push                 # 원격에 적용

# 4. 개발 서버
pnpm dev
```

## 모바일 앱 빌드 (Capacitor)

```bash
pnpm build && pnpm export          # next.config의 output: 'export' 활용
pnpm cap sync ios                  # 또는 android
pnpm cap open ios                  # Xcode 열기 → 앱인토스 미니앱 패키징
```

## 진행 상황 추적

전체 작업 항목은 [docs/ROADMAP.md](docs/ROADMAP.md)에서 체크박스로 관리합니다.
세부 명세는 Phase별 문서를 참조하세요.

| Phase | 문서 | 핵심 산출물 |
| --- | --- | --- |
| 1 | [phase-1-core-domain.md](docs/phase-1-core-domain.md) | 게임 메커니즘 / DB 스키마 / Zustand / 가챠 |
| 2 | [phase-2-infrastructure.md](docs/phase-2-infrastructure.md) | Auth / RLS / 서버 액션 / 트리거 |
| 3 | [phase-3-mobile-uiux.md](docs/phase-3-mobile-uiux.md) | 탭 바 / safe area / 햅틱 / Skeleton |
| 4 | [phase-4-operations.md](docs/phase-4-operations.md) | 관리자 / 고객센터 |
| 5 | [phase-5-launch.md](docs/phase-5-launch.md) | 탈퇴 / UGC / 약관 / Apple 로그인 |

## 라이선스

내부 프로젝트. 외부 공개 전 약관 검토 필요.
# toss_puzzle.v01
