export type TileColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple';

export interface Cell {
  color: TileColor;
  id: string; // Framer Motion layout 트래킹을 위한 안정 키
  locked?: boolean;
}

export interface BoardConfig {
  cols: number;
  rows: number;
  tiles: TileColor[];
}

export interface StageGoal {
  type: 'clear_color' | 'reach_score' | 'clear_obstacles';
  color?: TileColor;
  count?: number;
  thresholds?: { star1: number; star2: number; star3: number };
}

export interface GameAction {
  type: 'swap' | 'booster';
  at: number; // ms since game start
  payload: unknown;
}
