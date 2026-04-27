# gacha-roll

가챠 뽑기는 항상 서버에서 결정해 결과를 반환합니다. 클라이언트는 풀(pool)과 횟수만 보냅니다.

## 배포

```bash
supabase functions deploy gacha-roll --project-ref <PROJECT_REF>
```

## DB 의존

`inventory_increment` RPC 또는 동등한 트랜잭션 헬퍼가 필요합니다. 다음과 같이 정의해 주세요.

```sql
create or replace function public.inventory_increment(
  p_user_id uuid, p_item_code text, p_delta int
) returns void as $$
  insert into public.inventory (user_id, item_code, quantity)
  values (p_user_id, p_item_code, greatest(p_delta, 0))
  on conflict (user_id, item_code) do update
    set quantity = public.inventory.quantity + p_delta,
        updated_at = now();
$$ language sql security definer;
```
