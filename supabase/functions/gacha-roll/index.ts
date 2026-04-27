// Supabase Edge Function: gacha-roll
// 가챠 결과를 서버에서 결정하고 인벤토리/히스토리를 트랜잭션으로 갱신합니다.
//
// 배포: supabase functions deploy gacha-roll

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Pool = 'standard' | 'premium';
type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

const WEIGHTS: Record<Pool, Record<Rarity, number>> = {
  standard: { common: 60, rare: 30, epic: 9, legendary: 1 },
  premium: { common: 30, rare: 45, epic: 20, legendary: 5 },
};

const COSTS: Record<Pool, { item_code: string; amount: number }> = {
  standard: { item_code: 'coin', amount: 100 },
  premium: { item_code: 'gem', amount: 30 },
};

function rollOne(pool: Pool): Rarity {
  const w = WEIGHTS[pool];
  const total = w.common + w.rare + w.epic + w.legendary;
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  let pick = buf[0] % total;
  for (const r of ['common', 'rare', 'epic', 'legendary'] as Rarity[]) {
    if (pick < w[r]) return r;
    pick -= w[r];
  }
  return 'common';
}

function pickItemForRarity(rarity: Rarity): string {
  // 데모: rarity → item_code 매핑. 실제로는 별도 테이블에서 풀 조회.
  return ({
    common: 'booster_bomb',
    rare: 'booster_shuffle',
    epic: 'skin_blue',
    legendary: 'skin_gold',
  } as const)[rarity];
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

  const jwt = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
  const {
    data: { user },
  } = await supabase.auth.getUser(jwt);
  if (!user) {
    return new Response(
      JSON.stringify({ ok: false, error: { code: 'NOT_AUTHENTICATED' } }),
      { status: 401, headers: { 'content-type': 'application/json' } },
    );
  }

  const { pool = 'standard', count = 1 } = (await req.json()) as {
    pool?: Pool;
    count?: 1 | 10;
  };

  // 차단 사용자 차단
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_blocked')
    .eq('id', user.id)
    .single();
  if (profile?.is_blocked) {
    return new Response(
      JSON.stringify({ ok: false, error: { code: 'BLOCKED' } }),
      { status: 403, headers: { 'content-type': 'application/json' } },
    );
  }

  // 비용 차감 — RPC로 트랜잭션 처리하는 것이 안전. 데모는 두 번 query.
  const cost = COSTS[pool];
  const totalCost = cost.amount * count;

  const { data: inv } = await supabase
    .from('inventory')
    .select('quantity')
    .eq('user_id', user.id)
    .eq('item_code', cost.item_code)
    .single();
  if (!inv || inv.quantity < totalCost) {
    return new Response(
      JSON.stringify({ ok: false, error: { code: 'INSUFFICIENT_FUNDS' } }),
      { status: 400, headers: { 'content-type': 'application/json' } },
    );
  }

  await supabase
    .from('inventory')
    .update({ quantity: inv.quantity - totalCost })
    .eq('user_id', user.id)
    .eq('item_code', cost.item_code);

  const results = Array.from({ length: count }, () => {
    const rarity = rollOne(pool);
    return { rarity, item_code: pickItemForRarity(rarity) };
  });

  // 보상 인벤토리 추가 + 히스토리 기록
  for (const r of results) {
    await supabase.rpc('inventory_increment', {
      p_user_id: user.id,
      p_item_code: r.item_code,
      p_delta: 1,
    });
    await supabase.from('gacha_history').insert({
      user_id: user.id,
      pool,
      result_item_code: r.item_code,
      rarity: r.rarity,
      cost_item_code: cost.item_code,
      cost_amount: cost.amount,
    });
  }

  return new Response(JSON.stringify({ ok: true, data: { results } }), {
    headers: { 'content-type': 'application/json' },
  });
});
