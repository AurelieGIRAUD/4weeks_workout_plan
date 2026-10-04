import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { cx } from './ui'

interface ToastData {
  id: number
  message: string
  action?: { label: string; onClick: () => void }
  tone?: 'default' | 'error'
}

type ShowToast = (message: string, opts?: { action?: ToastData['action']; tone?: ToastData['tone'] }) => void

const ToastContext = createContext<ShowToast>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastData | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const nextId = useRef(0)

  const show = useCallback<ShowToast>((message, opts) => {
    window.clearTimeout(timer.current)
    const id = ++nextId.current
    setToast({ id, message, ...opts })
    timer.current = window.setTimeout(() => setToast((t) => (t?.id === id ? null : t)), opts?.action ? 5000 : 2600)
  }, [])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-[60] flex justify-center px-4 md:bottom-6"
      >
        {toast && (
          <div
            key={toast.id}
            className={cx(
              'animate-pop pointer-events-auto flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold shadow-xl',
              toast.tone === 'error' ? 'bg-rose-600 text-white' : 'bg-ink text-bg',
            )}
          >
            <span>{toast.message}</span>
            {toast.action && (
              <button
                className="rounded-lg px-2 py-1 font-bold text-violet-300 hover:bg-white/10 dark:text-violet-600"
                onClick={() => {
                  toast.action?.onClick()
                  setToast(null)
                }}
              >
                {toast.action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext)
