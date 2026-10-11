import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { QueryClient } from '@tanstack/react-query'

const WEEK = 1000 * 60 * 60 * 24 * 7

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: WEEK,
      // Serve cached data immediately when offline instead of erroring.
      networkMode: 'offlineFirst',
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: { networkMode: 'online' },
  },
})

export const persister = createSyncStoragePersister({
  storage: typeof window === 'undefined' ? undefined : window.localStorage,
  key: 'lifehub-cache',
  throttleTime: 1000,
})

export const PERSIST_MAX_AGE = WEEK
export const CACHE_BUSTER = 'v1'
