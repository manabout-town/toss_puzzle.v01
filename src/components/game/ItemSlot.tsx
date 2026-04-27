'use client';

const ITEMS = [
  { code: 'booster_bomb', label: '폭탄', emoji: '💣' },
  { code: 'booster_shuffle', label: '셔플', emoji: '🔀' },
  { code: 'booster_time', label: '+10초', emoji: '⏱️' },
];

export function ItemSlot() {
  // 실제 구현에서는 inventory에서 보유 수량을 받아 표시 + 사용 시 서버 차감.
  return (
    <div className="grid grid-cols-3 gap-2">
      {ITEMS.map((item) => (
        <button
          key={item.code}
          className="flex flex-col items-center rounded-2xl bg-surface-subtle py-3 active:scale-95 transition-transform"
        >
          <span className="text-2xl">{item.emoji}</span>
          <span className="mt-1 text-xs font-semibold">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
