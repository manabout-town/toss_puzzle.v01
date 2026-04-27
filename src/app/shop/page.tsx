'use client';

import { useState } from 'react';

const RATES = [
  { rarity: 'common', label: '일반', percent: 60 },
  { rarity: 'rare', label: '레어', percent: 30 },
  { rarity: 'epic', label: '에픽', percent: 9 },
  { rarity: 'legendary', label: '전설', percent: 1 },
];

export default function ShopPage() {
  const [showRates, setShowRates] = useState(false);

  const onRoll = async () => {
    // 실제 구현: /api/gacha → Edge Function gacha-roll 호출.
    // 클라이언트는 결과만 받고, 인벤토리는 서버가 수정합니다.
    alert('Edge Function gacha-roll에서 결과를 받아옵니다.');
  };

  return (
    <div className="px-5 pt-safe-t">
      <h1 className="py-6 text-2xl font-bold">상점</h1>

      <div className="rounded-2xl bg-surface-subtle p-5">
        <h2 className="text-lg font-semibold">스탠다드 가챠</h2>
        <p className="mt-1 text-sm text-ink-muted">코인 100개로 1회 뽑기</p>
        <button
          onClick={onRoll}
          className="mt-4 w-full rounded-xl bg-toss-500 py-3 text-white font-semibold active:scale-95 transition-transform"
        >
          1회 뽑기
        </button>
        <button
          onClick={() => setShowRates((v) => !v)}
          className="mt-3 w-full text-sm text-toss-600 underline"
        >
          확률 보기
        </button>

        {showRates && (
          <ul className="mt-4 space-y-2">
            {RATES.map((r) => (
              <li key={r.rarity} className="flex justify-between text-sm">
                <span>{r.label}</span>
                <span className="font-semibold">{r.percent}%</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
