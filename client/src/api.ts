import type { Item, Meeting, Patterns } from './types.ts'

const TOKEN_KEY = 'mno-token'
const getToken = () => {
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? ''
  } catch {
    return ''
  }
}
export const saveToken = (t: string) => {
  try {
    sessionStorage.setItem(TOKEN_KEY, t)
  } catch {
    /* storage may be unavailable; the app still works for this page view */
  }
}

/** Error whose message is always safe to show to a user. */
export class UserError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message)
  }
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(`/api${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        ...init.headers,
      },
    })
  } catch {
    throw new UserError('We could not reach the server. Check your connection and try again.', 'NETWORK')
  }
  if (res.status === 204) return undefined as T
  let body: { error?: string; code?: string } | null = null
  try {
    body = await res.json()
  } catch {
    /* non-JSON response */
  }
  if (!res.ok) throw new UserError(body?.error ?? 'Something went wrong. Please try again.', body?.code ?? 'UNKNOWN')
  return body as T
}

export const api = {
  createMeeting: (b: { title: string; meetingDate: string; transcript: string }) =>
    call<{ meeting: Meeting; items: Item[] }>('/meetings', { method: 'POST', body: JSON.stringify(b) }),
  listMeetings: () => call<Meeting[]>('/meetings'),
  getMeeting: (id: number) => call<{ meeting: Meeting; items: Item[] }>(`/meetings/${id}`),
  confirmMeeting: (id: number) => call<{ meeting: Meeting; items: Item[] }>(`/meetings/${id}/confirm`, { method: 'POST' }),
  deleteMeeting: (id: number) => call<void>(`/meetings/${id}`, { method: 'DELETE' }),
  listItems: (q: Record<string, string>) => call<Item[]>(`/items?${new URLSearchParams(q)}`),
  updateItem: (id: number, patch: Partial<Item>) => call<Item>(`/items/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  patterns: () => call<Patterns>('/patterns'),
}
