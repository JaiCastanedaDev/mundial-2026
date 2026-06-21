import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

Deno.serve(async (request) => {
  try {
    const body = await request.json().catch(() => ({}))
    const apiMatchIds = Array.isArray(body.apiMatchIds) ? body.apiMatchIds : []

    let query = supabase
      .from('matches')
      .select('id, api_match_id, stage, home_score, away_score, home_score_ft, away_score_ft, status')
      .eq('status', 'finished')

    if (apiMatchIds.length > 0) {
      query = query.in('api_match_id', apiMatchIds)
    }

    const { data: matches, error: matchesError } = await query
    if (matchesError) throw matchesError

    let updatedPredictions = 0
    const affectedUsers = new Set<string>()

    for (const match of matches ?? []) {
      const { data: predictions, error: predictionsError } = await supabase
        .from('predictions')
        .select('id, user_id, predicted_home_score, predicted_away_score')
        .eq('match_id', match.id)

      if (predictionsError) throw predictionsError
      if (!predictions?.length) continue

      const realHome = match.home_score_ft ?? match.home_score
      const realAway = match.away_score_ft ?? match.away_score

      for (const prediction of predictions) {
        const { data: points, error: rpcError } = await supabase.rpc('calculate_prediction_points', {
          p_stage: match.stage,
          p_predicted_home: prediction.predicted_home_score,
          p_predicted_away: prediction.predicted_away_score,
          p_real_home: realHome,
          p_real_away: realAway,
        })

        if (rpcError) throw rpcError

        const { error: updateError } = await supabase
          .from('predictions')
          .update({
            points_earned: points,
            is_calculated: true,
          })
          .eq('id', prediction.id)

        if (updateError) throw updateError

        affectedUsers.add(prediction.user_id)
        updatedPredictions += 1
      }
    }

    for (const userId of affectedUsers) {
      const { error: refreshError } = await supabase.rpc('refresh_user_score', {
        p_user_id: userId,
      })

      if (refreshError) throw refreshError
    }

    return Response.json({
      matchesProcessed: matches?.length ?? 0,
      predictionsUpdated: updatedPredictions,
      usersRefreshed: affectedUsers.size,
    })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
})
