create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  display_name text not null,
  avatar_color text default '#3B82F6',
  created_at timestamptz default now()
);

create table if not exists public.matches (
  id uuid default gen_random_uuid() primary key,
  api_match_id integer unique not null,
  home_team text not null,
  away_team text not null,
  home_team_logo text,
  away_team_logo text,
  match_date timestamptz not null,
  stage text not null,
  group_name text,
  status text default 'scheduled' check (status in ('scheduled', 'live', 'finished', 'cancelled')),
  home_score integer,
  away_score integer,
  home_score_ft integer,
  away_score_ft integer,
  venue text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.predictions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  match_id uuid references public.matches(id) on delete cascade not null,
  predicted_home_score integer not null check (predicted_home_score >= 0),
  predicted_away_score integer not null check (predicted_away_score >= 0),
  points_earned integer default 0,
  is_calculated boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, match_id)
);

create table if not exists public.scores (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  total_points integer default 0,
  exact_scores integer default 0,
  correct_results integer default 0,
  total_predicted integer default 0,
  total_missed integer default 0,
  last_updated timestamptz default now()
);

create or replace view public.ranking as
select
  p.id,
  p.username,
  p.display_name,
  p.avatar_color,
  coalesce(s.total_points, 0) as total_points,
  coalesce(s.exact_scores, 0) as exact_scores,
  coalesce(s.correct_results, 0) as correct_results,
  coalesce(s.total_predicted, 0) as total_predicted,
  coalesce(s.total_missed, 0) as total_missed,
  dense_rank() over (
    order by
      coalesce(s.total_points, 0) desc,
      coalesce(s.exact_scores, 0) desc,
      coalesce(s.correct_results, 0) desc
  ) as position
from public.profiles p
left join public.scores s on s.user_id = p.id;

alter table public.profiles enable row level security;
alter table public.matches enable row level security;
alter table public.predictions enable row level security;
alter table public.scores enable row level security;

drop policy if exists "profiles_read" on public.profiles;
create policy "profiles_read" on public.profiles
for select to authenticated using (true);

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles
for update to authenticated using (auth.uid() = id);

drop policy if exists "matches_read" on public.matches;
create policy "matches_read" on public.matches
for select to authenticated using (true);

drop policy if exists "predictions_read" on public.predictions;
create policy "predictions_read" on public.predictions
for select to authenticated using (true);

drop policy if exists "predictions_insert" on public.predictions;
create policy "predictions_insert" on public.predictions
for insert to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.matches m
    where m.id = match_id
      and m.status = 'scheduled'
      and m.match_date > now()
  )
);

drop policy if exists "predictions_update" on public.predictions;
create policy "predictions_update" on public.predictions
for update to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.matches m
    where m.id = match_id
      and m.status = 'scheduled'
      and m.match_date > now()
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.matches m
    where m.id = match_id
      and m.status = 'scheduled'
      and m.match_date > now()
  )
);

drop policy if exists "scores_read" on public.scores;
create policy "scores_read" on public.scores
for select to authenticated using (true);

create or replace function public.calculate_prediction_points(
  p_stage text,
  p_predicted_home integer,
  p_predicted_away integer,
  p_real_home integer,
  p_real_away integer
) returns integer
language plpgsql
as $$
declare
  v_points integer := 0;
  v_real_result text;
  v_pred_result text;
begin
  if p_real_home > p_real_away then
    v_real_result := 'home';
  elsif p_real_home < p_real_away then
    v_real_result := 'away';
  else
    v_real_result := 'draw';
  end if;

  if p_predicted_home > p_predicted_away then
    v_pred_result := 'home';
  elsif p_predicted_home < p_predicted_away then
    v_pred_result := 'away';
  else
    v_pred_result := 'draw';
  end if;

  if p_predicted_home = p_real_home and p_predicted_away = p_real_away then
    case p_stage
      when 'Group Stage' then v_points := 3;
      when 'Round of 16' then v_points := 4;
      when 'Quarter-finals' then v_points := 5;
      when 'Semi-finals' then v_points := 5;
      when 'Third Place' then v_points := 4;
      when 'Final' then v_points := 5;
      else v_points := 3;
    end case;
  elsif v_pred_result = v_real_result then
    case p_stage
      when 'Group Stage' then v_points := 1;
      when 'Round of 16' then v_points := 2;
      when 'Quarter-finals' then v_points := 3;
      when 'Semi-finals' then v_points := 4;
      when 'Third Place' then v_points := 2;
      when 'Final' then v_points := 5;
      else v_points := 1;
    end case;
  end if;

  return v_points;
end;
$$;

create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists matches_updated_at on public.matches;
create trigger matches_updated_at
before update on public.matches
for each row execute function public.update_updated_at();

drop trigger if exists predictions_updated_at on public.predictions;
create trigger predictions_updated_at
before update on public.predictions
for each row execute function public.update_updated_at();

create or replace function public.initialize_score_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.scores (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists profiles_initialize_score on public.profiles;
create trigger profiles_initialize_score
after insert on public.profiles
for each row execute function public.initialize_score_row();

create or replace function public.refresh_user_score(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_finished_matches integer := 0;
begin
  select count(*)
  into v_finished_matches
  from public.matches
  where status = 'finished';

  insert into public.scores (
    user_id,
    total_points,
    exact_scores,
    correct_results,
    total_predicted,
    total_missed,
    last_updated
  )
  select
    p_user_id,
    coalesce(sum(case when pr.is_calculated then pr.points_earned else 0 end), 0),
    coalesce(sum(case
      when pr.is_calculated
        and pr.predicted_home_score = coalesce(m.home_score_ft, m.home_score)
        and pr.predicted_away_score = coalesce(m.away_score_ft, m.away_score)
      then 1 else 0 end), 0),
    coalesce(sum(case
      when pr.is_calculated
        and pr.points_earned > 0
        and not (
          pr.predicted_home_score = coalesce(m.home_score_ft, m.home_score)
          and pr.predicted_away_score = coalesce(m.away_score_ft, m.away_score)
        )
      then 1 else 0 end), 0),
    coalesce(count(pr.id), 0),
    greatest(v_finished_matches - coalesce(count(case when m.status = 'finished' then pr.id end), 0), 0),
    now()
  from public.profiles pf
  left join public.predictions pr on pr.user_id = pf.id
  left join public.matches m on m.id = pr.match_id
  where pf.id = p_user_id
  group by pf.id
  on conflict (user_id) do update set
    total_points = excluded.total_points,
    exact_scores = excluded.exact_scores,
    correct_results = excluded.correct_results,
    total_predicted = excluded.total_predicted,
    total_missed = excluded.total_missed,
    last_updated = excluded.last_updated;
end;
$$;

create or replace function public.refresh_all_scores()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile record;
begin
  for v_profile in select id from public.profiles loop
    perform public.refresh_user_score(v_profile.id);
  end loop;
end;
$$;
