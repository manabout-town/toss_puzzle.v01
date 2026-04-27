'use client';

import { useGameStore } from '@/lib/stores/gameStore';
import { clsx } from 'clsx';

export function Scoreboard() {
  const score = useGameStore((s) => s.score);
  const combo = useGameStore((s) => s.combo);
  const timeLeft = useGameStore((s) => s.timeLeft);
  const status = useGameStore((s) => s.status);
  const lowTime = timeLeft <= 5;

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
        <div className="text-xs text-ink-subtle">
          Time {status !== 'playing' && `· ${status}`}
        </div>
        <div
          className={clsx(
            'text-2xl font-bold tabular-nums',
            lowTime && status === 'playing' && 'text-red-500 animate-pulse',
          )}
        >
          {timeLeft}s
        </div>
      </div>
    </div>
  );
}
