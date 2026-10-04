import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

export const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

export const isStandalone = () =>
  matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

export const pushSupported = () =>
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && Boolean(VAPID_PUBLIC_KEY)

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  const out = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

async function register(sub: PushSubscription) {
  const json = sub.toJSON()
  const { error } = await supabase.rpc('register_push_subscription', {
    p_endpoint: sub.endpoint,
    p_p256dh: json.keys?.p256dh,
    p_auth: json.keys?.auth,
    p_user_agent: navigator.userAgent.slice(0, 300),
  })
  if (error) throw new Error(error.message)
}

async function currentSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null
  const reg = await navigator.serviceWorker.ready
  return reg.pushManager.getSubscription()
}

export function usePushStatus() {
  const supported = typeof window !== 'undefined' && pushSupported()
  const [permission, setPermission] = useState<NotificationPermission>(supported ? Notification.permission : 'default')
  const [subscribed, setSubscribed] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!supported) return
    currentSubscription().then((s) => setSubscribed(Boolean(s)))
  }, [supported])

  const enable = useCallback(async () => {
    setBusy(true)
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') throw new Error('Notifications are blocked. Allow them in your browser or iOS settings.')
      const reg = await navigator.serviceWorker.ready
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!) }))
      await register(sub)
      setSubscribed(true)
    } finally {
      setBusy(false)
    }
  }, [])

  const disable = useCallback(async () => {
    setBusy(true)
    try {
      const sub = await currentSubscription()
      if (sub) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        await sub.unsubscribe()
      }
      setSubscribed(false)
    } finally {
      setBusy(false)
    }
  }, [])

  const test = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke<{ devices: number; sent: number }>('push-test')
    if (error) throw error
    return data
  }, [])

  return {
    supported,
    permission,
    subscribed,
    busy,
    iosNeedsInstall: !supported && isIOS() && !isStandalone(),
    enable,
    disable,
    test,
  }
}

/**
 * Keeps this device's subscription attached to the signed-in user (endpoints
 * rotate, and another account may have used this browser), and refreshes
 * beauty data when the user acts on a notification.
 */
export function usePushSync() {
  const qc = useQueryClient()
  useEffect(() => {
    if (!pushSupported() || Notification.permission !== 'granted') return
    currentSubscription()
      .then((sub) => sub && register(sub))
      .catch((e) => console.warn('push sync failed', e))
  }, [])

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'treatments-changed') qc.invalidateQueries({ queryKey: ['treatments'] })
    }
    navigator.serviceWorker.addEventListener('message', onMessage)
    return () => navigator.serviceWorker.removeEventListener('message', onMessage)
  }, [qc])
}
