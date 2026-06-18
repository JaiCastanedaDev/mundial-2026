import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useRanking() {
  return useQuery({
    queryKey: ['ranking'],
    queryFn: async () => {
      const { data, error } = await supabase.from('ranking').select('*').order('position')
      if (error) throw error
      return data ?? []
    },
    refetchInterval: 300_000,
  })
}
