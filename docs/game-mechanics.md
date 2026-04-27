# 게임 메커니즘 명세

Phase 1의 "퍼즐 메커니즘 정의"를 의사코드 수준으로 정리한 문서입니다.
실제 구현은 `src/lib/stores/gameStore.ts`와 `src/components/game/GameBoard.tsx`에서 시작합니다.

---

## 1. 보드와 좌표

- 좌표계: 좌상단 `(0, 0)` ~ 우하단 `(cols-1, rows-1)`.
- 보드는 `Cell[][]` 2차원 배열.
  ```ts
  type TileColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple';
  interface Cell {
    color: TileColor;
    id: string;        // 애니메이션 트래킹용 안정 키
    locked?: boolean;  // 장애물 등
  }
  ```
- 보드 변경은 항상 **불변 복사**로 — Zustand selector가 정확히 변경 감지.

---

## 2. 인터랙션 모델

### 2-1. 드래그 앤 드롭 (스왑)
- 인접 두 셀을 드래그로 교환.
- 교환 후 매칭이 없으면 자동 원위치(`AnimatePresence`로 흔들림 애니메이션).

### 2-2. 탭(부스터)
- ItemSlot에서 부스터 선택 → 보드 셀 탭 → 부스터 효과(같은 행 제거 등).
- 부스터 사용 시 `inventory.quantity -= 1` (서버에서 트랜잭션).

---

## 3. 핵심 알고리즘

### 3-1. `findMatches(board)` — 3매치 이상 좌표 집합

```ts
function findMatches(board: Cell[][]): Set<string> {
  const matches = new Set<string>();
  const cols = board[0].length;
  const rows = board.length;

  // 가로
  for (let r = 0; r < rows; r++) {
    let runColor = board[r][0].color;
    let runStart = 0;
    for (let c = 1; c <= cols; c++) {
      const same = c < cols && board[r][c].color === runColor;
      if (!same) {
        if (c - runStart >= 3) {
          for (let k = runStart; k < c; k++) matches.add(`${r},${k}`);
        }
        if (c < cols) {
          runColor = board[r][c].color;
          runStart = c;
        }
      }
    }
  }
  // 세로도 동일 로직
  // ...
  return matches;
}
```

### 3-2. `applyGravity(board, removed)` — 빈 칸 채우기
- 제거된 좌표 위쪽 셀들을 한 칸씩 아래로 내림.
- 가장 위 빈 칸은 새 랜덤 타일로 채움.

### 3-3. `resolveBoard(board)` — 연쇄 반응
1. `findMatches`로 매칭 좌표 산출.
2. 매칭 셀 제거 → `applyGravity`.
3. 매칭이 없을 때까지 반복 (콤보 카운트 증가).
4. 데드락(가능 매칭이 0인 보드) 감지 시 `shuffleBoard`.

### 3-4. `shuffleBoard(board)` — 데드락 해소
- 모든 셀의 색을 랜덤 섞기.
- 단, 즉시 매칭이 만들어지면 다시 셔플(최대 5회).

---

## 4. 점수 시스템

- **기본 점수**: 매칭당 `100 * matchSize`.
- **콤보 보너스**: 0.5초 내 연속 매칭 시 `1 + 0.2 * combo`.
- **시간 보너스**: 클리어 시 남은 초 × 50.
- **별점**: 점수 임계값 기준 1~3개 — 스테이지별로 `goal.thresholds`.

---

## 5. 가챠 알고리즘 (서버측 — `gacha-roll` Edge Function)

```
weights = { common: 60, rare: 30, epic: 9, legendary: 1 }
function rollOnce():
  total = sum(weights.values())
  pick = secureRandomInt(0, total)
  for rarity, w in weights:
    if pick < w: return rarity
    pick -= w
```

- `secureRandomInt`는 `crypto.getRandomValues`로 구현.
- 풀이 `premium`이면 가중치 테이블이 다름 (epic/legendary 비율 ↑).
- 결과 산출 후 `inventory` 증가 + `gacha_history` insert를 같은 트랜잭션에서 처리.

---

## 6. 검증 흐름 (치팅 방지)

1. 클라이언트는 액션 시퀀스(스왑·부스터 사용)와 시드(보드 초기화 시드)를 기록.
2. 게임 종료 시 시퀀스를 `validate-answer` Edge Function에 전송.
3. 서버는 동일 시드로 보드를 재구성하고 시퀀스를 재시뮬레이션 → 점수 산출.
4. 클라이언트가 보낸 점수와 ±0.0% 일치할 때만 `user_progress.best_score` 업데이트.
5. 불일치 시 `reports` 등록 + 누적 시 `is_blocked` 표시.

---

## 7. UX 디테일

- 매칭 시 화면 미세 진동(햅틱) + 사운드.
- 콤보 5+에서 보드 외곽 잔광 효과(`box-shadow`).
- 마지막 5초에서 타이머 색상이 빨강으로 전환 + tick 사운드.
- 클리어 시 별 갯수 애니메이션은 Framer Motion `staggerChildren`.
