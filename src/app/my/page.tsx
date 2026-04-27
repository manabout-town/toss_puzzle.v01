import Link from 'next/link';

const MENU = [
  { href: '/my/account/delete', label: '회원 탈퇴' },
  { href: '/legal/terms', label: '이용약관' },
  { href: '/legal/privacy', label: '개인정보처리방침' },
  { href: '/legal/gacha-rates', label: '가챠 확률 공시' },
  { href: '/my/reports', label: '신고 내역' },
  { href: '/my/support', label: '고객센터 / 문의하기' },
];

export default function MyPage() {
  return (
    <div className="px-5 pt-safe-t">
      <h1 className="py-6 text-2xl font-bold">My</h1>

      <ul className="divide-y divide-surface-muted rounded-2xl bg-surface-subtle">
        {MENU.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href as any}
              className="flex items-center justify-between px-5 py-4 active:bg-surface-muted"
            >
              <span>{item.label}</span>
              <span className="text-ink-subtle">›</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
