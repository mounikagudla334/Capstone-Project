import { useState } from 'react'
import { api, UserError } from '../api.ts'
import { useLoad } from '../hooks.ts'
import type { Item } from '../types.ts'
import { ItemRow } from './ItemRow.tsx'
import { Card, ErrorBanner, Spinner, btn, btnGhost } from './ui.tsx'

export function MeetingDetail({ id, onBack }: { id: number; onBack: () => void }) {
  const { data, setData, loading, error, reload } = useLoad(() => api.getMeeting(id), [id])
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<UserError | null>(null)

  if (loading) return <Spinner label="Loading meeting…" />
  if (error) return <ErrorBanner error={error} onRetry={reload} />
  if (!data) return null

  const { meeting, items } = data
  const replace = (u: Item) => setData({ meeting, items: items.map((i) => (i.id === u.id ? u : i)) })
  const actions = items.filter((i) => i.kind === 'action')
  const discussion = items.filter((i) => i.kind === 'discussion')

  async function run(fn: () => Promise<unknown>) {
    setBusy(true)
    setActionError(null)
    try {
      await fn()
    } catch (e) {
      setActionError(e instanceof UserError ? e : new UserError('Something went wrong. Please try again.', 'UNKNOWN'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <button className="text-sm text-teal-800 underline" onClick={onBack}>← All meetings</button>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{meeting.title}</h2>
            <p className="text-sm text-stone-600">
              {meeting.meetingDate} · {meeting.extractedBy === 'claude' ? 'Extracted by Claude' : 'Extracted by simple rules (no AI key set)'}
            </p>
          </div>
          <div className="flex gap-2">
            {!meeting.confirmed && (
              <button className={btn} disabled={busy} onClick={() => run(async () => setData(await api.confirmMeeting(id)))}>
                {busy ? 'Saving…' : 'Confirm all'}
              </button>
            )}
            <button
              className={btnGhost}
              disabled={busy}
              onClick={() => {
                if (window.confirm('Delete this meeting and all its items?')) run(async () => { await api.deleteMeeting(id); onBack() })
              }}
            >
              Delete
            </button>
          </div>
        </div>
        {!meeting.confirmed && <p className="mt-3 text-sm text-amber-800">Check the items below, fix anything wrong, then confirm. Only confirmed items appear in patterns.</p>}
      </Card>
      {actionError && <ErrorBanner error={actionError} />}
      <section>
        <h3 className="mb-2 font-medium">Action items ({actions.length})</h3>
        <div className="space-y-2">
          {actions.length ? actions.map((i) => <ItemRow key={i.id} item={i} onChange={replace} editable />) : <p className="text-sm text-stone-600">No action items found.</p>}
        </div>
      </section>
      <section>
        <h3 className="mb-2 font-medium">Discussion points ({discussion.length})</h3>
        <div className="space-y-2">
          {discussion.length ? discussion.map((i) => <ItemRow key={i.id} item={i} onChange={replace} editable />) : <p className="text-sm text-stone-600">No discussion points found.</p>}
        </div>
      </section>
    </div>
  )
}
