'use client';

import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const supabase = createClient();

  const signInWith = async (provider: 'google' | 'kakao' | 'apple') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/` },
    });
  };

  const signInGuest = async () => {
    await supabase.auth.signInAnonymously();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 pt-safe-t">
      <h1 className="text-3xl font-bold">Toss Puzzle</h1>
      <p className="mt-2 text-ink-muted">로그인하고 시작하기</p>

      <div className="mt-10 w-full space-y-3">
        <button
          onClick={() => signInWith('kakao')}
          className="w-full rounded-xl bg-[#FEE500] py-3 font-semibold active:scale-95 transition-transform"
        >
          카카오로 시작하기
        </button>
        <button
          onClick={() => signInWith('google')}
          className="w-full rounded-xl border border-surface-muted py-3 font-semibold active:scale-95 transition-transform"
        >
          Google로 시작하기
        </button>
        <button
          onClick={() => signInWith('apple')}
          className="w-full rounded-xl bg-black py-3 font-semibold text-white active:scale-95 transition-transform"
        >
          Apple로 시작하기
        </button>
        <button
          onClick={signInGuest}
          className="w-full rounded-xl bg-surface-subtle py-3 font-semibold text-ink-muted active:scale-95 transition-transform"
        >
          게스트로 시작하기
        </button>
      </div>

      <p className="mt-6 text-xs text-ink-subtle">
        가입 시 이용약관 및 개인정보처리방침에 동의합니다.
      </p>
    </div>
  );
}
