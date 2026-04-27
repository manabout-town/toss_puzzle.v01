'use client';

import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useGameStore } from '@/lib/stores/gameStore';
import { SFX, haptic, unlockAudio } from '@/lib/audio/soundManager';
import type { Coord } from '@/lib/game/engine';

const COLOR_CLASS: Record<string, string> = {
  red: 'bg-red-400',
  blue: 'bg-toss-500',
  green: 'bg-emerald-400',
  yellow: 'bg-yellow-400',
  purple: 'bg-purple-400',
};

const SWIPE_THRESHOLD_PX = 16;

export function GameBoard() {
  const board = useGameStore((s) => s.board);
  const swap = useGameStore((s) => s.swap);

  const boardRef = useRef<HTMLDivElement | null>(null);
  const dragStart = useRef<{ from: Coord; x: number; y: number } | null>(null);

  if (!board)
    return <div className="aspect-square animate-pulse rounded-2xl bg-surface-subtle" />;

  const rows = board.length;
  const cols = board[0].length;

  const onPointerDown = (e: React.PointerEvent, r: number, c: number) => {
    unlockAudio();
    SFX.tap();
    void haptic('light');
    dragStart.current = { from: { r, c }, x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const start = dragStart.current;
    dragStart.current = null;
    if (!start) return;

    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX && Math.abs(dy) < SWIPE_THRESHOLD_PX) return;

    let dr = 0;
    let dc = 0;
    if (Math.abs(dx) > Math.abs(dy)) dc = dx > 0 ? 1 : -1;
    else dr = dy > 0 ? 1 : -1;

    const target: Coord = { r: start.from.r + dr, c: start.from.c + dc };
    if (
      target.r < 0 ||
      target.r >= rows ||
      target.c < 0 ||
      target.c >= cols
    )
      return;

    const result = swap(start.from, target);
    if (result === 'matched') {
      SFX.match();
      void haptic('success');
    } else if (result === 'reverted') {
      void haptic('error');
    }
  };

  return (
    <div
      ref={boardRef}
      className="grid touch-none select-none gap-1.5 rounded-2xl bg-surface-subtle p-2"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (dragStart.current = null)}
    >
      <AnimatePresence>
        {board.flatMap((row, r) =>
          row.map((cell, c) => (
            <motion.div
              key={cell.id}
              layout
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 600, damping: 32 }}
              onPointerDown={(e) => onPointerDown(e, r, c)}
              role="button"
              aria-label={`${cell.color} tile at row ${r}, col ${c}`}
              className={clsx(
                'aspect-square cursor-pointer rounded-xl shadow-sm',
                COLOR_CLASS[cell.color] ?? 'bg-ink-subtle',
              )}
            />
          )),
        )}
      </AnimatePresence>
    </div>
  );
}
