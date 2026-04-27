import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';

// 클라이언트가 보낸 점수는 그대로 신뢰하지 않습니다.
// 실제 검증은 Edge Function `validate-answer`에 위임하고,
// 여기서는 인증/스로틀/로깅을 담당합니다.

const PayloadSchema = z.object({
  stageId: z.number().int().positive(),
  seed: z.string().min(1),
  actions: z.array(
    z.object({
      type: z.enum(['swap', 'booster']),
      at: z.number().nonnegative(),
      payload: z.unknown(),
    }),
  ),
  reportedScore: z.number().int().nonnegative(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = PayloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: 'INVALID_INPUT', message: parsed.error.message } },
      { status: 400 },
    );
  }

  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'NOT_AUTHENTICATED', message: '로그인이 필요합니다.' } },
      { status: 401 },
    );
  }

  // Edge Function으로 위임
  const fnResp = await supabase.functions.invoke('validate-answer', {
    body: parsed.data,
  });
  if (fnResp.error) {
    return NextResponse.json(
      { ok: false, error: { code: 'SERVER_ERROR', message: fnResp.error.message } },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, data: fnResp.data });
}
