import { addDays } from 'date-fns'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useUserId } from '@/auth/AuthProvider'
import { fromISODate, todayISO, toISODate } from '@/lib/dates'
import { supabase, unwrap } from '@/lib/supabase'
import type { Treatment, TreatmentLog, TreatmentStatus } from '@/lib/types'

export const beautyKeys = {
  all: ['treatments'] as const,
  list: ['treatments', 'status'] as const,
  logs: (id: string) => ['treatments', 'logs', id] as const,
}

export function useTreatments() {
  return useQuery({
    queryKey: beautyKeys.list,
    queryFn: async () => unwrap(await supabase.from('treatment_status').select('*').order('name')) as TreatmentStatus[],
  })
}

export function useTreatmentLogs(treatmentId: string | null) {
  return useQuery({
    queryKey: beautyKeys.logs(treatmentId ?? ''),
    enabled: !!treatmentId,
    queryFn: async () =>
      unwrap(
        await supabase
          .from('treatment_logs')
          .select('*')
          .eq('treatment_id', treatmentId!)
          .order('done_on', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(100),
      ) as TreatmentLog[],
  })
}

export type TreatmentInput = Pick<Treatment, 'name' | 'emoji' | 'interval_days' | 'notes' | 'remind' | 'active'>

export function useSaveTreatment() {
  const qc = useQueryClient()
  const userId = useUserId()
  return useMutation({
    mutationFn: async ({ id, input, lastDone }: { id?: string; input: TreatmentInput; lastDone?: string | null }) => {
      if (id) {
        return unwrap(await supabase.from('treatments').update(input).eq('id', id).select('*').single()) as Treatment
      }
      const created = unwrap(
        await supabase.from('treatments').insert({ ...input, user_id: userId }).select('*').single(),
      ) as Treatment
      if (lastDone) {
        unwrap(await supabase.from('treatment_logs').insert({ treatment_id: created.id, user_id: userId, done_on: lastDone }))
      }
      return created
    },
    onSettled: () => qc.invalidateQueries({ queryKey: beautyKeys.all }),
  })
}

export function useDeleteTreatment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => unwrap(await supabase.from('treatments').delete().eq('id', id)),
    onSettled: () => qc.invalidateQueries({ queryKey: beautyKeys.all }),
  })
}

/** Optimistic so the card turns green right away. */
export function useLogTreatment() {
  const qc = useQueryClient()
  const userId = useUserId()
  return useMutation({
    mutationFn: async ({ treatmentId, doneOn, note }: { treatmentId: string; doneOn?: string; note?: string | null }) =>
      unwrap(
        await supabase
          .from('treatment_logs')
          .insert({ treatment_id: treatmentId, user_id: userId, done_on: doneOn ?? todayISO(), note: note || null })
          .select('*')
          .single(),
      ) as TreatmentLog,
    onMutate: async ({ treatmentId, doneOn }) => {
      await qc.cancelQueries({ queryKey: beautyKeys.list })
      const prev = qc.getQueryData<TreatmentStatus[]>(beautyKeys.list)
      const day = doneOn ?? todayISO()
      qc.setQueryData<TreatmentStatus[]>(beautyKeys.list, (old) =>
        old?.map((t) =>
          t.id === treatmentId && (!t.last_done || day >= t.last_done)
            ? { ...t, last_done: day, snoozed_until: null, log_count: t.log_count + 1 }
            : t,
        ),
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(beautyKeys.list, ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: beautyKeys.all }),
  })
}

export function useDeleteLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => unwrap(await supabase.from('treatment_logs').delete().eq('id', id)),
    onSettled: () => qc.invalidateQueries({ queryKey: beautyKeys.all }),
  })
}

export function useSnoozeTreatment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, days }: { id: string; days: number }) =>
      unwrap(
        await supabase
          .from('treatments')
          .update({ snoozed_until: toISODate(addDays(fromISODate(todayISO()), days)) })
          .eq('id', id),
      ),
    onSettled: () => qc.invalidateQueries({ queryKey: beautyKeys.all }),
  })
}
