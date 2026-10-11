import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useUserId } from '@/auth/AuthProvider'
import { supabase } from './supabase'

/**
 * Live updates for lists. RLS applies to Realtime, so we only receive changes
 * for lists we own or are a member of. We simply refetch on any change; for a
 * personal app that's cheap and always correct.
 */
export function useRealtimeLists() {
  const qc = useQueryClient()
  const userId = useUserId()

  useEffect(() => {
    let timer: number | undefined
    const pending = new Set<string>()
    const invalidate = (key: string) => {
      pending.add(key)
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        pending.forEach((k) => qc.invalidateQueries({ queryKey: [k] }))
        pending.clear()
      }, 250)
    }

    const channel = supabase
      .channel(`lists-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'list_items' }, () => invalidate('items'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lists' }, () => {
        invalidate('lists')
        invalidate('items')
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'list_members' }, () => {
        invalidate('lists')
        invalidate('items')
        invalidate('list-members')
      })
      .subscribe()

    // Catch up on anything missed while the app was in the background.
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        invalidate('items')
        invalidate('lists')
      }
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
      supabase.removeChannel(channel)
    }
  }, [qc, userId])
}
