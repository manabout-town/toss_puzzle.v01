-- ─────────────────────────────────────────────────────────────────
-- 0001_initial_schema.sql
-- 핵심 도메인 테이블 정의 (Phase 1).
-- 다음 마이그레이션에서 RLS 정책과 트리거를 추가합니다.
-- ─────────────────────────────────────────────────────────────────

-- updated_at 자동 갱신 헬퍼
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ───── profiles ─────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text unique not null,
  avatar_url text,
  is_verified boolean not null default false,
  is_blocked boolean not null default false,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

-- ───── stages ─────
create table if not exists public.stages (
  id bigint generated always as identity primary key,
  chapter int not null,
  order_in_chapter int not null,
  title text not null,
  goal jsonb not null,
  board_config jsonb not null,
  time_limit_sec int not null check (time_limit_sec > 0),
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (chapter, order_in_chapter)
);

create trigger trg_stages_updated_at
before update on public.stages
for each row execute procedure public.set_updated_at();

-- ───── user_progress ─────
create table if not exists public.user_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  stage_id bigint not null references public.stages(id) on delete cascade,
  best_score int not null default 0 check (best_score >= 0),
  stars int not null default 0 check (stars between 0 and 3),
  cleared_at timestamptz,
  attempts int not null default 0 check (attempts >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, stage_id)
);

create index if not exists idx_user_progress_user_score
  on public.user_progress (user_id, best_score desc);
create index if not exists idx_user_progress_stage_score
  on public.user_progress (stage_id, best_score desc);

create trigger trg_user_progress_updated_at
before update on public.user_progress
for each row execute procedure public.set_updated_at();

-- ───── inventory ─────
create table if not exists public.inventory (
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_code text not null,
  quantity int not null default 0 check (quantity >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, item_code)
);

create trigger trg_inventory_updated_at
before update on public.inventory
for each row execute procedure public.set_updated_at();

-- ───── gacha_history ─────
create table if not exists public.gacha_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  pool text not null check (pool in ('standard', 'premium')),
  result_item_code text not null,
  rarity text not null check (rarity in ('common', 'rare', 'epic', 'legendary')),
  cost_item_code text not null,
  cost_amount int not null check (cost_amount >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_gacha_history_user_created
  on public.gacha_history (user_id, created_at desc);

-- ───── reports ─────
create table if not exists public.reports (
  id bigint generated always as identity primary key,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null,
  target_id text not null,
  reason text not null check (reason in ('inappropriate_name', 'cheating', 'harassment', 'other')),
  note text,
  status text not null default 'open' check (status in ('open', 'resolved', 'rejected')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolver_id uuid references public.profiles(id)
);

create index if not exists idx_reports_status_created
  on public.reports (status, created_at);

-- ───── user_blocks ─────
create table if not exists public.user_blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

-- ───── admin_audit_log ─────
create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  admin_id uuid not null references public.profiles(id),
  action text not null,
  target_table text not null,
  target_id text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
