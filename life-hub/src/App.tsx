import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthProvider'
import LoginPage from './auth/LoginPage'
import Layout from './components/Layout'
import { Spinner } from './components/ui'
import HomePage from './features/home/HomePage'
import ListDetailPage from './features/lists/ListDetailPage'
import ListsPage from './features/lists/ListsPage'
import { useAdoptDeviceTimezone } from './lib/profile'
import { usePushSync } from './lib/push'

const WorkoutsPage = lazy(() => import('./features/workouts/WorkoutsPage'))
const BeautyPage = lazy(() => import('./features/beauty/BeautyPage'))
const SettingsPage = lazy(() => import('./features/settings/SettingsPage'))

function SignedInApp() {
  useAdoptDeviceTimezone()
  usePushSync()
  return (
    <Suspense fallback={<Spinner className="mx-auto mt-16" />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="lists" element={<ListsPage />} />
          <Route path="lists/:listId" element={<ListDetailPage />} />
          <Route path="workouts" element={<WorkoutsPage />} />
          <Route path="beauty" element={<BeautyPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default function App() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  return <BrowserRouter>{session ? <SignedInApp /> : <LoginPage />}</BrowserRouter>
}
