import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addDays } from 'date-fns'
import { useUserId } from '@/auth/AuthProvider'
import { fromISODate, todayISO, toISODate } from '@/lib/dates'
import { supabase, unwrap } from '@/lib/supabase'
import type { Workout } from '@/lib/types'

export const workoutKeys = {
  all: ['workouts'] as const,
  range: (from: string, to: string) => ['workouts', from, to] as const,
}

export function useWorkouts(from: string, to: string) {
  return useQuery({
    queryKey: workoutKeys.range(from, to),
    queryFn: async () =>
      unwrap(
        await supabase
          .from('workouts')
          .select('*')
          .gte('date', from)
          .lte('date', to)
          .order('date', { ascending: false })
          .order('created_at', { ascending: false }),
      ) as Workout[],
    placeholderData: (prev) => prev,
  })
}

export type WorkoutInput = Pick<Workout, 'date' | 'training_type' | 'body_parts' | 'duration_min' | 'notes'>

export function useSaveWorkout() {
  const qc = useQueryClient()
  const userId = useUserId()
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: WorkoutInput }) =>
      id
        ? unwrap(await supabase.from('workouts').update(input).eq('id', id).select('*').single())
        : unwrap(await supabase.from('workouts').insert({ ...input, user_id: userId }).select('*').single()),
    onSettled: () => qc.invalidateQueries({ queryKey: workoutKeys.all }),
  })
}

export function useDeleteWorkout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => unwrap(await supabase.from('workouts').delete().eq('id', id)),
    onSettled: () => qc.invalidateQueries({ queryKey: workoutKeys.all }),
  })
}

/** Last ~13 months up to today: enough for streaks and the home card. */
export function useRecentWorkouts() {
  const today = todayISO()
  return useWorkouts(toISODate(addDays(fromISODate(today), -400)), today)
}
