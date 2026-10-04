import { cx } from './ui'

const COLORS = ['bg-violet-500', 'bg-pink-500', 'bg-amber-500', 'bg-emerald-500', 'bg-sky-500', 'bg-orange-500', 'bg-teal-500']

function hash(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function Avatar({ name, email, className }: { name?: string | null; email: string; className?: string }) {
  const label = name || email
  const initials = label
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')
  return (
    <span
      className={cx(
        'inline-grid size-8 shrink-0 place-items-center rounded-full text-xs font-extrabold text-white ring-2 ring-card',
        COLORS[hash(email) % COLORS.length],
        className,
      )}
      title={label}
      aria-label={label}
    >
      {initials}
    </span>
  )
}
