import type { DatabaseSync } from 'node:sqlite'
import type { ExtractedItem, Item, ItemStatus, Meeting, Priority } from './types.ts'

type Row = Record<string, unknown>

const toMeeting = (r: Row): Meeting => ({
  id: r.id as number,
  title: r.title as string,
  meetingDate: r.meeting_date as string,
  transcript: r.transcript as string,
  extractedBy: r.extracted_by as Meeting['extractedBy'],
  confirmed: r.confirmed === 1,
  createdAt: r.created_at as string,
})

const toItem = (r: Row): Item => ({
  id: r.id as number,
  meetingId: r.meeting_id as number,
  kind: r.kind as Item['kind'],
  text: r.text as string,
  owner: (r.owner as string | null) ?? null,
  priority: r.priority as Priority,
  dueDate: (r.due_date as string | null) ?? null,
  workType: r.work_type as string,
  status: r.status as ItemStatus,
  createdAt: r.created_at as string,
})

export function createRepo(db: DatabaseSync) {
  return {
    createMeeting(
      m: { title: string; meetingDate: string; transcript: string; extractedBy: Meeting['extractedBy'] },
      items: ExtractedItem[],
    ): { meeting: Meeting; items: Item[] } {
      db.exec('BEGIN')
      try {
        const res = db
          .prepare('INSERT INTO meetings (title, meeting_date, transcript, extracted_by) VALUES (?, ?, ?, ?)')
          .run(m.title, m.meetingDate, m.transcript, m.extractedBy)
        const meetingId = Number(res.lastInsertRowid)
        const ins = db.prepare(
          'INSERT INTO items (meeting_id, kind, text, owner, priority, due_date, work_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
        )
        for (const i of items) ins.run(meetingId, i.kind, i.text, i.owner, i.priority, i.dueDate, i.workType)
        db.exec('COMMIT')
        return { meeting: this.getMeeting(meetingId)!, items: this.itemsForMeeting(meetingId) }
      } catch (e) {
        db.exec('ROLLBACK')
        throw e
      }
    },
    listMeetings(): Meeting[] {
      return (db.prepare('SELECT * FROM meetings ORDER BY meeting_date DESC, id DESC').all() as Row[]).map(toMeeting)
    },
    getMeeting(id: number): Meeting | null {
      const r = db.prepare('SELECT * FROM meetings WHERE id = ?').get(id) as Row | undefined
      return r ? toMeeting(r) : null
    },
    itemsForMeeting(id: number): Item[] {
      return (db.prepare('SELECT * FROM items WHERE meeting_id = ? ORDER BY id').all(id) as Row[]).map(toItem)
    },
    confirmMeeting(id: number): boolean {
      const r = db.prepare('UPDATE meetings SET confirmed = 1 WHERE id = ?').run(id)
      if (Number(r.changes) === 0) return false
      db.prepare("UPDATE items SET status = 'confirmed' WHERE meeting_id = ? AND status = 'draft'").run(id)
      return true
    },
    deleteMeeting(id: number): boolean {
      return Number(db.prepare('DELETE FROM meetings WHERE id = ?').run(id).changes) > 0
    },
    getItem(id: number): Item | null {
      const r = db.prepare('SELECT * FROM items WHERE id = ?').get(id) as Row | undefined
      return r ? toItem(r) : null
    },
    updateItem(id: number, p: Partial<Pick<Item, 'text' | 'owner' | 'priority' | 'dueDate' | 'workType' | 'status'>>): Item | null {
      const cur = this.getItem(id)
      if (!cur) return null
      const n = { ...cur, ...p }
      db.prepare(
        'UPDATE items SET text = ?, owner = ?, priority = ?, due_date = ?, work_type = ?, status = ? WHERE id = ?',
      ).run(n.text, n.owner, n.priority, n.dueDate, n.workType, n.status, id)
      return this.getItem(id)
    },
    listItems(f: { status?: string; owner?: string; priority?: string; kind?: string }): Item[] {
      const where: string[] = []
      const args: string[] = []
      for (const [col, val] of [
        ['status', f.status],
        ['owner', f.owner],
        ['priority', f.priority],
        ['kind', f.kind],
      ] as const) {
        if (val) {
          where.push(`${col} = ?`)
          args.push(val)
        }
      }
      const sql = `SELECT * FROM items ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY COALESCE(due_date, '9999-12-31'), id`
      return (db.prepare(sql).all(...args) as Row[]).map(toItem)
    },
    confirmedActionItems(): (Item & { meetingDate: string })[] {
      const rows = db
        .prepare(
          `SELECT i.*, m.meeting_date FROM items i JOIN meetings m ON m.id = i.meeting_id
           WHERE i.kind = 'action' AND i.status IN ('confirmed','done') ORDER BY m.meeting_date`,
        )
        .all() as Row[]
      return rows.map((r) => ({ ...toItem(r), meetingDate: r.meeting_date as string }))
    },
  }
}
export type Repo = ReturnType<typeof createRepo>
