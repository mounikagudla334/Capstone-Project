import type { ReactNode } from 'react'
import type { UserError } from '../api.ts'

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-3 py-8 text-stone-600">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-stone-300 border-t-teal-700" />
      <span>{label}</span>
    </div>
  )
}

export function ErrorBanner({ error, onRetry }: { error: UserError; onRetry?: () => void }) {
  return (
    <div role="alert" className="my-4 flex flex-wrap items-center justify-between gap-3 rounded border border-red-200 bg-red-50 p-4 text-red-800">
      <span>{error.message}</span>
      {onRetry && (
        <button onClick={onRetry} className="rounded bg-red-700 px-3 py-1.5 text-sm text-white hover:bg-red-800">
          Try again
        </button>
      )}
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded border border-stone-200 bg-white p-4 sm:p-5 ${className}`}>{children}</div>
}

const PRIORITY_STYLE = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-stone-100 text-stone-700',
} as const

export function PriorityBadge({ priority }: { priority: 'high' | 'medium' | 'low' }) {
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLE[priority]}`}>{priority}</span>
}

export const btn = 'rounded bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50'
export const btnGhost = 'rounded border border-stone-300 bg-white px-3 py-1.5 text-sm hover:bg-stone-100 disabled:opacity-50'
export const input = 'w-full rounded border border-stone-300 bg-white px-3 py-2 text-sm focus:border-teal-700 focus:outline-none'
