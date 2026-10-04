import { api } from '../api.ts'
import { useLoad } from '../hooks.ts'
import { Card, ErrorBanner, Spinner } from './ui.tsx'

export function PatternsView() {
  const { data, loading, error, reload } = useLoad(() => api.patterns())
  if (loading) return <Spinner label="Finding patterns…" />
  if (error) return <ErrorBanner error={error} onRetry={reload} />
  if (!data || data.totalItems === 0) return <Card>Patterns appear once you have confirmed action items from a few meetings.</Card>

  const max = Math.max(...Object.values(data.byWorkType))
  return (
    <div className="space-y-4">
      <Card>
        <h3 className="mb-3 font-medium">Work by type</h3>
        <div className="space-y-2">
          {Object.entries(data.byWorkType).sort((a, b) => b[1] - a[1]).map(([type, n]) => (
            <div key={type} className="grid grid-cols-[8rem_1fr_2rem] items-center gap-3 text-sm sm:grid-cols-[11rem_1fr_2rem]">
              <span className="truncate">{type}</span>
              <div className="h-3 rounded bg-stone-100"><div className="h-3 rounded bg-teal-700" style={{ width: `${(n / max) * 100}%` }} /></div>
              <span className="text-right">{n}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h3 className="mb-3 font-medium">Keeps coming back</h3>
        {data.recurring.length ? (
          <ul className="space-y-3">
            {data.recurring.map((c, i) => (
              <li key={i} className="text-sm">
                <p className="font-medium">{c.label}</p>
                <p className="text-stone-600">{c.count} mentions across {c.meetingDates.length} meetings · {c.workType}{c.owners.length ? ` · ${c.owners.join(', ')}` : ''}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-stone-600">No repeated items yet.</p>
        )}
      </Card>
      <Card>
        <h3 className="mb-3 font-medium">Open work by person</h3>
        <ul className="space-y-1 text-sm">
          {Object.entries(data.ownerLoad).sort((a, b) => b[1].open - a[1].open).map(([name, l]) => (
            <li key={name} className="flex justify-between"><span>{name}</span><span className="text-stone-600">{l.open} open{l.high ? ` · ${l.high} high priority` : ''}</span></li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
