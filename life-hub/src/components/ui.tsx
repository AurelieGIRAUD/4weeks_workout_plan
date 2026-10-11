import { Loader2, X } from 'lucide-react'
import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ACCENTS, type ModuleKey } from '@/lib/meta'

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

export const inputClass =
  'w-full rounded-2xl border border-line bg-card px-4 py-2.5 text-ink placeholder:text-muted/70 ' +
  'outline-none transition focus:border-transparent focus:ring-2 focus:ring-violet-400'

export function Card({
  className,
  children,
  as: Tag = 'section',
  ...rest
}: { className?: string; children: ReactNode; as?: 'section' | 'div' | 'article' } & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag
      className={cx(
        'animate-rise rounded-3xl border border-line bg-card p-4 shadow-[0_2px_12px_-4px_rgb(80_60_140/0.12)] sm:p-5',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  )
}

type ButtonVariant = 'solid' | 'soft' | 'ghost' | 'danger'

export function Button({
  variant = 'solid',
  accent = 'home',
  size = 'md',
  loading,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  accent?: ModuleKey
  size?: 'sm' | 'md'
  loading?: boolean
}) {
  const a = ACCENTS[accent]
  const variants: Record<ButtonVariant, string> = {
    solid: cx(a.solid, 'shadow-sm'),
    soft: cx(a.soft, a.text, 'hover:brightness-95'),
    ghost: 'text-muted hover:bg-card-2 hover:text-ink',
    danger: 'bg-rose-500 text-white hover:bg-rose-600',
  }
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition active:scale-95',
        'disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        a.ring,
        size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2.5',
        variants[variant],
        className,
      )}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}

export function IconButton({
  label,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cx(
        'inline-flex size-10 items-center justify-center rounded-full text-muted transition',
        'hover:bg-card-2 hover:text-ink active:scale-90 outline-none focus-visible:ring-2 focus-visible:ring-violet-400',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

export function Chip({
  selected,
  selectedClass = 'bg-violet-500 text-white',
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean; selectedClass?: string }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cx(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition active:scale-95',
        'outline-none focus-visible:ring-2 focus-visible:ring-violet-400',
        selected ? cx(selectedClass, 'shadow-sm') : 'bg-card-2 text-muted hover:text-ink',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

export function Checkbox({
  checked,
  onChange,
  label,
  colorClass = 'bg-violet-500 border-violet-500',
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  colorClass?: string
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx(
        'grid size-6 shrink-0 place-items-center rounded-lg border-2 transition active:scale-90',
        'outline-none focus-visible:ring-2 focus-visible:ring-violet-400',
        checked ? cx(colorClass, 'animate-pop text-white') : 'border-line bg-card hover:border-muted',
      )}
    >
      {checked && (
        <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
          <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  )
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cx('size-5 animate-spin text-muted', className)} aria-label="Loading" />
}

export function EmptyState({ emoji, title, hint, action }: { emoji: string; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
      <div className="animate-pop text-4xl" aria-hidden>
        {emoji}
      </div>
      <p className="font-bold">{title}</p>
      {hint && <p className="max-w-xs text-sm text-muted">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export function PageHeader({
  module,
  title,
  subtitle,
  action,
}: {
  module: ModuleKey
  title: string
  subtitle?: ReactNode
  action?: ReactNode
}) {
  const a = ACCENTS[module]
  const Icon = a.icon
  return (
    <header className="mb-5 flex items-center gap-3">
      <div className={cx('grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-md', a.gradient)}>
        <Icon className="size-6" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-2xl font-extrabold tracking-tight">{title}</h1>
        {subtitle && <p className="truncate text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}

export function Field({ label, children, hint }: { label: string; children: (id: string) => ReactNode; hint?: string }) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-muted">
        {label}
      </label>
      {children(id)}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  )
}

/** Bottom sheet on phones, centered dialog on larger screens. */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  // Parents often pass an inline onClose; keep it in a ref so re-renders don't
  // re-run the open effect (which would steal focus while typing).
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current()
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const previouslyFocused = document.activeElement as HTMLElement | null
    // Focus the first field (or the panel) for keyboard and screen-reader users.
    requestAnimationFrame(() => {
      const first = panelRef.current?.querySelector<HTMLElement>('[data-autofocus], input, textarea, select')
      ;(first ?? panelRef.current)?.focus()
    })
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      previouslyFocused?.focus?.()
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className="animate-fade absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx(
          'animate-sheet sm:animate-pop relative flex max-h-[92dvh] w-full flex-col rounded-t-3xl border border-line bg-card shadow-2xl outline-none',
          'sm:max-w-lg sm:rounded-3xl',
        )}
      >
        <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-line sm:hidden" aria-hidden />
        <div className="flex items-center justify-between gap-2 px-5 pt-3 pb-2">
          <h2 id={titleId} className="text-lg font-extrabold">
            {title}
          </h2>
          <IconButton label="Close" onClick={onClose}>
            <X className="size-5" />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-4">{children}</div>
        {footer && <div className="pb-safe border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

export function ErrorNote({ error }: { error: unknown }) {
  if (!error) return null
  const msg = error instanceof Error ? error.message : String(error)
  return (
    <p role="alert" className="rounded-2xl bg-rose-100 px-4 py-2 text-sm font-medium text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
      {msg}
    </p>
  )
}
