create or replace function public.recalculate_match_predictions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user record;
  v_real_home integer;
  v_real_away integer;
  v_should_recalculate boolean := false;
begin
  if tg_op = 'INSERT' then
    v_should_recalculate := new.status = 'finished';
  elsif tg_op = 'UPDATE' then
    v_should_recalculate := (
      new.status = 'finished'
      and (
        old.status is distinct from new.status
        or old.home_score is distinct from new.home_score
        or old.away_score is distinct from new.away_score
        or old.home_score_ft is distinct from new.home_score_ft
        or old.away_score_ft is distinct from new.away_score_ft
      )
    );
  end if;

  if not v_should_recalculate then
    return new;
  end if;

  v_real_home := coalesce(new.home_score_ft, new.home_score);
  v_real_away := coalesce(new.away_score_ft, new.away_score);

  update public.predictions
  set
    points_earned = public.calculate_prediction_points(
      new.stage,
      predicted_home_score,
      predicted_away_score,
      v_real_home,
      v_real_away
    ),
    is_calculated = true
  where match_id = new.id;

  for v_user in
    select distinct user_id
    from public.predictions
    where match_id = new.id
  loop
    perform public.refresh_user_score(v_user.user_id);
  end loop;

  return new;
end;
$$;

drop trigger if exists matches_recalculate_predictions on public.matches;
create trigger matches_recalculate_predictions
after insert or update of status, home_score, away_score, home_score_ft, away_score_ft
on public.matches
for each row
execute function public.recalculate_match_predictions();
