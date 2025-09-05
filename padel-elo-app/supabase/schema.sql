-- Enable extensions (if not already)
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  is_admin boolean default false,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;

-- Players
create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  nickname text not null,
  created_at timestamptz default now()
);
alter table public.players enable row level security;

-- Elo ratings
create table if not exists public.elo_ratings (
  player_id uuid primary key references public.players(id) on delete cascade,
  rating int not null default 1200,
  rd int not null default 350,
  updated_at timestamptz default now()
);
alter table public.elo_ratings enable row level security;

-- Matches
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  played_at date not null default now(),
  team_a_player1 uuid references public.players(id),
  team_a_player2 uuid references public.players(id),
  team_b_player1 uuid references public.players(id),
  team_b_player2 uuid references public.players(id),
  score text not null,
  winner char(1) not null check (winner in ('A','B')),
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);
alter table public.matches enable row level security;

-- Elo events
create table if not exists public.elo_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.matches(id) on delete cascade,
  player_id uuid references public.players(id) on delete cascade,
  rating_before int not null,
  rating_after int not null,
  k_factor int not null,
  created_at timestamptz default now()
);
alter table public.elo_events enable row level security;

-- Fine types
create table if not exists public.fine_types (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  amount_cents int not null check (amount_cents >= 0),
  active boolean default true,
  created_at timestamptz default now()
);
alter table public.fine_types enable row level security;

-- Fines
create table if not exists public.fines (
  id uuid primary key default gen_random_uuid(),
  fine_type_id uuid references public.fine_types(id),
  issuer_id uuid references public.profiles(id),
  target_player_id uuid references public.players(id),
  comment text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  amount_cents int not null,
  decided_by uuid references public.profiles(id),
  decided_at timestamptz,
  created_at timestamptz default now()
);
alter table public.fines enable row level security;

-- Policies
-- Profiles
create policy user_select_own_profile on public.profiles for select using (auth.uid() = id);
create policy user_update_own_profile on public.profiles for update using (auth.uid() = id);
create policy user_insert_own_profile on public.profiles for insert with check (auth.uid() = id);

-- Players
create policy anon_read_players on public.players for select using (true);
create policy user_insert_player on public.players for insert with check (auth.uid() is not null);
create policy user_update_own_player on public.players for update using (auth.uid() = user_id);

-- Elo ratings
create policy anon_read_ratings on public.elo_ratings for select using (true);

-- Matches
create policy user_read_matches on public.matches for select using (true);
create policy user_insert_match on public.matches for insert with check (auth.uid() is not null);

-- Elo events
create policy anon_read_elo_events on public.elo_events for select using (true);

-- Fine types
create policy anon_read_finetypes on public.fine_types for select using (active = true);
create policy admin_manage_finetypes on public.fine_types for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

-- Fines
create policy user_insert_fine on public.fines for insert with check (auth.uid() = issuer_id);
create policy user_read_fines on public.fines for select using (true);

-- Trigger: create elo_ratings on new player
create or replace function public.create_elo_on_player() returns trigger language plpgsql as $$
begin
  insert into public.elo_ratings(player_id, rating) values (new.id, 1200) on conflict do nothing;
  return new;
end; $$;

drop trigger if exists trg_create_elo_on_player on public.players;
create trigger trg_create_elo_on_player after insert on public.players
for each row execute function public.create_elo_on_player();
