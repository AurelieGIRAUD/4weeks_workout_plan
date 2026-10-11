import type { ReactNode } from 'react'

/** Circular meter. The track is a lighter step of the same hue as the fill. */
export function ProgressRing({
  value,
  max,
  size = 72,
  stroke = 8,
  trackClass = 'stroke-emerald-100 dark:stroke-emerald-500/15',
  fillClass = 'stroke-emerald-500',
  children,
  label,
}: {
  value: number
  max: number
  size?: number
  stroke?: number
  trackClass?: string
  fillClass?: string
  children?: ReactNode
  label: string
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.min(1, max > 0 ? value / max : 0)
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="meter" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={label}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className={trackClass} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className={fillClass}
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.34, 1.2, 0.64, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  )
}
