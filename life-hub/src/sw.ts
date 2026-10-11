/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

declare let self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<string | { url: string; revision: string | null }> }

// App shell: precached so the app opens offline. Data comes from the
// persisted TanStack Query cache, so Supabase responses are not cached here.
self.skipWaiting()
clientsClaim()
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))

// ---------------------------------------------------------------- Web Push

interface ReminderPayload {
  title: string
  body: string
  tag?: string
  url?: string
  treatmentId?: string
  token?: string
  actionUrl?: string
}

type ActionOptions = NotificationOptions & { actions?: { action: string; title: string }[] }

self.addEventListener('push', (event) => {
  let data: ReminderPayload
  try {
    data = event.data?.json() as ReminderPayload
  } catch {
    data = { title: 'Life Hub', body: event.data?.text() ?? '' }
  }

  const options: ActionOptions = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag,
    data,
    // Shown on Android/desktop. iOS ignores actions; tapping opens the
    // treatment in the app, which offers Done and Snooze.
    actions: data.token
      ? [
          { action: 'done', title: '✓ Done' },
          { action: 'snooze', title: '💤 Snooze 1 day' },
        ]
      : undefined,
  }
  event.waitUntil(self.registration.showNotification(data.title, options))
})

async function openApp(url: string) {
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
  for (const client of windows) {
    if ('focus' in client) {
      await client.focus()
      if ('navigate' in client) await (client as WindowClient).navigate(url).catch(() => undefined)
      return
    }
  }
  await self.clients.openWindow(url)
}

async function notifyClients() {
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
  windows.forEach((c) => c.postMessage({ type: 'treatments-changed' }))
}

self.addEventListener('notificationclick', (event) => {
  const data = (event.notification.data ?? {}) as ReminderPayload
  event.notification.close()

  if ((event.action === 'done' || event.action === 'snooze') && data.token && data.actionUrl) {
    event.waitUntil(
      fetch(data.actionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: data.token, action: event.action, days: 1 }),
      })
        .then(async (res) => {
          if (!res.ok) throw new Error(`reminder-action ${res.status}`)
          await notifyClients()
        })
        // If the quick action fails (offline, expired token), open the app instead.
        .catch(() => openApp(data.url ?? '/beauty')),
    )
    return
  }

  event.waitUntil(openApp(data.url ?? '/'))
})
