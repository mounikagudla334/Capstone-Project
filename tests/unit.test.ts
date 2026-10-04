import { describe, expect, it } from 'vitest'
import { resolveDueDate, isIsoDate } from '../server/src/dates.ts'
import { classifyWorkType, similarity, buildPatterns } from '../server/src/grouping.ts'
import { fallbackExtract, parseModelJson, sanitizeItems } from '../server/src/extractor.ts'

describe('dates', () => {
  // 2026-10-05 is a Monday
  it('resolves relative phrases from the meeting date', () => {
    expect(resolveDueDate('I will send it today', '2026-10-05')).toBe('2026-10-05')
    expect(resolveDueDate('done tomorrow', '2026-10-05')).toBe('2026-10-06')
    expect(resolveDueDate('by friday', '2026-10-05')).toBe('2026-10-09')
    expect(resolveDueDate('next week', '2026-10-05')).toBe('2026-10-12')
  })
  it('returns null when no date is present', () => {
    expect(resolveDueDate('looking into the pipeline', '2026-10-05')).toBeNull()
  })
  it('validates ISO dates', () => {
    expect(isIsoDate('2026-10-05')).toBe(true)
    expect(isIsoDate('05/10/2026')).toBe(false)
    expect(isIsoDate('2026-13-45')).toBe(false)
  })
})

describe('grouping', () => {
  it('classifies work types', () => {
    expect(classifyWorkType('Blocked on access request from IT')).toBe('blocked on dependency')
    expect(classifyWorkType('Fix the crash in the refresh job')).toBe('bug fix')
    expect(classifyWorkType('Send the weekly status email to the client')).toBe('client follow-up')
    expect(classifyWorkType('Lunch order')).toBe('other')
  })
  it('scores similar sentences higher than unrelated ones', () => {
    const a = similarity('Waiting on Fabric workspace access', 'Still waiting for Fabric workspace access')
    const b = similarity('Waiting on Fabric workspace access', 'Update the roadmap slides')
    expect(a).toBeGreaterThan(0.4)
    expect(b).toBeLessThan(0.2)
  })
  it('flags items that recur across different meeting dates', () => {
    const mk = (id: number, text: string, d: string) =>
      ({ id, meetingId: id, kind: 'action', text, owner: 'Asha', priority: 'high', dueDate: null, workType: 'blocked on dependency', status: 'confirmed', createdAt: d, meetingDate: d }) as const
    const p = buildPatterns([
      mk(1, 'Waiting on Fabric workspace access', '2026-10-01'),
      mk(2, 'Still waiting for Fabric workspace access', '2026-10-02'),
      mk(3, 'Update roadmap slides', '2026-10-02'),
    ] as never)
    expect(p.recurring).toHaveLength(1)
    expect(p.recurring[0].count).toBe(2)
    expect(p.ownerLoad.Asha.open).toBe(3)
  })
})

describe('extractor', () => {
  it('fallback finds actions, owners, priority and due dates', () => {
    const items = fallbackExtract(
      'Asha: I will fix the refresh error by friday. This is urgent.\nRavi: Dashboard looks good.',
      '2026-10-05',
    )
    const action = items.find((i) => i.text.includes('refresh'))!
    expect(action.kind).toBe('action')
    expect(action.owner).toBe('Asha')
    expect(action.dueDate).toBe('2026-10-09')
    expect(items.find((i) => i.text.includes('Dashboard'))!.kind).toBe('discussion')
  })
  it('parses JSON even when the model wraps it in prose', () => {
    expect(parseModelJson('Here you go:\n[{"a":1}]\nThanks')).toEqual([{ a: 1 }])
    expect(() => parseModelJson('no json here')).toThrow()
  })
  it('sanitizes untrusted model output', () => {
    const items = sanitizeItems([
      { kind: 'action', text: 'Ship it', owner: '  Asha ', priority: 'urgent!!', dueDate: 'not a date' },
      { kind: 'weird', text: '' },
      'garbage',
    ])
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ owner: 'Asha', priority: 'medium', dueDate: null, kind: 'action' })
  })
})
