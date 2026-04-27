'use client';

import { useGameStore } from '@/lib/stores/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

const COLOR_CLASS: Record<string, string> = {
  red: 'bg-red-400',
  blue: 'bg-toss-500',
  green: 'bg-emerald-400',
  yellow: 'bg-yellow-400',
  purple: 'bg-purple-400',
};

export function GameBoard() {
  const { board, swap } = useGameStore((s) => ({ board: s.board, swap: s.swap }));

  if (!board) return <div className="aspect-square rounded-2xl bg-surface-subtle" />;

  const cols = board[0]?.length ?? 6;

  return (
    <div
      className="grid touch-none select-none gap-1.5 rounded-2xl bg-surface-subtle p-2"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      <AnimatePresence>
        {board.flatMap((row, r) =>
          row.map((cell, c) => (
            <motion.button
              key={cell.id}
              layout
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 600, damping: 32 }}
              onClick={() => {
                // 데모용: 우측 셀과 스왑. 실제 구현에서는 드래그/포인터 제스처로.
                if (c < cols - 1) swap({ r, c }, { r, c: c + 1 });
              }}
              className={clsx(
                'aspect-square rounded-xl',
                COLOR_CLASS[cell.color] ?? 'bg-ink-subtle',
              )}
              aria-label={`${cell.color} tile at row ${r}, col ${c}`}
            />
          )),
        )}
      </AnimatePresence>
    </div>
  );
}
