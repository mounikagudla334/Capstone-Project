import { api } from '../api.ts'
import { useLoad } from '../hooks.ts'
import { Card, ErrorBanner, Spinner } from './ui.tsx'

export function MeetingList({ onOpen }: { onOpen: (id: number) => void }) {
  const { data, loading, error, reload } = useLoad(() => api.listMeetings())
  if (loading) return <Spinner label="Loading meetings…" />
  if (error) return <ErrorBanner error={error} onRetry={reload} />
  if (!data?.length) return <Card>No meetings yet. Add your first standup transcript.</Card>
  return (
    <ul className="space-y-3">
      {data.map((m) => (
        <li key={m.id}>
          <button onClick={() => onOpen(m.id)} className="w-full rounded border border-stone-200 bg-white p-4 text-left hover:border-teal-700">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">{m.title}</span>
              <span className={`rounded px-2 py-0.5 text-xs ${m.confirmed ? 'bg-teal-100 text-teal-800' : 'bg-amber-100 text-amber-800'}`}>
                {m.confirmed ? 'Confirmed' : 'Needs review'}
              </span>
            </div>
            <div className="mt-1 text-sm text-stone-600">{m.meetingDate}</div>
          </button>
        </li>
      ))}
    </ul>
  )
}
