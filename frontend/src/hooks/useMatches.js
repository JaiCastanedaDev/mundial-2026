import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useMatches() {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['matches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select(
          `
          *,
          predictions (
            id,
            user_id,
            match_id,
            predicted_home_score,
            predicted_away_score,
            points_earned,
            is_calculated,
            created_at,
            updated_at
          )
        `,
        )
        .order('match_date', { ascending: true })

      if (error) throw error
      return data ?? []
    },
    refetchInterval: (query) => {
      const matches = query.state.data ?? []
      return matches.some((match) => match.status === 'live') ? 15_000 : 120_000
    },
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    const channel = supabase
      .channel('matches-live-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['matches'] })
          queryClient.invalidateQueries({ queryKey: ['ranking'] })
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'predictions' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['matches'] })
          queryClient.invalidateQueries({ queryKey: ['ranking'] })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [queryClient])

  return query
}

export function useSavePrediction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ matchId, userId, predictedHomeScore, predictedAwayScore }) => {
      const payload = {
        match_id: matchId,
        user_id: userId,
        predicted_home_score: predictedHomeScore,
        predicted_away_score: predictedAwayScore,
      }

      const { data, error } = await supabase
        .from('predictions')
        .upsert(payload, { onConflict: 'user_id,match_id' })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['matches'] })

      const previousMatches = queryClient.getQueryData(['matches'])

      queryClient.setQueryData(['matches'], (current = []) =>
        current.map((match) => {
          if (match.id !== variables.matchId) return match

          const predictions = Array.isArray(match.predictions) ? [...match.predictions] : []
          const existingIndex = predictions.findIndex((prediction) => prediction.user_id === variables.userId)
          const optimisticPrediction = {
            id: predictions[existingIndex]?.id ?? `temp-${variables.userId}-${variables.matchId}`,
            user_id: variables.userId,
            match_id: variables.matchId,
            predicted_home_score: variables.predictedHomeScore,
            predicted_away_score: variables.predictedAwayScore,
            points_earned: predictions[existingIndex]?.points_earned ?? 0,
            is_calculated: predictions[existingIndex]?.is_calculated ?? false,
          }

          if (existingIndex >= 0) {
            predictions[existingIndex] = optimisticPrediction
          } else {
            predictions.push(optimisticPrediction)
          }

          return { ...match, predictions }
        }),
      )

      return { previousMatches }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousMatches) {
        queryClient.setQueryData(['matches'], context.previousMatches)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] })
      queryClient.invalidateQueries({ queryKey: ['ranking'] })
    },
  })
}
