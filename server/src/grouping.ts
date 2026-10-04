import type { Item } from './types.ts'

const RULES: [string, RegExp][] = [
  ['blocked on dependency', /\b(block(ed|er|ing)?|waiting (on|for)|depend(s|ency|encies)?|access request|pending approval)\b/i],
  ['bug fix', /\b(bug|fix(es|ed)?|error|crash|broken|defect|regression|fail(s|ed|ing)?)\b/i],
  ['client follow-up', /\b(client|customer|stakeholder|follow[- ]?up|reply|email|call with|sync with)\b/i],
  ['data / reporting', /\b(report|dashboard|data|pipeline|refresh|metric|kpi|query|dataset|model)\b/i],
  ['planning', /\b(plan|estimate|roadmap|scope|prioriti[sz]e|sprint|schedule|timeline)\b/i],
]

export function classifyWorkType(text: string): string {
  for (const [type, re] of RULES) if (re.test(text)) return type
  return 'other'
}

const STOP = new Set(
  'a an the and or to of for in on at is are was be will with by it this that we i you our my from as up out need needs should'.split(' '),
)

export function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2 && !STOP.has(t)),
  )
}

export function similarity(a: string, b: string): number {
  const A = tokens(a)
  const B = tokens(b)
  if (A.size === 0 || B.size === 0) return 0
  let inter = 0
  for (const t of A) if (B.has(t)) inter++
  return inter / (A.size + B.size - inter)
}

export interface Cluster {
  label: string
  workType: string
  count: number
  meetingDates: string[]
  owners: string[]
  items: { id: number; text: string; meetingDate: string; owner: string | null }[]
}

type ItemWithDate = Item & { meetingDate: string }

export function buildPatterns(items: ItemWithDate[], threshold = 0.4) {
  const clusters: ItemWithDate[][] = []
  for (const it of items) {
    const home = clusters.find((c) => c.some((m) => m.workType === it.workType && similarity(m.text, it.text) >= threshold))
    if (home) home.push(it)
    else clusters.push([it])
  }
  const recurring: Cluster[] = clusters
    .map((c) => ({
      label: c[0].text,
      workType: c[0].workType,
      count: c.length,
      meetingDates: [...new Set(c.map((x) => x.meetingDate))].sort(),
      owners: [...new Set(c.map((x) => x.owner).filter((o): o is string => !!o))],
      items: c.map((x) => ({ id: x.id, text: x.text, meetingDate: x.meetingDate, owner: x.owner })),
    }))
    .filter((c) => c.meetingDates.length >= 2)
    .sort((a, b) => b.count - a.count)

  const byWorkType: Record<string, number> = {}
  const ownerLoad: Record<string, { open: number; high: number }> = {}
  for (const it of items) {
    byWorkType[it.workType] = (byWorkType[it.workType] ?? 0) + 1
    const o = it.owner ?? 'Unassigned'
    ownerLoad[o] ??= { open: 0, high: 0 }
    if (it.status !== 'done') ownerLoad[o].open++
    if (it.status !== 'done' && it.priority === 'high') ownerLoad[o].high++
  }
  return { totalItems: items.length, byWorkType, ownerLoad, recurring }
}
