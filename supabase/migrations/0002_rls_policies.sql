-- ─────────────────────────────────────────────────────────────────
-- 0002_rls_policies.sql
-- 모든 테이블 RLS 활성화 + 최소 권한 정책.
-- service_role 키는 RLS를 우회합니다 — 서버 환경에서만 사용.
-- ─────────────────────────────────────────────────────────────────

-- helper: 현재 사용자가 admin 인지
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql stable security definer;

-- ───── profiles ─────
alter table public.profiles enable row level security;

create policy "profiles: read own or public fields"
  on public.profiles for select
  using ( auth.uid() = id or true );  -- 닉네임/아바타는 공개. 민감 컬럼은 뷰로 제한 권장.

create policy "profiles: update own"
  on public.profiles for update
  using ( auth.uid() = id )
  with check ( auth.uid() = id );

-- INSERT는 트리거에서 처리 (0003), 일반 사용자는 직접 INSERT 불가
-- DELETE는 auth.users 삭제 시 cascade로만 발생

-- ───── stages ─────
alter table public.stages enable row level security;

create policy "stages: read all published"
  on public.stages for select
  using ( published = true or public.is_admin() );

create policy "stages: admin write"
  on public.stages for all
  using ( public.is_admin() )
  with check ( public.is_admin() );

-- ───── user_progress ─────
alter table public.user_progress enable row level security;

create policy "user_progress: read own"
  on public.user_progress for select
  using ( auth.uid() = user_id );

create policy "user_progress: write own"
  on public.user_progress for insert
  with check ( auth.uid() = user_id );

create policy "user_progress: update own"
  on public.user_progress for update
  using ( auth.uid() = user_id );

-- ───── inventory ─────
alter table public.inventory enable row level security;

create policy "inventory: read own"
  on public.inventory for select
  using ( auth.uid() = user_id );

-- INSERT/UPDATE는 service_role(서버) 또는 Edge Function 에서만.

-- ───── gacha_history ─────
alter table public.gacha_history enable row level security;

create policy "gacha_history: read own"
  on public.gacha_history for select
  using ( auth.uid() = user_id );

-- INSERT는 Edge Function gacha-roll에서만.

-- ───── reports ─────
alter table public.reports enable row level security;

create policy "reports: insert own"
  on public.reports for insert
  with check ( auth.uid() = reporter_id );

create policy "reports: read admin"
  on public.reports for select
  using ( public.is_admin() );

create policy "reports: update admin"
  on public.reports for update
  using ( public.is_admin() );

-- ───── user_blocks ─────
alter table public.user_blocks enable row level security;

create policy "user_blocks: read own"
  on public.user_blocks for select
  using ( auth.uid() = blocker_id );

create policy "user_blocks: write own"
  on public.user_blocks for insert
  with check ( auth.uid() = blocker_id );

create policy "user_blocks: delete own"
  on public.user_blocks for delete
  using ( auth.uid() = blocker_id );

-- ───── admin_audit_log ─────
alter table public.admin_audit_log enable row level security;

create policy "admin_audit_log: admin read"
  on public.admin_audit_log for select
  using ( public.is_admin() );
-- INSERT는 service_role 에서.
