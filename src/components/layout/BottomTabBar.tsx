'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

const TABS = [
  { href: '/', label: 'Home' },
  { href: '/ranking', label: 'Ranking' },
  { href: '/shop', label: 'Shop' },
  { href: '/my', label: 'My' },
] as const;

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-surface-muted bg-white/95 backdrop-blur pb-safe-b"
      aria-label="Primary"
    >
      <ul className="grid grid-cols-4">
        {TABS.map((tab) => {
          const active =
            tab.href === '/' ? pathname === '/' : pathname?.startsWith(tab.href);
          return (
            <li key={tab.href} className="relative">
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={clsx(
                  'flex h-16 flex-col items-center justify-center text-xs font-semibold active:scale-95 transition-transform',
                  active ? 'text-toss-500' : 'text-ink-subtle',
                )}
              >
                {tab.label}
              </Link>
              {active && (
                <motion.span
                  layoutId="tab-indicator"
                  className="absolute inset-x-6 top-0 h-[2px] rounded-full bg-toss-500"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
