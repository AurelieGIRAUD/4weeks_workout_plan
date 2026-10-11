import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useUserId } from '@/auth/AuthProvider'
import { userTimezone } from './dates'
import { supabase, unwrap } from './supabase'
import type { Profile } from './types'

export const profileKey = (userId: string) => ['profile', userId] as const

export function useProfile() {
  const userId = useUserId()
  return useQuery({
    queryKey: profileKey(userId),
    queryFn: async () => unwrap(await supabase.from('profiles').select('*').eq('id', userId).single()) as Profile,
  })
}

type ProfilePatch = Partial<Pick<Profile, 'display_name' | 'timezone' | 'reminder_hour' | 'quick_add_targets'>>

export function useUpdateProfile() {
  const userId = useUserId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (patch: ProfilePatch) =>
      unwrap(await supabase.from('profiles').update(patch).eq('id', userId).select('*').single()) as Profile,
    onSuccess: (profile) => qc.setQueryData(profileKey(userId), profile),
  })
}

/** New accounts start in UTC; adopt the device timezone once so reminders fire at local time. */
export function useAdoptDeviceTimezone() {
  const { data: profile } = useProfile()
  const update = useUpdateProfile()
  const { mutate } = update
  useEffect(() => {
    if (!profile) return
    const tz = userTimezone()
    if (profile.timezone === 'UTC' && tz !== 'UTC') mutate({ timezone: tz })
  }, [profile, mutate])
}
