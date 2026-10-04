import { format } from 'date-fns'
import { useProfile } from '@/lib/profile'
import { ChoresCard } from './ChoresCard'
import { QuickAdd } from './QuickAdd'
import { WorkoutWeekCard } from './WorkoutWeekCard'

function greeting(hour: number) {
  if (hour < 5) return 'Up late'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function HomePage() {
  const { data: profile } = useProfile()
  const now = new Date()
  const name = profile?.display_name || profile?.email?.split('@')[0]

  return (
    <div className="flex flex-col gap-5">
      <header className="pt-2">
        <p className="text-sm font-semibold text-muted">{format(now, 'EEEE d MMMM')}</p>
        <h1 className="text-3xl font-extrabold tracking-tight">
          {greeting(now.getHours())}
          {name ? `, ${name}` : ''} <span className="inline-block animate-[lh-wiggle_1s_ease-in-out_1]">👋</span>
        </h1>
      </header>
      <QuickAdd />
      <div className="grid gap-4 lg:grid-cols-2">
        <ChoresCard />
        <WorkoutWeekCard />
      </div>
    </div>
  )
}
