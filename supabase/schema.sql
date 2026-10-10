-- GeoFlags online schema for Supabase.
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- It is safe to run more than once.

create table if not exists public.players (
  id uuid primary key,
  name text not null check (char_length(name) between 2 and 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Best scores of the solo challenges (survival, timed, streak).
create table if not exists public.scores (
  id bigserial primary key,
  player_id uuid not null references public.players(id) on delete cascade,
  mode text not null,
  score integer not null check (score >= 0),
  created_at timestamptz not null default now()
);
create index if not exists scores_mode_score on public.scores (mode, score desc);

-- Daily challenge: one result per player and day.
create table if not exists public.daily_results (
  day date not null,
  player_id uuid not null references public.players(id) on delete cascade,
  score integer not null check (score >= 0),
  time_ms integer not null check (time_ms >= 0),
  created_at timestamptz not null default now(),
  primary key (day, player_id)
);

-- Challenges between friends: same seed and config for everyone.
create table if not exists public.challenges (
  code text primary key,
  creator_id uuid not null references public.players(id) on delete cascade,
  config jsonb not null,
  seed bigint not null,
  created_at timestamptz not null default now()
);

create table if not exists public.challenge_results (
  code text not null references public.challenges(code) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  score integer not null check (score >= 0),
  time_ms integer not null check (time_ms >= 0),
  created_at timestamptz not null default now(),
  primary key (code, player_id)
);

-- Leaderboards with player names.
create or replace view public.leaderboard with (security_invoker = true) as
  select distinct on (s.mode, s.player_id) s.mode, s.player_id, p.name, s.score, s.created_at
  from public.scores s join public.players p on p.id = s.player_id
  order by s.mode, s.player_id, s.score desc;

create or replace view public.daily_board with (security_invoker = true) as
  select d.day, d.player_id, p.name, d.score, d.time_ms
  from public.daily_results d join public.players p on p.id = d.player_id;

create or replace view public.challenge_board with (security_invoker = true) as
  select r.code, r.player_id, p.name, r.score, r.time_ms, r.created_at
  from public.challenge_results r join public.players p on p.id = r.player_id;

-- Row level security: the app uses the public "anon" key. Anyone with the app
-- can read everything and add results (fine for a group of friends); nobody
-- can delete or edit other people's results.
alter table public.players enable row level security;
alter table public.scores enable row level security;
alter table public.daily_results enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_results enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'players' and policyname = 'read players') then
    create policy "read players" on public.players for select using (true);
    create policy "add players" on public.players for insert with check (true);
    create policy "rename players" on public.players for update using (true) with check (true);
    create policy "read scores" on public.scores for select using (true);
    create policy "add scores" on public.scores for insert with check (true);
    create policy "read daily" on public.daily_results for select using (true);
    create policy "add daily" on public.daily_results for insert with check (true);
    create policy "read challenges" on public.challenges for select using (true);
    create policy "add challenges" on public.challenges for insert with check (true);
    create policy "read challenge results" on public.challenge_results for select using (true);
    create policy "add challenge results" on public.challenge_results for insert with check (true);
  end if;
end $$;

grant select on public.leaderboard, public.daily_board, public.challenge_board to anon, authenticated;
