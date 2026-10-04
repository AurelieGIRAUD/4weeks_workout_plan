import { WifiOff } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { ACCENTS, type ModuleKey } from '@/lib/meta'
import { cx } from './ui'

const NAV: ModuleKey[] = ['home', 'lists', 'workouts', 'beauty', 'settings']

function subscribeOnline(cb: () => void) {
  window.addEventListener('online', cb)
  window.addEventListener('offline', cb)
  return () => {
    window.removeEventListener('online', cb)
    window.removeEventListener('offline', cb)
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export function useOnline() {
  return useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true)
}

export default function Layout() {
  const online = useOnline()

  return (
    <div className="min-h-dvh md:flex">
      {/* Sidebar (tablet / desktop) */}
      <nav
        aria-label="Main"
        className="pt-safe sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-1 border-r border-line bg-card/60 p-4 backdrop-blur md:flex"
      >
        <div className="mb-6 flex items-center gap-2 px-2 pt-2">
          <span className="text-2xl" aria-hidden>
            🌈
          </span>
          <span className="text-xl font-extrabold tracking-tight">Life Hub</span>
        </div>
        {NAV.map((key) => {
          const a = ACCENTS[key]
          const Icon = a.icon
          return (
            <NavLink
              key={key}
              to={a.to}
              end={a.to === '/'}
              className={({ isActive }) =>
                cx(
                  'flex items-center gap-3 rounded-2xl px-3 py-2.5 font-semibold transition',
                  isActive ? cx(a.soft, a.text) : 'text-muted hover:bg-card-2 hover:text-ink',
                )
              }
            >
              <Icon className="size-5" aria-hidden />
              {a.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="min-w-0 flex-1">
        {!online && (
          <div className="pt-safe sticky top-0 z-40 flex items-center justify-center gap-2 bg-amber-400 px-4 py-1.5 text-sm font-semibold text-amber-950">
            <WifiOff className="size-4" aria-hidden /> Offline: showing saved data. Changes need a connection.
          </div>
        )}
        <main className={cx('pb-nav mx-auto w-full max-w-5xl px-4 pt-4 sm:px-6 md:pt-8', online && 'pt-safe')}>
          <Outlet />
        </main>
      </div>

      {/* Bottom tab bar (phone) */}
      <nav
        aria-label="Main"
        className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/85 backdrop-blur-lg md:hidden"
      >
        <ul className="mx-auto flex max-w-md justify-around px-2 pt-1.5">
          {NAV.map((key) => {
            const a = ACCENTS[key]
            const Icon = a.icon
            return (
              <li key={key}>
                <NavLink
                  to={a.to}
                  end={a.to === '/'}
                  className={({ isActive }) =>
                    cx(
                      'flex w-16 flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[11px] font-bold transition active:scale-90',
                      isActive ? a.text : 'text-muted',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className={cx('grid h-8 w-12 place-items-center rounded-full transition', isActive && a.soft)}>
                        <Icon className={cx('size-5', isActive && 'animate-pop')} aria-hidden />
                      </span>
                      {a.label}
                    </>
                  )}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
