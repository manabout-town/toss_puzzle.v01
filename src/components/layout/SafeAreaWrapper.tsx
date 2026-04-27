export function SafeAreaWrapper({ children }: { children: React.ReactNode }) {
  // 노치/홈 인디케이터를 회피하기 위한 루트 래퍼.
  // 가로 padding은 디자인에서 직접 다루므로 여기선 적용하지 않습니다.
  return <div className="min-h-screen pl-safe-l pr-safe-r">{children}</div>;
}
