import { LogOut, Mail, UserPlus, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserId } from '@/auth/AuthProvider'
import { Avatar } from '@/components/Avatar'
import { useToast } from '@/components/Toast'
import { Button, ErrorNote, IconButton, inputClass, Sheet, Spinner } from '@/components/ui'
import type { List } from '@/lib/types'
import { useCancelInvite, useListMembers, useRemoveMember, useShareList } from './api'

export function ShareSheet({ list, open, onClose }: { list: List; open: boolean; onClose: () => void }) {
  const userId = useUserId()
  const isOwner = list.owner_id === userId
  const [email, setEmail] = useState('')
  const members = useListMembers(list.id, open)
  const share = useShareList()
  const remove = useRemoveMember()
  const cancel = useCancelInvite()
  const toast = useToast()
  const navigate = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await share.mutateAsync({ listId: list.id, email })
    toast(
      result === 'added'
        ? `🎉 Shared with ${email}`
        : result === 'invited'
          ? `✉️ ${email} will get access when they sign up`
          : `${email} already has access`,
    )
    setEmail('')
  }

  const leave = async () => {
    if (!confirm(`Leave "${list.name}"? You'll lose access until the owner shares it again.`)) return
    await remove.mutateAsync({ listId: list.id, userId })
    onClose()
    navigate('/lists')
  }

  return (
    <Sheet open={open} onClose={onClose} title={isOwner ? `Share “${list.name}”` : `People on “${list.name}”`}>
      <div className="flex flex-col gap-5">
        {isOwner && (
          <form onSubmit={submit} className="flex flex-col gap-2">
            <p className="text-sm text-muted">
              People you add can see, add, tick and edit items. Only you can rename, share or delete the list. Changes sync live.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                required
                inputMode="email"
                autoComplete="email"
                className={inputClass}
                placeholder="friend@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Email to share with"
              />
              <Button type="submit" accent="settings" loading={share.isPending} aria-label="Share">
                <UserPlus className="size-5" aria-hidden />
              </Button>
            </div>
            <ErrorNote error={share.error} />
          </form>
        )}

        <section>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">Members</h3>
          {members.isLoading ? (
            <Spinner />
          ) : (
            <ul className="flex flex-col">
              {list.owner && (
                <li className="flex items-center gap-3 py-2">
                  <Avatar name={list.owner.display_name} email={list.owner.email} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      {list.owner.display_name || list.owner.email}
                      {list.owner_id === userId && ' (you)'}
                    </span>
                    <span className="text-xs text-muted">Owner</span>
                  </span>
                </li>
              )}
              {members.data?.members.map((m) => (
                <li key={m.user_id} className="flex items-center gap-3 border-t border-line py-2">
                  <Avatar name={m.profile?.display_name} email={m.profile?.email ?? m.user_id} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      {m.profile?.display_name || m.profile?.email}
                      {m.user_id === userId && ' (you)'}
                    </span>
                    {m.profile?.display_name && <span className="block truncate text-xs text-muted">{m.profile.email}</span>}
                  </span>
                  {isOwner && (
                    <IconButton label={`Remove ${m.profile?.email}`} onClick={() => remove.mutate({ listId: list.id, userId: m.user_id })}>
                      <X className="size-5" />
                    </IconButton>
                  )}
                </li>
              ))}
              {isOwner &&
                members.data?.invites.map((i) => (
                  <li key={i.email} className="flex items-center gap-3 border-t border-line py-2">
                    <span className="grid size-8 place-items-center rounded-full bg-card-2 text-muted">
                      <Mail className="size-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{i.email}</span>
                      <span className="text-xs text-muted">Invited, joins when they sign up</span>
                    </span>
                    <IconButton label={`Cancel invite for ${i.email}`} onClick={() => cancel.mutate({ listId: list.id, email: i.email })}>
                      <X className="size-5" />
                    </IconButton>
                  </li>
                ))}
            </ul>
          )}
          {isOwner && members.data && members.data.members.length === 0 && members.data.invites.length === 0 && (
            <p className="text-sm text-muted">Only you, for now.</p>
          )}
        </section>

        {!isOwner && (
          <Button variant="ghost" onClick={leave} loading={remove.isPending} className="self-start">
            <LogOut className="size-4" aria-hidden /> Leave list
          </Button>
        )}
        <ErrorNote error={remove.error ?? cancel.error} />
      </div>
    </Sheet>
  )
}
