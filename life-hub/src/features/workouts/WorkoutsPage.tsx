import { EmptyState, PageHeader } from '@/components/ui'

export default function WorkoutsPage() {
  return (
    <>
      <PageHeader module="workouts" title="Workouts" />
      <EmptyState emoji="🚧" title="Coming in the next milestone" />
    </>
  )
}
