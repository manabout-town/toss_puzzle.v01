// ─────────────────────────────────────────────────────────────────────
// engine.ts — Toss Puzzle 게임 엔진 (React 비의존, 순수 함수)
//
// 클라이언트와 서버(`validate-answer` Edge Function)가 동일하게 import 해
// 동일한 결과를 도출해야 합니다. 따라서 외부 상태(전역, 시간, Math.random)에
// 의존하지 않고, 모든 무작위성은 인자로 받은 RNG로 처리합니다.
//
// 좌표 규칙: board[row][col]. 좌상단 (0,0).
// ─────────────────────────────────────────────────────────────────────

import { mulberry32, hashSeed, type RNG } from './rng';
import type { Cell, TileColor } from '@/types/game';

export const DEFAULT_COLORS: TileColor[] = [
  'red',
  'blue',
  'green',
  'yellow',
  'purple',
];

export interface Coord {
  r: number;
  c: number;
}

export interface BoardSize {
  cols: number;
  rows: number;
}

export interface ResolveResult {
  /** 매칭이 발생한 횟수(=콤보). 0이면 아무 일도 일어나지 않음. */
  combos: number;
  /** 이번 resolve로 누적된 점수. */
  scoreDelta: number;
  /** 매번 단계별 보드 스냅샷 (애니메이션용, 선택 사용). */
  steps: Cell[][][];
  /** 이번에 제거된 셀 좌표 집합 (per-step). */
  removedSteps: Coord[][];
}

let cellIdSeq = 0;
function nextCellId(rng: RNG): string {
  // 결정적 ID — 시드가 같으면 ID도 같아 서버 검증 시 비교가 단순해짐.
  cellIdSeq = (cellIdSeq + 1) >>> 0;
  return `c${Math.floor(rng() * 1e9).toString(36)}_${cellIdSeq.toString(36)}`;
}

function makeCell(rng: RNG, colors: TileColor[]): Cell {
  return {
    color: colors[Math.floor(rng() * colors.length)],
    id: nextCellId(rng),
  };
}

/**
 * 시드로 결정적 보드를 생성합니다. 즉시 매칭이 발생하지 않을 때까지 재시도해
 * "시작 보드는 매칭이 없는" 정상 상태를 보장합니다.
 */
export function createBoard(
  size: BoardSize,
  seed: string,
  colors: TileColor[] = DEFAULT_COLORS,
): Cell[][] {
  const baseRng = mulberry32(hashSeed(seed));
  for (let attempt = 0; attempt < 100; attempt++) {
    const rng = mulberry32(hashSeed(seed) + attempt);
    cellIdSeq = 0;
    const board: Cell[][] = [];
    for (let r = 0; r < size.rows; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < size.cols; c++) {
        row.push(makeCell(rng, colors));
      }
      board.push(row);
    }
    if (findMatches(board).size === 0) return board;
    // baseRng를 한 번 호출해 시도 분기를 분산
    baseRng();
  }
  // 그래도 매칭이 있으면 일단 반환 (resolve가 처리)
  return createRawBoard(size, seed, colors);
}

function createRawBoard(
  size: BoardSize,
  seed: string,
  colors: TileColor[],
): Cell[][] {
  const rng = mulberry32(hashSeed(seed));
  cellIdSeq = 0;
  const board: Cell[][] = [];
  for (let r = 0; r < size.rows; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < size.cols; c++) row.push(makeCell(rng, colors));
    board.push(row);
  }
  return board;
}

/**
 * 가로/세로로 같은 색 3개 이상 연속한 셀의 좌표를 반환합니다.
 * 키는 "r,c" 문자열(Set 사용 편의).
 */
export function findMatches(board: Cell[][]): Set<string> {
  const matches = new Set<string>();
  const rows = board.length;
  if (rows === 0) return matches;
  const cols = board[0].length;

  // 가로
  for (let r = 0; r < rows; r++) {
    let runStart = 0;
    for (let c = 1; c <= cols; c++) {
      const ended = c === cols || board[r][c].color !== board[r][runStart].color;
      if (ended) {
        if (c - runStart >= 3) {
          for (let k = runStart; k < c; k++) matches.add(`${r},${k}`);
        }
        runStart = c;
      }
    }
  }
  // 세로
  for (let c = 0; c < cols; c++) {
    let runStart = 0;
    for (let r = 1; r <= rows; r++) {
      const ended = r === rows || board[r][c].color !== board[runStart][c].color;
      if (ended) {
        if (r - runStart >= 3) {
          for (let k = runStart; k < r; k++) matches.add(`${k},${c}`);
        }
        runStart = r;
      }
    }
  }
  return matches;
}

/**
 * 매칭된 좌표를 제거하고 위쪽 셀을 떨어뜨려 빈 칸을 새 타일로 채웁니다.
 * 보드의 새 복사본을 반환합니다 (불변).
 */
