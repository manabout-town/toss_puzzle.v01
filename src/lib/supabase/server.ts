import { createServerClient as createSSRClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

// 서버 컴포넌트 / Route Handler 전용.
// 쿠키 기반으로 세션을 자동으로 읽고 갱신합니다.
export function createServerClient() {
  const cookieStore = cookies();

  return createSSRClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component에서 set이 호출되면 무시 (Next 14 한계)
          }
        },
      },
    },
  );
}
