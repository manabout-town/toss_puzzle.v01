import Link from 'next/link';

export default function HomePage() {
  // 실제 구현에서는 Supabase에서 stages를 SELECT하여 챕터별로 그룹화합니다.
  // 본 스캐폴딩에서는 정적 더미만 노출합니다.
  const stages = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    chapter: Math.floor(i / 4) + 1,
    title: `Stage ${i + 1}`,
  }));

  return (
    <div className="px-5 pt-safe-t">
      <header className="py-6">
        <p className="text-sm text-ink-muted">앱인토스 미니앱</p>
        <h1 className="text-2xl font-bold">Toss Puzzle</h1>
      </header>

      <section>
        <h2 className="mb-3 text-lg font-semibold">스테이지</h2>
        <div className="grid grid-cols-3 gap-3">
          {stages.map((stage) => (
            <Link
              key={stage.id}
              href={{ pathname: '/play', query: { stage: stage.id } }}
              className="aspect-square rounded-2xl bg-surface-subtle p-3 active:scale-95 transition-transform"
            >
              <div className="text-xs text-ink-subtle">Ch.{stage.chapter}</div>
              <div className="mt-2 text-base font-semibold">{stage.title}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
