const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

export const isIsoDate = (s: unknown): s is string =>
  typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s))

const fmt = (d: Date) => d.toISOString().slice(0, 10)

/** Resolve phrases like "today", "tomorrow", "by friday", "next week" relative to a meeting date. */
export function resolveDueDate(text: string, meetingDate: string): string | null {
  const base = new Date(meetingDate + 'T00:00:00Z')
  const t = text.toLowerCase()
  const add = (n: number) => {
    const d = new Date(base)
    d.setUTCDate(d.getUTCDate() + n)
    return fmt(d)
  }
  if (/\btoday\b|\beod\b/.test(t)) return fmt(base)
  if (/\btomorrow\b/.test(t)) return add(1)
  if (/\bnext week\b/.test(t)) return add(7)
  if (/\bend of (the )?week\b/.test(t)) {
    const diff = (5 - base.getUTCDay() + 7) % 7
    return add(diff)
  }
  for (let i = 0; i < DAYS.length; i++) {
    if (new RegExp(`\\b${DAYS[i]}\\b`).test(t)) {
      let diff = (i - base.getUTCDay() + 7) % 7
      if (diff === 0) diff = 7
      return add(diff)
    }
  }
  return null
}
