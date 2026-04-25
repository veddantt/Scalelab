-- ═══════════════════════════════════════════════════════════════
-- ScaleLab — Supabase Migration
-- Run this in your Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Profiles ────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  full_name  text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── 2. Interview Sessions ─────────────────────────────────
create table if not exists public.interview_sessions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  problem_id        text not null,
  problem_title     text not null,
  status            text not null default 'in_progress',
  current_step      int default 1,
  overall_score     int,
  clarity_score     int,
  depth_score       int,
  correctness_score int,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

alter table public.interview_sessions enable row level security;

create policy "Users can view own sessions"
  on public.interview_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on public.interview_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sessions"
  on public.interview_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete own sessions"
  on public.interview_sessions for delete
  using (auth.uid() = user_id);

-- Auto-update updated_at on row change
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.interview_sessions;
create trigger set_updated_at
  before update on public.interview_sessions
  for each row execute function public.update_updated_at();

-- ─── 3. Chat Messages ──────────────────────────────────────
create table if not exists public.chat_messages (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.interview_sessions(id) on delete cascade,
  role       text not null,
  content    text not null,
  feedback   text,
  step       int,
  created_at timestamptz default now()
);

alter table public.chat_messages enable row level security;

create policy "Users can view own messages"
  on public.chat_messages for select
  using (
    exists (
      select 1 from public.interview_sessions
      where id = chat_messages.session_id
        and user_id = auth.uid()
    )
  );

create policy "Users can insert own messages"
  on public.chat_messages for insert
  with check (
    exists (
      select 1 from public.interview_sessions
      where id = chat_messages.session_id
        and user_id = auth.uid()
    )
  );

create policy "Users can delete own messages"
  on public.chat_messages for delete
  using (
    exists (
      select 1 from public.interview_sessions
      where id = chat_messages.session_id
        and user_id = auth.uid()
    )
  );

-- ─── 4. Architecture Results ────────────────────────────────
create table if not exists public.architecture_results (
  id                      uuid primary key default gen_random_uuid(),
  session_id              uuid not null references public.interview_sessions(id) on delete cascade,
  summary                 text,
  score                   int,
  nodes                   jsonb not null default '[]',
  edges                   jsonb not null default '[]',
  bottlenecks             jsonb,
  tradeoffs               jsonb,
  scaling_recommendations jsonb,
  is_fallback             boolean default false,
  created_at              timestamptz default now()
);

alter table public.architecture_results enable row level security;

create policy "Users can view own architecture"
  on public.architecture_results for select
  using (
    exists (
      select 1 from public.interview_sessions
      where id = architecture_results.session_id
        and user_id = auth.uid()
    )
  );

create policy "Users can insert own architecture"
  on public.architecture_results for insert
  with check (
    exists (
      select 1 from public.interview_sessions
      where id = architecture_results.session_id
        and user_id = auth.uid()
    )
  );

create policy "Users can delete own architecture"
  on public.architecture_results for delete
  using (
    exists (
      select 1 from public.interview_sessions
      where id = architecture_results.session_id
        and user_id = auth.uid()
    )
  );

-- ─── 5. Review Results ──────────────────────────────────────
create table if not exists public.review_results (
  id                       uuid primary key default gen_random_uuid(),
  session_id               uuid not null references public.interview_sessions(id) on delete cascade,
  final_score              int,
  strengths                jsonb,
  weaknesses               jsonb,
  architecture_summary     text,
  component_explanations   jsonb,
  recommended_improvements jsonb,
  created_at               timestamptz default now()
);

alter table public.review_results enable row level security;

create policy "Users can view own reviews"
  on public.review_results for select
  using (
    exists (
      select 1 from public.interview_sessions
      where id = review_results.session_id
        and user_id = auth.uid()
    )
  );

create policy "Users can insert own reviews"
  on public.review_results for insert
  with check (
    exists (
      select 1 from public.interview_sessions
      where id = review_results.session_id
        and user_id = auth.uid()
    )
  );

create policy "Users can delete own reviews"
  on public.review_results for delete
  using (
    exists (
      select 1 from public.interview_sessions
      where id = review_results.session_id
        and user_id = auth.uid()
    )
  );

-- ─── Indexes ────────────────────────────────────────────────
create index if not exists idx_sessions_user_id on public.interview_sessions(user_id);
create index if not exists idx_messages_session_id on public.chat_messages(session_id);
create index if not exists idx_architecture_session_id on public.architecture_results(session_id);
create index if not exists idx_review_session_id on public.review_results(session_id);
