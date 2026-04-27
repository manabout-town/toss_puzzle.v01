'use client';

import { useEffect } from 'react';
import { GameBoard } from '@/components/game/GameBoard';
import { Scoreboard } from '@/components/game/Scoreboard';
import { ItemSlot } from '@/components/game/ItemSlot';
import { useGameStore } from '@/lib/stores/gameStore';

export default function PlayPage() {
  const reset = useGameStore((s) => s.reset);

  useEffect(() => {
    // 마운트 시 보드 초기화. 실제로는 stages 테이블에서 board_config를 받아 전달.
    reset({ cols: 6, rows: 6, timeLimitSec: 60 });
  }, [reset]);

  return (
    <div className="flex flex-col gap-4 px-4 pt-safe-t">
      <Scoreboard />
      <GameBoard />
      <ItemSlot />
    </div>
  );
}
