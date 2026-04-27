import { create } from 'zustand';
import type { Cell, TileColor } from '@/types/game';

const COLORS: TileColor[] = ['red', 'blue', 'green', 'yellow', 'purple'];

function makeCell(): Cell {
  return {
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    id: crypto.randomUUID(),
  };
}

function makeBoard(cols: number, rows: number): Cell[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => makeCell()),
  );
}

export interface GameState {
  board: Cell[][] | null;
  score: number;
  combo: number;
  timeLeft: number;
  status: 'idle' | 'playing' | 'cleared' | 'failed';

  reset: (config: { cols: number; rows: number; timeLimitSec: number }) => void;
  swap: (a: { r: number; c: number }, b: { r: number; c: number }) => void;
  resolve: () => void;
  tick: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  board: null,
  score: 0,
  combo: 0,
  timeLeft: 0,
  status: 'idle',

  reset: ({ cols, rows, timeLimitSec }) =>
    set({
      board: makeBoard(cols, rows),
      score: 0,
      combo: 0,
      timeLeft: timeLimitSec,
      status: 'playing',
    }),

  swap: (a, b) => {
    const board = get().board;
    if (!board) return;
    const next = board.map((row) => row.slice());
    const tmp = next[a.r][a.c];
    next[a.r][a.c] = next[b.r][b.c];
    next[b.r][b.c] = tmp;
    set({ board: next });
    get().resolve();
  },

  resolve: () => {
    // 본 스캐폴딩에서는 매칭 검사 + 중력 + 콤보 산출의 자리만 잡아둡니다.
    // 실제 알고리즘은 docs/game-mechanics.md의 의사코드를 따라 구현하세요.
    // 클라이언트 점수는 시각적 피드백 용도이며, 최종 점수는 서버에서 재계산합니다.
  },

  tick: () => {
    const { timeLeft, status } = get();
    if (status !== 'playing') return;
    if (timeLeft <= 0) {
      set({ status: 'failed' });
      return;
    }
    set({ timeLeft: timeLeft - 1 });
  },
}));
