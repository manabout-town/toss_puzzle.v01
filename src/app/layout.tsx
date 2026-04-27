import type { Metadata, Viewport } from 'next';
import './globals.css';
import { BottomTabBar } from '@/components/layout/BottomTabBar';
import { SafeAreaWrapper } from '@/components/layout/SafeAreaWrapper';

export const metadata: Metadata = {
  title: 'Toss Puzzle',
  description: '앱인토스 미니앱용 풀스택 퍼즐 게임',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#FFFFFF',
  viewportFit: 'cover',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-surface text-ink antialiased select-none">
        <SafeAreaWrapper>
          <main className="pb-[calc(64px+var(--safe-area-bottom))]">{children}</main>
          <BottomTabBar />
        </SafeAreaWrapper>
      </body>
    </html>
  );
}
