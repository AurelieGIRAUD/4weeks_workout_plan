import { Bar, BarChart, CartesianGrid, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export interface BarDatum {
  label: string
  value: number
  /** Extra line shown in the tooltip and the table, e.g. "3 sessions". */
  detail?: string
}

const AXIS_TICK = { fill: 'var(--lh-axis)', fontSize: 12 }

function ChartTooltip({ active, payload, unit }: { active?: boolean; payload?: { payload: BarDatum }[]; unit: string }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-xl border border-line bg-card px-3 py-2 text-sm shadow-lg">
      <p className="font-bold">{d.label}</p>
      <p className="text-muted">
        <span className="mr-1.5 inline-block size-2.5 rounded-sm bg-[var(--lh-chart)] align-middle" aria-hidden />
        {d.value.toLocaleString()} {unit}
      </p>
      {d.detail && <p className="text-muted">{d.detail}</p>}
    </div>
  )
}

function TableView({ data, unit, labelHeader }: { data: BarDatum[]; unit: string; labelHeader: string }) {
  return (
    <details className="mt-2 text-sm">
      <summary className="cursor-pointer font-semibold text-muted">View as table</summary>
      <table className="mt-2 w-full tabular-nums">
        <thead>
          <tr className="text-left text-muted">
            <th className="py-1 font-semibold">{labelHeader}</th>
            <th className="py-1 text-right font-semibold">{unit}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.label} className="border-t border-line">
              <td className="py-1">{d.label}</td>
              <td className="py-1 text-right">
                {d.value.toLocaleString()}
                {d.detail && <span className="ml-2 text-muted">({d.detail})</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  )
}

/** Vertical columns over time (days or weeks). Single series, so no legend. */
export function ColumnChart({
  data,
  unit,
  labelHeader,
  goal,
  ariaLabel,
  height = 200,
}: {
  data: BarDatum[]
  unit: string
  labelHeader: string
  goal?: { value: number; label: string }
  ariaLabel: string
  height?: number
}) {
  return (
    <div>
      <div role="img" aria-label={ariaLabel} style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 16, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--lh-grid)" />
            <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: 'var(--lh-grid)' }} interval="preserveStartEnd" />
            <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} width={48} />
            <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ fill: 'var(--lh-card-2)', radius: 6 }} />
            {goal && (
              <ReferenceLine
                y={goal.value}
                stroke="var(--lh-chart-goal)"
                strokeWidth={1}
                label={{ value: goal.label, position: 'insideTopRight', fill: 'var(--lh-axis)', fontSize: 11 }}
              />
            )}
            <Bar dataKey="value" fill="var(--lh-chart)" radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <TableView data={data} unit={unit} labelHeader={labelHeader} />
    </div>
  )
}

/** Horizontal bars for categories, value at the tip. */
export function HBarChart({ data, unit, labelHeader, ariaLabel }: { data: BarDatum[]; unit: string; labelHeader: string; ariaLabel: string }) {
  const height = Math.max(80, data.length * 34 + 16)
  return (
    <div>
      <div role="img" aria-label={ariaLabel} style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }} barCategoryGap={8}>
            <XAxis type="number" hide allowDecimals={false} />
            <YAxis type="category" dataKey="label" tick={{ ...AXIS_TICK, fill: 'var(--lh-muted)' }} tickLine={false} axisLine={false} width={96} />
            <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ fill: 'var(--lh-card-2)', radius: 6 }} />
            <Bar dataKey="value" fill="var(--lh-chart)" radius={[0, 4, 4, 0]} maxBarSize={20}>
              <LabelList dataKey="value" position="right" fill="var(--lh-muted)" fontSize={12} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <TableView data={data} unit={unit} labelHeader={labelHeader} />
    </div>
  )
}
