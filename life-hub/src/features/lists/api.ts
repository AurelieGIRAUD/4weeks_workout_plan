import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useUserId } from '@/auth/AuthProvider'
import { useProfile } from '@/lib/profile'
import { supabase, unwrap } from '@/lib/supabase'
import type { List, ListInvite, ListItem, ListMember, ListType } from '@/lib/types'

export const listKeys = {
  lists: ['lists'] as const,
  items: ['items'] as const,
  openItems: ['items', 'open'] as const,
  archived: (listId: string) => ['items', 'archived', listId] as const,
  members: (listId: string) => ['list-members', listId] as const,
}

export function useLists() {
  return useQuery({
    queryKey: listKeys.lists,
    queryFn: async () =>
      unwrap(
        await supabase
          .from('lists')
          .select('*, owner:profiles!lists_owner_id_fkey(id, email, display_name), members:list_members(user_id)')
          .order('created_at'),
      ) as List[],
  })
}

/** Every non-archived item the user can see (own + shared lists). Small enough for a personal app. */
export function useOpenItems() {
  return useQuery({
    queryKey: listKeys.openItems,
    queryFn: async () =>
      unwrap(
        await supabase.from('list_items').select('*').is('archived_at', null).order('created_at', { ascending: false }),
      ) as ListItem[],
  })
}

export function useArchivedItems(listId: string, enabled: boolean) {
  return useQuery({
    queryKey: listKeys.archived(listId),
    enabled,
    queryFn: async () =>
      unwrap(
        await supabase
          .from('list_items')
          .select('*')
          .eq('list_id', listId)
          .not('archived_at', 'is', null)
          .order('archived_at', { ascending: false }),
      ) as ListItem[],
  })
}

/** The list quick-add uses for a type: the user's chosen target, else their default list. */
export function useQuickAddTargets() {
  const userId = useUserId()
  const { data: lists } = useLists()
  const { data: profile } = useProfile()
  return (type: ListType): List | undefined => {
    const chosen = profile?.quick_add_targets?.[type]
    return (
      lists?.find((l) => l.id === chosen) ?? lists?.find((l) => l.type === type && l.is_default && l.owner_id === userId)
    )
  }
}

type NewItem = Pick<ListItem, 'list_id' | 'title'> & Partial<Pick<ListItem, 'note' | 'category' | 'tags'>>

export function useAddItem() {
  const qc = useQueryClient()
  const userId = useUserId()
  return useMutation({
    mutationFn: async (item: NewItem) =>
      unwrap(await supabase.from('list_items').insert({ ...item, created_by: userId }).select('*').single()) as ListItem,
    onSuccess: (item) => {
      qc.setQueryData<ListItem[]>(listKeys.openItems, (old) => (old ? [item, ...old.filter((i) => i.id !== item.id)] : old))
      qc.invalidateQueries({ queryKey: listKeys.items })
    },
  })
}

type ItemPatch = Partial<Pick<ListItem, 'title' | 'note' | 'category' | 'tags' | 'done' | 'list_id' | 'archived_at'>>

/** Optimistic: the checkbox flips instantly, and rolls back on error. */
export function useUpdateItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: ItemPatch }) =>
      unwrap(await supabase.from('list_items').update(patch).eq('id', id).select('*').single()) as ListItem,
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: listKeys.openItems })
      const prev = qc.getQueryData<ListItem[]>(listKeys.openItems)
      qc.setQueryData<ListItem[]>(listKeys.openItems, (old) =>
        old
          ?.map((i) =>
            i.id === id
              ? { ...i, ...patch, done_at: patch.done === undefined ? i.done_at : patch.done ? new Date().toISOString() : null }
              : i,
          )
          .filter((i) => !i.archived_at),
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => ctx?.prev && qc.setQueryData(listKeys.openItems, ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: listKeys.items }),
  })
}

export function useDeleteItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => unwrap(await supabase.from('list_items').delete().eq('id', id)),
    onMutate: async (id) => {
      qc.setQueryData<ListItem[]>(listKeys.openItems, (old) => old?.filter((i) => i.id !== id))
    },
    onSettled: () => qc.invalidateQueries({ queryKey: listKeys.items }),
  })
}

export function useArchiveCompleted() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (listId: string) =>
      unwrap(
        await supabase
          .from('list_items')
          .update({ archived_at: new Date().toISOString() })
          .eq('list_id', listId)
          .eq('done', true)
          .is('archived_at', null)
          .select('id'),
      ) as { id: string }[],
    onSettled: () => qc.invalidateQueries({ queryKey: listKeys.items }),
  })
}

export function useRestoreItems() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ids: string[]) =>
      unwrap(await supabase.from('list_items').update({ archived_at: null }).in('id', ids)),
    onSettled: () => qc.invalidateQueries({ queryKey: listKeys.items }),
  })
}

export function useCreateList() {
  const qc = useQueryClient()
  const userId = useUserId()
  return useMutation({
    mutationFn: async (input: { name: string; type: ListType }) =>
      unwrap(await supabase.from('lists').insert({ ...input, owner_id: userId }).select('*').single()) as List,
    onSettled: () => qc.invalidateQueries({ queryKey: listKeys.lists }),
  })
}

export function useRenameList() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) =>
      unwrap(await supabase.from('lists').update({ name }).eq('id', id)),
    onSettled: () => qc.invalidateQueries({ queryKey: listKeys.lists }),
  })
}

export function useDeleteList() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => unwrap(await supabase.from('lists').delete().eq('id', id)),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: listKeys.lists })
      qc.invalidateQueries({ queryKey: listKeys.items })
    },
  })
}

// ---------------------------------------------------------------- sharing

export function useListMembers(listId: string, enabled = true) {
  return useQuery({
    queryKey: listKeys.members(listId),
    enabled,
    queryFn: async () => {
      const [members, invites] = await Promise.all([
        supabase
          .from('list_members')
          .select('list_id, user_id, created_at, profile:profiles!list_members_user_id_fkey(id, email, display_name)')
          .eq('list_id', listId)
          .order('created_at'),
        supabase.from('list_invites').select('list_id, email, created_at').eq('list_id', listId).order('created_at'),
      ])
      return {
        members: unwrap(members) as unknown as ListMember[],
        invites: unwrap(invites) as ListInvite[],
      }
    },
  })
}

export function useShareList() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ listId, email }: { listId: string; email: string }) =>
      unwrap(await supabase.rpc('share_list', { p_list_id: listId, p_email: email })) as 'added' | 'invited' | 'already',
    onSettled: (_d, _e, { listId }) => {
      qc.invalidateQueries({ queryKey: listKeys.members(listId) })
      qc.invalidateQueries({ queryKey: listKeys.lists })
    },
  })
}

export function useRemoveMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ listId, userId }: { listId: string; userId: string }) =>
      unwrap(await supabase.from('list_members').delete().eq('list_id', listId).eq('user_id', userId)),
    onSettled: (_d, _e, { listId }) => {
      qc.invalidateQueries({ queryKey: listKeys.members(listId) })
      qc.invalidateQueries({ queryKey: listKeys.lists })
      qc.invalidateQueries({ queryKey: listKeys.items })
    },
  })
}

export function useCancelInvite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ listId, email }: { listId: string; email: string }) =>
      unwrap(await supabase.from('list_invites').delete().eq('list_id', listId).eq('email', email)),
    onSettled: (_d, _e, { listId }) => qc.invalidateQueries({ queryKey: listKeys.members(listId) }),
  })
}
