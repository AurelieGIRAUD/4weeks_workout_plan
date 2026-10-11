import { LogOut, Monitor, Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { Button, Card, Chip, ErrorNote, Field, inputClass, PageHeader } from '@/components/ui'
import { useProfile, useUpdateProfile } from '@/lib/profile'
import { useTheme, type ThemeChoice } from '@/lib/theme'
import { DataCard } from './DataCard'
import { InstallCard } from './InstallCard'
import { NotificationsCard } from './NotificationsCard'

const THEMES: { value: ThemeChoice; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

export default function SettingsPage() {
  const { signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const { data: profile } = useProfile()
  const update = useUpdateProfile()
  const [name, setName] = useState('')

  useEffect(() => setName(profile?.display_name ?? ''), [profile?.display_name])

  const { hash } = useLocation()
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [hash])

  return (
    <>
      <PageHeader module="settings" title="Settings" subtitle={profile?.email} />
      <div className="grid gap-4 lg:grid-cols-2">
        <InstallCard />
        <Card>
          <h2 className="mb-3 text-lg font-extrabold">Profile</h2>
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              update.mutate({ display_name: name.trim() || null })
            }}
          >
            <Field label="Display name" hint="Shown to people you share lists with.">
              {(id) => <input id={id} className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />}
            </Field>
            <Button type="submit" accent="settings" loading={update.isPending} className="self-start">
              Save
            </Button>
            <ErrorNote error={update.error} />
          </form>
        </Card>

        <NotificationsCard />

        <Card>
          <h2 className="mb-3 text-lg font-extrabold">Appearance</h2>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Theme">
            {THEMES.map(({ value, label, icon: Icon }) => (
              <Chip key={value} selected={theme === value} selectedClass="bg-sky-500 text-white" onClick={() => setTheme(value)}>
                <Icon className="size-4" aria-hidden /> {label}
              </Chip>
            ))}
          </div>
        </Card>

        <DataCard />

        <Card>
          <h2 className="mb-3 text-lg font-extrabold">Account</h2>
          <Button variant="soft" accent="settings" onClick={signOut}>
            <LogOut className="size-4" aria-hidden /> Sign out
          </Button>
        </Card>
      </div>
    </>
  )
}