export function applyGravity(
  board: Cell[][],
  removed: Set<string>,
  rng: RNG,
  colors: TileColor[] = DEFAULT_COLORS,
): Cell[][] {
  const rows = board.length;
  const cols = board[0].length;
  const next: (Cell | null)[][] = board.map((row) =>
    row.map((cell, c) => (removed.has('') ? cell : cell)),
  );

  // 1) 제거 표시
  for (const key of removed) {
    const [r, c] = key.split(',').map(Number);
    next[r][c] = null;
  }

  // 2) 열별로 위에서 아래로 압축
  for (let c = 0; c < cols; c++) {
    let writeRow = rows - 1;
    for (let r = rows - 1; r >= 0; r--) {
      if (next[r][c] !== null) {
        if (r !== writeRow) {
          next[writeRow][c] = next[r][c];
          next[r][c] = null;
        }
        writeRow--;
      }
    }
    // 3) 빈 칸 새 타일로 채움
    for (let r = writeRow; r >= 0; r--) {
      next[r][c] = makeCell(rng, colors);
    }
  }

  return next as Cell[][];
}

/**
 * 매칭이 더 발생하지 않을 때까지 매칭 제거 + 중력을 반복합니다.
 * 콤보(연쇄 횟수)와 누적 점수를 반환합니다.
 */
export function resolveBoard(
  initial: Cell[][],
  rng: RNG,
  colors: TileColor[] = DEFAULT_COLORS,
): { board: Cell[][]; result: ResolveResult } {
  let board = initial;
  let combos = 0;
  let scoreDelta = 0;
  const steps: Cell[][][] = [];
  const removedSteps: Coord[][] = [];

  // 안전 상한 — 정상 RNG에서는 보드 크기보다 한참 적게 종료되지만,
  // 외부 호출 실수로 단일 색 fill 등을 넣어도 무한 루프에 빠지지 않도록 보호.
  const MAX_CHAINS = 50;
  while (combos < MAX_CHAINS) {
    const matches = findMatches(board);
    if (matches.size === 0) break;
    combos += 1;
    // 점수: 100 * 매칭 셀 수 * (1 + 0.2 * (combo-1))
    scoreDelta += Math.floor(100 * matches.size * (1 + 0.2 * (combos - 1)));
    removedSteps.push(
      Array.from(matches).map((k) => {
        const [r, c] = k.split(',').map(Number);
        return { r, c };
      }),
    );
    board = applyGravity(board, matches, rng, colors);
    steps.push(board);
  }

  return { board, result: { combos, scoreDelta, steps, removedSteps } };
}

/**
 * 인접 두 셀을 교환했을 때 매칭이 생기는지 검사합니다.
 * 결과: 매칭이 생기면 true (스왑 통과), 없으면 false (롤백).
 */
export function isValidSwap(
  board: Cell[][],
  a: Coord,
  b: Coord,
): boolean {
  if (!areAdjacent(a, b)) return false;
  const test = board.map((row) => row.slice());
  const tmp = test[a.r][a.c];
  test[a.r][a.c] = test[b.r][b.c];
  test[b.r][b.c] = tmp;
  return findMatches(test).size > 0;
}

export function areAdjacent(a: Coord, b: Coord): boolean {
  const dr = Math.abs(a.r - b.r);
  const dc = Math.abs(a.c - b.c);
  return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
}

/**
 * 보드에 가능한 매칭 스왑이 하나라도 있는지 검사 (데드락 감지).
 */
export function hasAnyMove(board: Cell[][]): boolean {
  const rows = board.length;
  const cols = board[0].length;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (c + 1 < cols && isValidSwap(board, { r, c }, { r, c: c + 1 })) return true;
      if (r + 1 < rows && isValidSwap(board, { r, c }, { r: r + 1, c })) return true;
    }
  }
  return false;
}

/**
 * 데드락 시 보드를 섞어줍니다. 즉시 매칭이 없고 가능 매칭은 있는 상태가 될 때까지 반복.
 */
export function shuffleBoard(
  board: Cell[][],
  rng: RNG,
  colors: TileColor[] = DEFAULT_COLORS,
): Cell[][] {
  const rows = board.length;
  const cols = board[0].length;
  for (let attempt = 0; attempt < 20; attempt++) {
    // Fisher-Yates
    const flat = board.flat().map((c) => ({ ...c }));
    for (let i = flat.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = flat[i];
      flat[i] = flat[j];
      flat[j] = tmp;
    }
    const next: Cell[][] = [];
    for (let r = 0; r < rows; r++) next.push(flat.slice(r * cols, (r + 1) * cols));
    if (findMatches(next).size === 0 && hasAnyMove(next)) return next;
  }
  // 마지막 안전장치: 완전 새로 만들기
  return createBoard({ rows, cols }, 'shuffle-fallback', colors);
}
