import { Download, FileJson, FileSpreadsheet } from 'lucide-react'
import { useState } from 'react'
import { useUserId } from '@/auth/AuthProvider'
import { Button, Card, ErrorNote } from '@/components/ui'
import { exportCSV, exportJSON, type CsvKind } from '@/lib/export'

export function DataCard() {
  const userId = useUserId()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<unknown>(null)

  const run = (key: string, fn: () => Promise<void>) => async () => {
    setBusy(key)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError(e)
    } finally {
      setBusy(null)
    }
  }

  const csv = (kind: CsvKind, label: string) => (
    <Button variant="soft" accent="settings" size="sm" loading={busy === kind} onClick={run(kind, () => exportCSV(userId, kind))}>
      <FileSpreadsheet className="size-4" aria-hidden /> {label}
    </Button>
  )

  return (
    <Card>
      <h2 className="mb-1 flex items-center gap-2 text-lg font-extrabold">
        <Download className="size-5" aria-hidden /> Your data
      </h2>
      <p className="mb-3 text-sm text-muted">Download everything you can see, including lists shared with you.</p>
      <div className="flex flex-wrap gap-2">
        <Button accent="settings" size="sm" loading={busy === 'json'} onClick={run('json', () => exportJSON(userId))}>
          <FileJson className="size-4" aria-hidden /> Everything (JSON)
        </Button>
        {csv('items', 'List items CSV')}
        {csv('workouts', 'Workouts CSV')}
        {csv('beauty', 'Beauty log CSV')}
      </div>
      <div className="mt-3">
        <ErrorNote error={error} />
      </div>
    </Card>
  )
}
