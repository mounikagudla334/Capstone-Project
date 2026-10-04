import { useState } from 'react'
import { api } from '../api.ts'
import { useLoad } from '../hooks.ts'
import type { Item } from '../types.ts'
import { ItemRow } from './ItemRow.tsx'
import { Card, ErrorBanner, Spinner, input } from './ui.tsx'

export function ActionItems() {
  const [priority, setPriority] = useState('')
  const [status, setStatus] = useState('')
  const { data, setData, loading, error, reload } = useLoad(
    async () => (await api.listItems({ kind: 'action', ...(priority && { priority }), ...(status && { status }) })).filter((i) => i.status !== 'draft'),
    [priority, status],
  )
  const replace = (u: Item) => setData((data ?? []).map((i) => (i.id === u.id ? u : i)))
  const today = new Date().toISOString().slice(0, 10)
  const overdue = (data ?? []).filter((i) => i.status !== 'done' && i.dueDate && i.dueDate < today).length

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid gap-3 sm:grid-cols-3">
          <select className={input} value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Filter by priority">
            <option value="">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select className={input} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            <option value="">Open and done</option>
            <option value="confirmed">Open</option>
            <option value="done">Done</option>
          </select>
          <p className="self-center text-sm text-stone-600">{overdue > 0 ? `${overdue} overdue` : 'Nothing overdue'}</p>
        </div>
      </Card>
      {loading && <Spinner label="Loading action items…" />}
      {error && <ErrorBanner error={error} onRetry={reload} />}
      {!loading && !error && (data?.length ? (
        <div className="space-y-2">{data.map((i) => <ItemRow key={i.id} item={i} onChange={replace} editable={false} />)}</div>
      ) : (
        <Card>No confirmed action items yet. Confirm a meeting to see its items here.</Card>
      ))}
    </div>
  )
}
