import { beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '../server/src/app.ts'
import { openDb } from '../server/src/db.ts'
import { createRepo } from '../server/src/repo.ts'
import { fallbackExtract, type Extractor } from '../server/src/extractor.ts'

const extractor: Extractor = {
  async extract(t, d) {
    return { items: fallbackExtract(t, d), extractedBy: 'fallback' }
  },
}
const TRANSCRIPT = 'Asha: I will fix the refresh error by friday. It is urgent.\nRavi: I am blocked waiting on Fabric workspace access.'

let app: ReturnType<typeof createApp>
beforeEach(() => {
  app = createApp({ repo: createRepo(openDb(':memory:')), extractor })
})

describe('meetings API', () => {
  it('creates a meeting with extracted draft items', async () => {
    const res = await request(app).post('/api/meetings').send({ transcript: TRANSCRIPT, meetingDate: '2026-10-05' })
    expect(res.status).toBe(201)
    expect(res.body.items.length).toBeGreaterThanOrEqual(2)
    expect(res.body.items.every((i: { status: string }) => i.status === 'draft')).toBe(true)
    expect(res.body.meeting.confirmed).toBe(false)
  })

  it('rejects short transcripts with a friendly message', async () => {
    const res = await request(app).post('/api/meetings').send({ transcript: 'hi' })
    expect(res.status).toBe(400)
    expect(res.body.code).toBe('TRANSCRIPT_TOO_SHORT')
    expect(res.body.error).not.toMatch(/stack|undefined|TypeError/i)
  })

  it('rejects bad dates and bad ids', async () => {
    const bad = await request(app).post('/api/meetings').send({ transcript: TRANSCRIPT, meetingDate: '5 Oct' })
    expect(bad.body.code).toBe('BAD_DATE')
    expect((await request(app).get('/api/meetings/abc')).body.code).toBe('BAD_ID')
    expect((await request(app).get('/api/meetings/999')).status).toBe(404)
  })

  it('confirm flow: draft items become confirmed and appear in patterns', async () => {
    const created = await request(app).post('/api/meetings').send({ transcript: TRANSCRIPT, meetingDate: '2026-10-05' })
    const id = created.body.meeting.id
    const confirmed = await request(app).post(`/api/meetings/${id}/confirm`)
    expect(confirmed.body.meeting.confirmed).toBe(true)
    expect(confirmed.body.items.every((i: { status: string }) => i.status === 'confirmed')).toBe(true)
    const patterns = await request(app).get('/api/patterns')
    expect(patterns.body.totalItems).toBeGreaterThan(0)
  })
})

describe('items API', () => {
  it('lets a user correct an extracted item', async () => {
    const created = await request(app).post('/api/meetings').send({ transcript: TRANSCRIPT, meetingDate: '2026-10-05' })
    const item = created.body.items[0]
    const res = await request(app).patch(`/api/items/${item.id}`).send({ owner: 'Meera', priority: 'low', dueDate: '2026-10-20' })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ owner: 'Meera', priority: 'low', dueDate: '2026-10-20' })
  })

  it('validates item updates', async () => {
    const created = await request(app).post('/api/meetings').send({ transcript: TRANSCRIPT, meetingDate: '2026-10-05' })
    const id = created.body.items[0].id
    expect((await request(app).patch(`/api/items/${id}`).send({ priority: 'urgent' })).body.code).toBe('BAD_PRIORITY')
    expect((await request(app).patch(`/api/items/${id}`).send({ text: '  ' })).body.code).toBe('BAD_TEXT')
    expect((await request(app).patch('/api/items/9999').send({ text: 'x' })).status).toBe(404)
  })

  it('treats SQL-like input as plain data', async () => {
    const created = await request(app).post('/api/meetings').send({ transcript: TRANSCRIPT, meetingDate: '2026-10-05' })
    const id = created.body.items[0].id
    const res = await request(app).patch(`/api/items/${id}`).send({ owner: "x'; DROP TABLE items;--" })
    expect(res.status).toBe(200)
    expect((await request(app).get('/api/items')).status).toBe(200)
  })
})

describe('auth token', () => {
  it('blocks /api without the token but leaves /api/health open', async () => {
    const guarded = createApp({ repo: createRepo(openDb(':memory:')), extractor, appToken: 's3cret-token' })
    expect((await request(guarded).get('/api/health')).status).toBe(200)
    const denied = await request(guarded).get('/api/meetings')
    expect(denied.status).toBe(401)
    expect(denied.body.code).toBe('UNAUTHORIZED')
    expect((await request(guarded).get('/api/meetings').set('Authorization', 'Bearer s3cret-token')).status).toBe(200)
  })
})
