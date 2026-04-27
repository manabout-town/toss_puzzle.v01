import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // 정적 자산과 이미지 최적화는 미들웨어 통과 불필요
    '/((?!_next/static|_next/image|favicon.ico|sounds/|icons/).*)',
  ],
};
