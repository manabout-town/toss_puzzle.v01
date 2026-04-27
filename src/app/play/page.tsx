'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { GameBoard } from '@/components/game/GameBoard';
import { Scoreboard } from '@/components/game/Scoreboard';
import { ItemSlot } from '@/components/game/ItemSlot';
import { useGameStore } from '@/lib/stores/gameStore';

export default function PlayPage() {
  const reset = useGameStore((s) => s.reset);
  const finish = useGameStore((s) => s.finish);
  const params = useSearchParams();
  const stageParam = Number(params.get('stage') ?? '1');

  useEffect(() => {
    // 마운트 시 보드 초기화. 실제로는 stages 테이블의 board_config / time_limit_sec / seed를 받아 전달.
    reset({
      cols: 6,
      rows: 6,
      timeLimitSec: 60,
      stageId: Number.isFinite(stageParam) ? stageParam : 1,
    });
    return () => {
      // 페이지 이탈 시 게임 종료 → 인터벌 정리
      finish();
    };
    // 의존성: stageParam만 — reset/finish는 zustand에서 안정적인 참조
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageParam]);

  return (
    <div className="flex flex-col gap-4 px-4 pt-safe-t">
      <Scoreboard />
      <GameBoard />
      <ItemSlot />
    </div>
  );
}
