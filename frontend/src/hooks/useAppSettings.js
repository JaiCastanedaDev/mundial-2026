import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useAppSettings() {
  return useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('app_settings').select('key, value_text')
      if (error) throw error

      return Object.fromEntries((data ?? []).map((item) => [item.key, item.value_text]))
    },
    staleTime: 60_000,
    refetchInterval: 300_000,
  })
}
