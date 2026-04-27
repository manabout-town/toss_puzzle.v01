'use client';

import { useGameStore } from '@/lib/stores/gameStore';

export function Scoreboard() {
  const { score, combo, timeLeft } = useGameStore((s) => ({
    score: s.score,
    combo: s.combo,
    timeLeft: s.timeLeft,
  }));

  return (
    <div className="flex items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-sm">
      <div>
        <div className="text-xs text-ink-subtle">Score</div>
        <div className="text-2xl font-bold tabular-nums">{score.toLocaleString()}</div>
      </div>
      <div className="text-center">
        <div className="text-xs text-ink-subtle">Combo</div>
        <div className="text-2xl font-bold text-toss-500 tabular-nums">x{combo}</div>
      </div>
      <div className="text-right">
        <div className="text-xs text-ink-subtle">Time</div>
        <div className="text-2xl font-bold tabular-nums">{timeLeft}s</div>
      </div>
    </div>
  );
}
