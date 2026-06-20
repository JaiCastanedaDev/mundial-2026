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
      when 'Round of 32' then v_points := 4;
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
      when 'Round of 32' then v_points := 2;
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