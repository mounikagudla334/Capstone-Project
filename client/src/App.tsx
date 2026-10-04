import { useState } from 'react'
import { saveToken } from './api.ts'
import { ActionItems } from './components/ActionItems.tsx'
import { MeetingDetail } from './components/MeetingDetail.tsx'
import { MeetingList } from './components/MeetingList.tsx'
import { NewMeeting } from './components/NewMeeting.tsx'
import { PatternsView } from './components/PatternsView.tsx'

type Tab = 'new' | 'meetings' | 'actions' | 'patterns'
const TABS: [Tab, string][] = [['new', 'New'], ['meetings', 'Meetings'], ['actions', 'Action items'], ['patterns', 'Patterns']]

export function App() {
  const [tab, setTab] = useState<Tab>('new')
  const [openId, setOpenId] = useState<number | null>(null)
  const [tokenInput, setTokenInput] = useState('')
  const [version, setVersion] = useState(0)

  const open = (id: number) => { setOpenId(id); setTab('meetings') }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
      <header className="py-6">
        <h1 className="text-2xl font-semibold">Meeting Notes Organizer</h1>
        <p className="text-sm text-stone-600">Turn standup transcripts into trackable action items and spot what keeps coming back.</p>
      </header>
      <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-stone-200" aria-label="Sections">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => { setTab(key); setOpenId(null) }}
            className={`whitespace-nowrap px-3 py-2 text-sm ${tab === key ? 'border-b-2 border-teal-700 font-medium text-teal-800' : 'text-stone-600'}`}
          >
            {label}
          </button>
        ))}
      </nav>
      <details className="mb-4 text-xs text-stone-500">
        <summary className="cursor-pointer">Access token</summary>
        <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); saveToken(tokenInput); setVersion((v) => v + 1) }}>
          <input type="password" value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} className="flex-1 rounded border border-stone-300 px-2 py-1" placeholder="Only needed if the server requires one" />
          <button className="rounded border border-stone-300 px-2 py-1">Use</button>
        </form>
      </details>
      <main key={version}>
        {tab === 'new' && <NewMeeting onCreated={open} />}
        {tab === 'meetings' && (openId ? <MeetingDetail id={openId} onBack={() => setOpenId(null)} /> : <MeetingList onOpen={open} />)}
        {tab === 'actions' && <ActionItems />}
        {tab === 'patterns' && <PatternsView />}
      </main>
    </div>
  )
}
