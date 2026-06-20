create table if not exists public.app_settings (
  key text primary key,
  value_text text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.app_settings enable row level security;

drop policy if exists "app_settings_read" on public.app_settings;
create policy "app_settings_read" on public.app_settings
for select to authenticated using (true);

drop trigger if exists app_settings_updated_at on public.app_settings;
create trigger app_settings_updated_at
before update on public.app_settings
for each row execute function public.update_updated_at();

insert into public.app_settings (key, value_text)
values ('group_stage_prediction_deadline', (now() + interval '48 hours')::text)
on conflict (key) do update
set value_text = excluded.value_text,
    updated_at = now();

create or replace function public.get_group_stage_prediction_deadline()
returns timestamptz
language sql
stable
as $$
  select value_text::timestamptz
  from public.app_settings
  where key = 'group_stage_prediction_deadline'
$$;

create or replace function public.can_edit_prediction(p_match_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.matches m
    where m.id = p_match_id
      and (
        (
          m.stage in ('Group Stage', '1')
          and now() < public.get_group_stage_prediction_deadline()
        )
        or (
          m.stage not in ('Group Stage', '1')
          and m.status = 'scheduled'
          and m.match_date > now()
        )
      )
  )
$$;

drop policy if exists "predictions_insert" on public.predictions;
create policy "predictions_insert" on public.predictions
for insert to authenticated
with check (
  auth.uid() = user_id
  and public.can_edit_prediction(match_id)
);

drop policy if exists "predictions_update" on public.predictions;
create policy "predictions_update" on public.predictions
for update to authenticated
using (
  auth.uid() = user_id
  and public.can_edit_prediction(match_id)
)
with check (
  auth.uid() = user_id
  and public.can_edit_prediction(match_id)
);
