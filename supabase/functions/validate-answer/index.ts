// Supabase Edge Function: validate-answer
// 클라이언트가 보낸 시드 + 액션 시퀀스를 서버에서 재시뮬레이션해
// 점수를 산출하고 user_progress.best_score를 갱신합니다.
//
// 배포: supabase functions deploy validate-answer

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface Action {
  type: 'swap' | 'booster';
  at: number;
  payload: unknown;
}

interface Payload {
  stageId: number;
  seed: string;
  actions: Action[];
  reportedScore: number;
}

function simulateScore(_seed: string, _actions: Action[]): number {
  // TODO: docs/game-mechanics.md 의 알고리즘을 그대로 옮겨 구현.
  // - 시드로 보드 재구성
  // - 각 액션을 순차 적용 → 매칭/중력/콤보 산출
  // - 최종 점수 + 별점 반환
  return 0;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  // Edge Function은 호출자(authenticated user)의 JWT를 헤더로 전달받아
  // user를 식별합니다.
  const authHeader = req.headers.get('Authorization') ?? '';
  const jwt = authHeader.replace('Bearer ', '');
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser(jwt);
  if (authErr || !user) {
    return new Response(JSON.stringify({ ok: false, error: { code: 'NOT_AUTHENTICATED' } }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }

  const payload = (await req.json()) as Payload;
  const verifiedScore = simulateScore(payload.seed, payload.actions);

  // 클라이언트 보고 점수가 서버 재계산과 다르면 부정행위로 간주.
  if (Math.abs(verifiedScore - payload.reportedScore) > 0) {
    await supabase.from('reports').insert({
      reporter_id: user.id,
      target_type: 'self',
      target_id: user.id,
      reason: 'cheating',
      note: `mismatch: reported=${payload.reportedScore}, verified=${verifiedScore}`,
    });
    return new Response(
      JSON.stringify({ ok: false, error: { code: 'SCORE_MISMATCH' } }),
      { status: 400, headers: { 'content-type': 'application/json' } },
    );
  }

  await supabase
    .from('user_progress')
    .upsert(
      {
        user_id: user.id,
        stage_id: payload.stageId,
        best_score: verifiedScore,
        cleared_at: new Date().toISOString(),
        attempts: 1,
      },
      { onConflict: 'user_id,stage_id', ignoreDuplicates: false },
    );

  return new Response(
    JSON.stringify({ ok: true, data: { score: verifiedScore } }),
    { headers: { 'content-type': 'application/json' } },
  );
});
