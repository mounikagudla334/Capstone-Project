import { useState, type FormEvent } from 'react'
import { api, UserError } from '../api.ts'
import { ErrorBanner, Card, Spinner, btn, input } from './ui.tsx'

const SAMPLE = `Asha: I will fix the refresh error in the sales dashboard by Friday. It is urgent.
Ravi: I am blocked waiting on Fabric workspace access from IT.
Meera: I'll send the weekly status email to the client tomorrow.
Asha: Reminder, the new dataset looks good after the pipeline change.`

export function NewMeeting({ onCreated }: { onCreated: (id: number) => void }) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [transcript, setTranscript] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<UserError | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const { meeting } = await api.createMeeting({ title, meetingDate: date, transcript })
      onCreated(meeting.id)
    } catch (err) {
      setError(err instanceof UserError ? err : new UserError('Something went wrong. Please try again.', 'UNKNOWN'))
      setBusy(false)
    }
  }

  return (
    <Card>
      <h2 className="mb-1 text-lg font-semibold">Add a standup transcript</h2>
      <p className="mb-4 text-sm text-stone-600">Paste the transcript. We will pull out action items and discussion points for you to review.</p>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            Title (optional)
            <input className={`${input} mt-1`} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Daily standup" maxLength={120} />
          </label>
          <label className="block text-sm">
            Meeting date
            <input type="date" className={`${input} mt-1`} value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
        </div>
        <label className="block text-sm">
          Transcript
          <textarea
            className={`${input} mt-1 h-56`}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder={'Name: what they said\nName: what they said'}
            required
          />
        </label>
        {error && <ErrorBanner error={error} />}
        {busy ? (
          <Spinner label="Reading the transcript…" />
        ) : (
          <div className="flex flex-wrap gap-3">
            <button className={btn} type="submit">
              Extract notes
            </button>
            <button type="button" className="text-sm text-teal-800 underline" onClick={() => setTranscript(SAMPLE)}>
              Use a sample transcript
            </button>
          </div>
        )}
      </form>
    </Card>
  )
}
