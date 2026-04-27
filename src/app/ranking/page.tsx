export default function RankingPage() {
  return (
    <div className="px-5 pt-safe-t">
      <h1 className="py-6 text-2xl font-bold">랭킹</h1>
      <p className="text-ink-muted">
        주간/누적 랭킹 화면. 실제 구현에서는 Supabase의 user_progress와 profiles를 join해
        서버 컴포넌트에서 SSR 합니다.
      </p>
    </div>
  );
}
