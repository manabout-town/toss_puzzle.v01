// 관리자 화면. 미들웨어/RLS에서 role='admin' 검사 후 진입 허용.
// 본 스캐폴딩은 메뉴 골격만 제공합니다. 실제 구현 시 각 섹션을 별도 라우트로 분리하세요.

const SECTIONS = [
  { href: '/admin/stages', label: '스테이지 관리' },
  { href: '/admin/users', label: '유저 관리 / 차단' },
  { href: '/admin/reports', label: '신고 처리' },
  { href: '/admin/gacha', label: '가챠 모니터링' },
];

export default function AdminPage() {
  return (
    <div className="px-5 pt-safe-t">
      <h1 className="py-6 text-2xl font-bold">관리자</h1>
      <ul className="space-y-3">
        {SECTIONS.map((s) => (
          <li
            key={s.href}
            className="rounded-2xl bg-surface-subtle px-5 py-4 font-semibold"
          >
            {s.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
