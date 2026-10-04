export type Priority = 'high' | 'medium' | 'low'
export type ItemStatus = 'draft' | 'confirmed' | 'done'

export interface Item {
  id: number
  meetingId: number
  kind: 'action' | 'discussion'
  text: string
  owner: string | null
  priority: Priority
  dueDate: string | null
  workType: string
  status: ItemStatus
}

export interface Meeting {
  id: number
  title: string
  meetingDate: string
  extractedBy: 'claude' | 'fallback'
  confirmed: boolean
}

export interface Patterns {
  totalItems: number
  byWorkType: Record<string, number>
  ownerLoad: Record<string, { open: number; high: number }>
  recurring: {
    label: string
    workType: string
    count: number
    meetingDates: string[]
    owners: string[]
  }[]
}
