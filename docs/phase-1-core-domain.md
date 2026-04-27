# Phase 1 — 핵심 도메인 및 백엔드 설계

이 단계의 목표는 **서비스의 코어 루프**(스테이지 진입 → 플레이 → 점수/보상 → 다음 스테이지)를
재현 가능한 데이터 구조와 코드로 정착시키는 것입니다.
세부 SQL은 [data-model.md](data-model.md), 게임 로직은 [game-mechanics.md](game-mechanics.md) 참고.

---

## 1. 퍼즐 메커니즘 정의

### 1-1. 코어 메커닉
- **드래그 앤 드롭 기반 타일 매칭**: 동일 색상/모양 3개 이상이 인접하면 매칭 성공.
- **격자 크기**: 기본 6×6 (스테이지 단위로 `stages.board_config.cols/rows`로 가변).
- **턴제가 아닌 실시간**: 60초 타이머 + 콤보 보너스.
- **승리 조건**: 스테이지가 정의한 `goal`(예: 빨강 타일 30개 제거)을 시간 안에 달성.

### 1-2. 알고리즘 설계 노트
1. **매칭 검사**: 보드 변경 시 `findMatches(board)` → 가로/세로 3-매치 이상 좌표 집합 반환.
2. **드롭 시뮬레이션**: 매칭 좌표 제거 → 위에서 아래로 중력 적용 → 빈 칸을 새 타일로 채움 → 다시 1로.
3. **데드락 방지**: 보드에 가능 매칭이 없으면 자동 셔플(`shuffleBoard`).
4. **점수 공식**: `base * matchSize * comboMultiplier(1 + 0.2 * combo)`. 콤보는 0.5초 내 연속 매칭으로 누적.
5. **검증은 서버**: 클라이언트에서 계산한 점수는 신뢰하지 않습니다. `validate-answer` Edge Function이
   최종 보드/액션 시퀀스를 받아 재계산 → DB에 기록.

상세 의사코드: [game-mechanics.md](game-mechanics.md).

---

## 2. 데이터 모델링 (Supabase)

핵심 테이블 5종 — 정규화·확장성·RLS 친화 형태.

| 테이블 | 역할 | 핵심 컬럼 |
| --- | --- | --- |
| `profiles` | 인증 사용자 1:1 매핑, 닉네임/본인인증 상태 | `id`, `nickname`, `is_verified`, `is_blocked` |
| `stages` | 스테이지 메타와 보드 구성 | `id`, `chapter`, `order_in_chapter`, `goal`, `board_config`, `time_limit_sec` |
| `user_progress` | 유저별 스테이지 클리어 상태/최고 점수 | `user_id`, `stage_id`, `best_score`, `stars`, `cleared_at` |
| `inventory` | 유저가 보유한 아이템(부스터·스킨 등) 수량 | `user_id`, `item_code`, `quantity` |
| `gacha_history` | 가챠 결과 영구 기록(분쟁/환불 대응) | `user_id`, `pool`, `result_item_code`, `rarity`, `cost`, `created_at` |
| `reports` | UGC 신고 내역 (Phase 5에서 본격 사용) | `reporter_id`, `target_type`, `target_id`, `reason`, `status` |

ERD와 SQL 전문은 [data-model.md](data-model.md), 마이그레이션은 `supabase/migrations/0001_initial_schema.sql` 참고.

---

## 3. v0 기반 UI 퍼블리싱

v0(혹은 디자이너 핸드오프)에서 받은 UI를 다음 컴포넌트로 분해해 구현합니다.

```
src/components/game/
├── GameBoard.tsx        # 6x6 그리드, 드래그 핸들러, 매치 애니메이션
├── Scoreboard.tsx       # 상단 점수/타이머/목표
├── ItemSlot.tsx         # 사용 가능한 부스터 슬롯 (탭 시 발동)
└── Timer.tsx            # 시각적 진행 바 (Framer Motion)
```

가이드라인:
- **모든 인터랙션은 `active:scale-95` + 햅틱**.
- **터치 우선** 이벤트 — `pointerdown/up/move`로 통일해 마우스/터치 모두 대응.
- 보드 셀은 절대 위치 + `transform`으로 이동 → 리렌더 비용 최소화.

---

## 4. 상태 관리 설계 (Zustand)

전역 store는 도메인별로 분리합니다.

```
src/lib/stores/
├── gameStore.ts   # 보드 상태, 점수, 콤보, 타이머
├── userStore.ts   # 로그인 유저, 인벤토리 캐시
└── toastStore.ts  # 글로벌 토스트 알림 큐
```

핵심 원칙:
- **게임 루프와 React 렌더 분리**: `requestAnimationFrame` 기반 게임 루프는 store 메서드만 호출. 렌더는 selector로 필요한 슬라이스만 구독.
- **immer 미사용**: 가벼운 상태이므로 직접 spread.
- **persist는 부분만**: 진행 중인 게임 보드는 저장하지 않고, 마지막 활성 스테이지 ID 정도만 `Capacitor Preferences`에 저장.

코드 골격은 `src/lib/stores/gameStore.ts` 참고.

---

## 5. 가챠(Gacha) 시스템

### 5-1. 확률 공시
앱스토어/플레이스토어 정책상 **확률을 사용자에게 공개**해야 합니다.
- 페이지: `src/app/shop/page.tsx`의 "확률 보기" 모달
- 환경 변수 `NEXT_PUBLIC_GACHA_DISPLAY_RATES`는 표시 전용. 실제 확률은 서버 측 상수.

### 5-2. 서버 검증
가챠 뽑기는 항상 Edge Function에서 결정합니다.

```
supabase/functions/gacha-roll/index.ts
- 입력: { pool: 'standard' | 'premium', count: 1 | 10 }
- 처리:
  1. profiles.is_blocked 차단 검사
  2. 인벤토리에서 비용 차감 (트랜잭션)
  3. 서버 측 PRNG로 결과 산출 (rarity별 가중치 합산)
  4. inventory 증가 + gacha_history insert
  5. 결과 반환
```

### 5-3. 히스토리/분쟁 대응
- 모든 결과는 `gacha_history`에 영속화 — 사용자 문의/분쟁 시 추적 가능.
- 마이페이지에서 본인 히스토리 조회 가능 (`src/app/my/page.tsx` → "가챠 기록").
