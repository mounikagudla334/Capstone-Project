export type Priority = 'high' | 'medium' | 'low'
export type ItemKind = 'action' | 'discussion'
export type ItemStatus = 'draft' | 'confirmed' | 'done'

export interface ExtractedItem {
  kind: ItemKind
  text: string
  owner: string | null
  priority: Priority
  dueDate: string | null // ISO yyyy-mm-dd
  workType: string
}

export interface Item extends ExtractedItem {
  id: number
  meetingId: number
  status: ItemStatus
  createdAt: string
}

export interface Meeting {
  id: number
  title: string
  meetingDate: string
  transcript: string
  extractedBy: 'claude' | 'fallback'
  confirmed: boolean
  createdAt: string
}

export const WORK_TYPES = [
  'bug fix',
  'client follow-up',
  'blocked on dependency',
  'data / reporting',
  'planning',
  'other',
] as const
