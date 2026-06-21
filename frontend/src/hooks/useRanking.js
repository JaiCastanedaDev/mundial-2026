import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useRanking() {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['ranking'],
    queryFn: async () => {
      const { data, error } = await supabase.from('ranking').select('*').order('position')
      if (error) throw error
      return data ?? []
    },
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    const channel = supabase
      .channel('ranking-live-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scores' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['ranking'] })
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
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
