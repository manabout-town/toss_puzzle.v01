import { create } from 'zustand';
import type { Cell, GameAction, TileColor } from '@/types/game';
import {
  DEFAULT_COLORS,
  applyGravity,
  areAdjacent,
  createBoard,
  findMatches,
  hasAnyMove,
  isValidSwap,
  resolveBoard,
  shuffleBoard,
  type Coord,
} from '@/lib/game/engine';
import { hashSeed, mulberry32, randomSeed, type RNG } from '@/lib/game/rng';
import { timeBonus } from '@/lib/game/scoring';

export type GameStatus = 'idle' | 'playing' | 'cleared' | 'failed';

export interface GameState {
  // 보드 / 진행
  board: Cell[][] | null;
  score: number;
  combo: number;
  timeLeft: number;
  status: GameStatus;

  // 검증 / 재현용
  seed: string | null;
  stageId: number | null;
  startedAt: number | null;
  actions: GameAction[];

  // 설정
  cols: number;
  rows: number;
  timeLimitSec: number;
  colors: TileColor[];

  // 내부
  _rng: RNG | null;
  _comboResetTimer: ReturnType<typeof setTimeout> | null;
  _tickInterval: ReturnType<typeof setInterval> | null;

  // 액션
  reset: (config: {
    cols: number;
    rows: number;
    timeLimitSec: number;
    seed?: string;
    stageId?: number;
    colors?: TileColor[];
  }) => void;
  swap: (a: Coord, b: Coord) => 'matched' | 'invalid' | 'reverted';
  resolveChain: () => void;
  useBoosterShuffle: () => void;
  useBoosterTime: (deltaSec: number) => void;
  tick: () => void;
  finish: () => void;
  /** 검증 페이로드 — /api/score로 전송 */
  toValidatePayload: () => {
    stageId: number;
    seed: string;
    actions: GameAction[];
    reportedScore: number;
  };
}

export const useGameStore = create<GameState>((set, get) => ({
  board: null,
  score: 0,
  combo: 0,
  timeLeft: 0,
  status: 'idle',

  seed: null,
  stageId: null,
  startedAt: null,
  actions: [],

  cols: 6,
  rows: 6,
  timeLimitSec: 60,
  colors: DEFAULT_COLORS,

  _rng: null,
  _comboResetTimer: null,
  _tickInterval: null,

  reset: ({ cols, rows, timeLimitSec, seed, stageId = null, colors = DEFAULT_COLORS }) => {
    // 기존 인터벌 정리
    const prev = get();
    if (prev._tickInterval) clearInterval(prev._tickInterval);
    if (prev._comboResetTimer) clearTimeout(prev._comboResetTimer);

    const finalSeed = seed ?? randomSeed();
    // 게임 진행 중 사용할 결정적 RNG. 시드가 보드 생성과 후속 보충에서 모두 일관됨.
    const rng = mulberry32(hashSeed(finalSeed) ^ 0x9e3779b9);
    const board = createBoard({ cols, rows }, finalSeed, colors);

    const interval = setInterval(() => {
      get().tick();
    }, 1000);

    set({
      board,
      score: 0,
      combo: 0,
      timeLeft: timeLimitSec,
      status: 'playing',
      seed: finalSeed,
      stageId,
      startedAt: Date.now(),
      actions: [],
      cols,
      rows,
      timeLimitSec,
      colors,
      _rng: rng,
      _comboResetTimer: null,
      _tickInterval: interval,
    });
  },

  swap: (a, b) => {
    const { board, status, _rng, startedAt, actions } = get();
    if (!board || status !== 'playing' || !_rng) return 'invalid';
    if (!areAdjacent(a, b)) return 'invalid';

    // 기록
    const at = startedAt ? Date.now() - startedAt : 0;
    const newActions = [...actions, { type: 'swap' as const, at, payload: { a, b } }];

    if (!isValidSwap(board, a, b)) {
      // 매칭 없는 스왑은 시각적 흔들림만, 보드는 유지
      set({ actions: newActions });
      return 'reverted';
    }

    const next = board.map((row) => row.slice());
    const tmp = next[a.r][a.c];
    next[a.r][a.c] = next[b.r][b.c];
    next[b.r][b.c] = tmp;

    set({ board: next, actions: newActions });
    get().resolveChain();
    return 'matched';
  },

  resolveChain: () => {
    const { board, _rng, colors, score, combo, _comboResetTimer } = get();
    if (!board || !_rng) return;

    const { board: nextBoard, result } = resolveBoard(board, _rng, colors);
    if (result.combos === 0) return;

    if (_comboResetTimer) clearTimeout(_comboResetTimer);

    // 데드락 처리
    let resultBoard = nextBoard;
    if (!hasAnyMove(resultBoard)) {
      resultBoard = shuffleBoard(resultBoard, _rng, colors);
    }

    const nextCombo = combo + result.combos;
    set({
      board: resultBoard,
      score: score + result.scoreDelta,
      combo: nextCombo,
      _comboResetTimer: setTimeout(() => set({ combo: 0 }), 800),
    });
  },

  useBoosterShuffle: () => {
    const { board, _rng, colors, startedAt, actions } = get();
    if (!board || !_rng) return;
    const at = startedAt ? Date.now() - startedAt : 0;
    set({
      board: shuffleBoard(board, _rng, colors),
      actions: [
        ...actions,
        { type: 'booster' as const, at, payload: { code: 'booster_shuffle' } },
      ],
    });
    get().resolveChain();
  },

  useBoosterTime: (deltaSec) => {
    const { timeLeft, startedAt, actions } = get();
    const at = startedAt ? Date.now() - startedAt : 0;
    set({
      timeLeft: timeLeft + deltaSec,
      actions: [
        ...actions,
        {
          type: 'booster' as const,
          at,
          payload: { code: 'booster_time', deltaSec },
        },
      ],
    });
  },

  tick: () => {
    const { timeLeft, status } = get();
    if (status !== 'playing') return;
    if (timeLeft <= 1) {
      get().finish();
      return;
    }
    set({ timeLeft: timeLeft - 1 });
  },

  finish: () => {
    const { _tickInterval, _comboResetTimer, score, timeLeft } = get();
    if (_tickInterval) clearInterval(_tickInterval);
    if (_comboResetTimer) clearTimeout(_comboResetTimer);
    set({
      status: timeLeft > 0 ? 'cleared' : 'failed',
      score: score + (timeLeft > 0 ? timeBonus(timeLeft) : 0),
      _tickInterval: null,
      _comboResetTimer: null,
    });
  },

  toValidatePayload: () => {
    const { stageId, seed, actions, score } = get();
    if (stageId == null || seed == null) {
      throw new Error('Game not started');
    }
    return { stageId, seed, actions, reportedScore: score };
  },
}));

// 매칭이 없으면 호출되지 않는 헬퍼지만, 외부에서 보드 변경 후 직접 호출하고 싶을 때 사용.
export function _findMatches(board: Cell[][]) {
  return findMatches(board);
}
export function _applyGravity(
  board: Cell[][],
  removed: Set<string>,
  rng: RNG,
  colors: TileColor[] = DEFAULT_COLORS,
) {
  return applyGravity(board, removed, rng, colors);
}
