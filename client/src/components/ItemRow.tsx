import { useState } from 'react'
import { api, UserError } from '../api.ts'
import type { Item, Priority } from '../types.ts'
import { PriorityBadge, btnGhost, input } from './ui.tsx'

export function ItemRow({ item, onChange, editable }: { item: Item; onChange: (i: Item) => void; editable: boolean }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    setBusy(true)
    setError('')
    try {
      const updated = await api.updateItem(item.id, {
        text: draft.text,
        owner: draft.owner || null,
        priority: draft.priority,
        dueDate: draft.dueDate || null,
        workType: draft.workType,
      })
      onChange(updated)
      setEditing(false)
    } catch (e) {
      setError(e instanceof UserError ? e.message : 'Could not save your change. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function toggleDone() {
    setBusy(true)
    try {
      onChange(await api.updateItem(item.id, { status: item.status === 'done' ? 'confirmed' : 'done' }))
    } catch (e) {
      setError(e instanceof UserError ? e.message : 'Could not update this item.')
    } finally {
      setBusy(false)
    }
  }

  if (editing) {
    return (
      <div className="space-y-3 rounded border border-teal-700 bg-white p-3">
        <textarea className={input} value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} aria-label="Description" />
        <div className="grid gap-3 sm:grid-cols-4">
          <input className={input} placeholder="Owner" value={draft.owner ?? ''} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} aria-label="Owner" />
          <select className={input} value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as Priority })} aria-label="Priority">
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <input type="date" className={input} value={draft.dueDate ?? ''} onChange={(e) => setDraft({ ...draft, dueDate: e.target.value || null })} aria-label="Due date" />
          <input className={input} value={draft.workType} onChange={(e) => setDraft({ ...draft, workType: e.target.value })} aria-label="Work type" />
        </div>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <div className="flex gap-2">
          <button className={btnGhost} onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
          <button className={btnGhost} onClick={() => { setDraft(item); setEditing(false) }}>Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded border border-stone-200 bg-white p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className={`min-w-0 flex-1 break-words ${item.status === 'done' ? 'text-stone-400 line-through' : ''}`}>{item.text}</p>
        <PriorityBadge priority={item.priority} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600">
        <span>Owner: {item.owner ?? 'Unassigned'}</span>
        <span>Due: {item.dueDate ?? 'No date'}</span>
        <span>Type: {item.workType}</span>
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
      <div className="mt-3 flex gap-2">
        {editable && <button className={btnGhost} onClick={() => setEditing(true)}>Edit</button>}
        {item.kind === 'action' && item.status !== 'draft' && (
          <button className={btnGhost} onClick={toggleDone} disabled={busy}>{item.status === 'done' ? 'Reopen' : 'Mark done'}</button>
        )}
      </div>
    </div>
  )
}
