-- ─────────────────────────────────────────────────────────────────
-- 0003_triggers.sql
-- 회원가입 시 프로필 자동 생성 + 본인인증 동기화 인터페이스.
-- ─────────────────────────────────────────────────────────────────

-- 신규 auth 사용자가 추가되면 profiles 행을 함께 만든다.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_nickname text;
  candidate text;
  attempt int := 0;
begin
  base_nickname := coalesce(
    new.raw_user_meta_data->>'nickname',
    'puzzler_' || substr(new.id::text, 1, 8)
  );
  candidate := base_nickname;

  -- 닉네임 충돌 시 _숫자 접미
  while exists (select 1 from public.profiles where nickname = candidate) loop
    attempt := attempt + 1;
    candidate := base_nickname || '_' || attempt;
    if attempt > 50 then
      candidate := base_nickname || '_' || substr(new.id::text, 1, 4);
      exit;
    end if;
  end loop;

  insert into public.profiles (id, nickname, avatar_url)
  values (new.id, candidate, new.raw_user_meta_data->>'avatar_url');

  -- 신규 가입 보너스: 코인 100개 지급
  insert into public.inventory (user_id, item_code, quantity)
  values (new.id, 'coin', 100)
  on conflict (user_id, item_code) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- 본인인증 결과 webhook 수신 시 호출되는 함수 (Edge Function에서 호출).
create or replace function public.mark_user_verified(target uuid)
returns void
language sql
security definer
as $$
  update public.profiles
     set is_verified = true
   where id = target;
$$;
