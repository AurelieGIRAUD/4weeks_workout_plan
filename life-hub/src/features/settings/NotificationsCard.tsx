import { Bell, BellOff, Send, Share } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/components/Toast'
import { Button, Card, ErrorNote, Field, inputClass } from '@/components/ui'
import { useProfile, useUpdateProfile } from '@/lib/profile'
import { usePushStatus } from '@/lib/push'

const HOURS = Array.from({ length: 24 }, (_, h) => h)

function timezones(current: string): string[] {
  const all = (Intl as typeof Intl & { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.('timeZone') ?? []
  return all.includes(current) ? all : [current, ...all]
}

export function NotificationsCard() {
  const push = usePushStatus()
  const { data: profile } = useProfile()
  const update = useUpdateProfile()
  const toast = useToast()
  const [error, setError] = useState<unknown>(null)

  const run = (fn: () => Promise<unknown>, ok?: string) => async () => {
    setError(null)
    try {
      await fn()
      if (ok) toast(ok)
    } catch (e) {
      setError(e)
    }
  }

  return (
    <Card id="notifications">
      <h2 className="mb-1 text-lg font-extrabold">Reminders</h2>
      <p className="mb-4 text-sm text-muted">Beauty care push notifications when a treatment is due.</p>

      {push.iosNeedsInstall ? (
        <div className="rounded-2xl bg-sky-50 p-4 text-sm dark:bg-sky-500/10">
          <p className="mb-2 font-bold">On iPhone and iPad, install Life Hub first</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Tap <Share className="inline size-4" aria-label="Share" /> in Safari
            </li>
            <li>Choose “Add to Home Screen”</li>
            <li>Open Life Hub from your home screen and come back here</li>
          </ol>
          <p className="mt-2 text-xs text-muted">Requires iOS 16.4 or later.</p>
        </div>
      ) : !push.supported ? (
        <p className="rounded-2xl bg-card-2 p-4 text-sm text-muted">
          Push notifications aren't available in this browser
          {import.meta.env.VITE_VAPID_PUBLIC_KEY ? '' : ' (VITE_VAPID_PUBLIC_KEY is not set)'}.
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {push.subscribed && push.permission === 'granted' ? (
            <>
              <span className="mr-auto inline-flex items-center gap-2 font-semibold text-emerald-600 dark:text-emerald-300">
                <Bell className="size-5" aria-hidden /> On for this device
              </span>
              <Button variant="soft" accent="settings" size="sm" onClick={run(push.test, 'Test sent. Check your notifications!')}>
                <Send className="size-4" aria-hidden /> Send test
              </Button>
              <Button variant="ghost" size="sm" onClick={run(push.disable, 'Notifications turned off')} loading={push.busy}>
                <BellOff className="size-4" aria-hidden /> Turn off
              </Button>
            </>
          ) : (
            <Button accent="beauty" onClick={run(push.enable, 'Notifications on 🎉')} loading={push.busy}>
              <Bell className="size-4" aria-hidden /> Turn on notifications
            </Button>
          )}
        </div>
      )}

      {profile && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Remind me at">
            {(id) => (
              <select
                id={id}
                className={inputClass}
                value={profile.reminder_hour}
                onChange={(e) => update.mutate({ reminder_hour: Number(e.target.value) })}
              >
                {HOURS.map((h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Time zone">
            {(id) => (
              <select id={id} className={inputClass} value={profile.timezone} onChange={(e) => update.mutate({ timezone: e.target.value })}>
                {timezones(profile.timezone).map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
      )}
      <div className="mt-3">
        <ErrorNote error={error ?? update.error} />
      </div>
    </Card>
  )
}
