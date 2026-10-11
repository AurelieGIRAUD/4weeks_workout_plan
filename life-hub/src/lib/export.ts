import { toCSV } from './csv'
import { todayISO } from './dates'
import { isIOS } from './push'
import { supabase, unwrap } from './supabase'

async function fetchAll(table: string, select = '*', order = 'created_at') {
  const pageSize = 1000
  const rows: Record<string, unknown>[] = []
  for (let from = 0; ; from += pageSize) {
    const page = unwrap(
      await supabase.from(table).select(select).order(order).range(from, from + pageSize - 1),
    ) as unknown as Record<string, unknown>[]
    rows.push(...page)
    if (page.length < pageSize) return rows
  }
}

export async function collectExport(userId: string) {
  const [profile, lists, items, workouts, treatments, treatmentLogs] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single().then(unwrap),
    fetchAll('lists'),
    fetchAll('list_items'),
    fetchAll('workouts', '*', 'date'),
    fetchAll('treatments'),
    fetchAll('treatment_logs', '*', 'done_on'),
  ])
  return { exported_at: new Date().toISOString(), app: 'life-hub', version: 1, profile, lists, items, workouts, treatments, treatmentLogs }
}

/** Saves a file. On iOS the share sheet is the reliable way out of an installed PWA. */
export async function saveFile(name: string, content: string, type: string) {
  const file = new File([content], name, { type })
  if (isIOS() && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name })
      return
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
    }
  }
  const url = URL.createObjectURL(file)
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function exportJSON(userId: string) {
  const data = await collectExport(userId)
  await saveFile(`life-hub-${todayISO()}.json`, JSON.stringify(data, null, 2), 'application/json')
}

export type CsvKind = 'items' | 'workouts' | 'beauty'

export async function exportCSV(userId: string, kind: CsvKind) {
  const data = await collectExport(userId)
  const listName = new Map(data.lists.map((l) => [l.id, l.name]))
  const listType = new Map(data.lists.map((l) => [l.id, l.type]))
  const treatmentName = new Map(data.treatments.map((t) => [t.id, t.name]))
  const day = todayISO()

  if (kind === 'items') {
    const rows = data.items.map((i) => ({ ...i, list: listName.get(i.list_id), list_type: listType.get(i.list_id) }))
    await saveFile(
      `life-hub-items-${day}.csv`,
      toCSV(rows, ['list', 'list_type', 'title', 'done', 'category', 'tags', 'note', 'created_at', 'done_at', 'archived_at']),
      'text/csv',
    )
  } else if (kind === 'workouts') {
    await saveFile(
      `life-hub-workouts-${day}.csv`,
      toCSV(data.workouts, ['date', 'training_type', 'body_parts', 'duration_min', 'notes', 'created_at']),
      'text/csv',
    )
  } else {
    const rows = data.treatmentLogs.map((l) => ({ ...l, treatment: treatmentName.get(l.treatment_id) }))
    await saveFile(`life-hub-beauty-${day}.csv`, toCSV(rows, ['treatment', 'done_on', 'note', 'created_at']), 'text/csv')
  }
}
