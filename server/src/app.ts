import express, { type NextFunction, type Request, type Response } from 'express'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { timingSafeEqual } from 'node:crypto'
import type { Repo } from './repo.ts'
import type { Extractor } from './extractor.ts'
import { isIsoDate } from './dates.ts'
import { buildPatterns } from './grouping.ts'
import type { Priority } from './types.ts'

export const MAX_TRANSCRIPT = 20_000

class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message)
  }
}

const parseId = (v: string): number => {
  const n = Number(v)
  if (!Number.isInteger(n) || n < 1) throw new HttpError(400, 'BAD_ID', 'That link does not look right. Please go back and try again.')
  return n
}

const safeEqual = (a: string, b: string) => {
  const A = Buffer.from(a)
  const B = Buffer.from(b)
  return A.length === B.length && timingSafeEqual(A, B)
}

/** Express 4 does not forward rejected promises to the error handler, so wrap async routes. */
const wrap =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next)
  }

export interface AppDeps {
  repo: Repo
  extractor: Extractor
  appToken?: string
  clientDir?: string
}

export function createApp({ repo, extractor, appToken, clientDir }: AppDeps) {
  const app = express()
  app.disable('x-powered-by')
  app.use(express.json({ limit: '100kb' }))
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('Referrer-Policy', 'no-referrer')
    next()
  })

  app.get('/api/health', (_req, res) => res.json({ ok: true }))

  // Optional shared-token auth for everything else under /api
  app.use('/api', (req, _res, next) => {
    if (!appToken) return next()
    const header = req.header('authorization') ?? ''
    const given = header.startsWith('Bearer ') ? header.slice(7) : ''
    if (!safeEqual(given, appToken)) throw new HttpError(401, 'UNAUTHORIZED', 'Please enter the access token to continue.')
    next()
  })

  app.post(
    '/api/meetings',
    wrap(async (req, res) => {
    const { title, meetingDate, transcript } = req.body ?? {}
    if (typeof transcript !== 'string' || transcript.trim().length < 10)
      throw new HttpError(400, 'TRANSCRIPT_TOO_SHORT', 'Please paste a transcript with at least a sentence or two.')
    if (transcript.length > MAX_TRANSCRIPT)
      throw new HttpError(413, 'TRANSCRIPT_TOO_LONG', `That transcript is too long. Please keep it under ${MAX_TRANSCRIPT.toLocaleString()} characters.`)
    const date = meetingDate === undefined || meetingDate === '' ? new Date().toISOString().slice(0, 10) : meetingDate
    if (!isIsoDate(date)) throw new HttpError(400, 'BAD_DATE', 'Please choose a valid meeting date.')
    const name = typeof title === 'string' && title.trim() ? title.trim().slice(0, 120) : `Standup ${date}`
    const { items, extractedBy } = await extractor.extract(transcript.trim(), date)
    const created = repo.createMeeting({ title: name, meetingDate: date, transcript: transcript.trim(), extractedBy }, items)
    res.status(201).json(created)
    }),
  )

  app.get('/api/meetings', (_req, res) => res.json(repo.listMeetings()))

  app.get('/api/meetings/:id', (req, res) => {
    const id = parseId(req.params.id)
    const meeting = repo.getMeeting(id)
    if (!meeting) throw new HttpError(404, 'MEETING_NOT_FOUND', 'We could not find that meeting. It may have been deleted.')
    res.json({ meeting, items: repo.itemsForMeeting(id) })
  })

  app.post('/api/meetings/:id/confirm', (req, res) => {
    const id = parseId(req.params.id)
    if (!repo.confirmMeeting(id)) throw new HttpError(404, 'MEETING_NOT_FOUND', 'We could not find that meeting. It may have been deleted.')
    res.json({ meeting: repo.getMeeting(id), items: repo.itemsForMeeting(id) })
  })

  app.delete('/api/meetings/:id', (req, res) => {
    if (!repo.deleteMeeting(parseId(req.params.id)))
      throw new HttpError(404, 'MEETING_NOT_FOUND', 'We could not find that meeting. It may have been deleted.')
    res.status(204).end()
  })

  app.get('/api/items', (req, res) => {
    const q = (k: string) => (typeof req.query[k] === 'string' ? (req.query[k] as string) : undefined)
    res.json(repo.listItems({ status: q('status'), owner: q('owner'), priority: q('priority'), kind: q('kind') }))
  })

  app.patch('/api/items/:id', (req, res) => {
    const id = parseId(req.params.id)
    const b = req.body ?? {}
    const patch: Parameters<Repo['updateItem']>[1] = {}
    if (b.text !== undefined) {
      if (typeof b.text !== 'string' || !b.text.trim()) throw new HttpError(400, 'BAD_TEXT', 'The item description cannot be empty.')
      patch.text = b.text.trim().slice(0, 300)
    }
    if (b.owner !== undefined) {
      if (b.owner !== null && typeof b.owner !== 'string') throw new HttpError(400, 'BAD_OWNER', 'The owner name is not valid.')
      patch.owner = b.owner ? b.owner.trim().slice(0, 60) || null : null
    }
    if (b.priority !== undefined) {
      if (!['high', 'medium', 'low'].includes(b.priority)) throw new HttpError(400, 'BAD_PRIORITY', 'Priority must be high, medium or low.')
      patch.priority = b.priority as Priority
    }
    if (b.dueDate !== undefined) {
      if (b.dueDate !== null && !isIsoDate(b.dueDate)) throw new HttpError(400, 'BAD_DATE', 'Please choose a valid due date.')
      patch.dueDate = b.dueDate
    }
    if (b.workType !== undefined) {
      if (typeof b.workType !== 'string' || !b.workType.trim()) throw new HttpError(400, 'BAD_WORK_TYPE', 'Work type cannot be empty.')
      patch.workType = b.workType.trim().slice(0, 40)
    }
    if (b.status !== undefined) {
      if (!['draft', 'confirmed', 'done'].includes(b.status)) throw new HttpError(400, 'BAD_STATUS', 'Status must be draft, confirmed or done.')
      patch.status = b.status
    }
    const item = repo.updateItem(id, patch)
    if (!item) throw new HttpError(404, 'ITEM_NOT_FOUND', 'We could not find that item. It may have been deleted.')
    res.json(item)
  })

  app.get('/api/patterns', (_req, res) => res.json(buildPatterns(repo.confirmedActionItems())))

  if (clientDir && existsSync(clientDir)) {
    app.use(express.static(clientDir))
    app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(join(clientDir, 'index.html')))
  }

  app.use('/api', (_req, _res, next) => next(new HttpError(404, 'NOT_FOUND', 'That page does not exist.')))

  // Global error handler: consistent { error, code }, no technical detail shown to users
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, code: err.code })
    const e = err as { type?: string }
    if (e?.type === 'entity.too.large')
      return res.status(413).json({ error: 'That is too much text to send at once. Please shorten it.', code: 'PAYLOAD_TOO_LARGE' })
    if (e?.type === 'entity.parse.failed')
      return res.status(400).json({ error: 'Something went wrong sending your request. Please try again.', code: 'BAD_JSON' })
    console.error(err)
    res.status(500).json({ error: 'Something went wrong on our side. Please try again in a moment.', code: 'INTERNAL' })
  })

  return app
}
