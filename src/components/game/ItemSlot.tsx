'use client';

import { useGameStore } from '@/lib/stores/gameStore';
import { SFX, haptic, unlockAudio } from '@/lib/audio/soundManager';

const ITEMS = [
  { code: 'booster_shuffle', label: '셔플', emoji: '🔀' },
  { code: 'booster_time', label: '+10초', emoji: '⏱️' },
] as const;

export function ItemSlot() {
  const useShuffle = useGameStore((s) => s.useBoosterShuffle);
  const useTime = useGameStore((s) => s.useBoosterTime);

  const onUse = (code: (typeof ITEMS)[number]['code']) => {
    unlockAudio();
    void haptic('heavy');
    if (code === 'booster_shuffle') {
      useShuffle();
      SFX.combo();
    } else if (code === 'booster_time') {
      useTime(10);
      SFX.tap();
    }
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {ITEMS.map((item) => (
        <button
          key={item.code}
          onClick={() => onUse(item.code)}
          className="flex flex-col items-center rounded-2xl bg-surface-subtle py-3 active:scale-95 transition-transform"
        >
          <span className="text-2xl">{item.emoji}</span>
          <span className="mt-1 text-xs font-semibold">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
