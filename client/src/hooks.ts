import { useCallback, useEffect, useState } from 'react'
import { UserError } from './api.ts'

/** Loads data and exposes loading and friendly-error state for every fetch. */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<UserError | null>(null)

  const run = useCallback(() => {
    setLoading(true)
    setError(null)
    fn()
      .then(setData)
      .catch((e) => setError(e instanceof UserError ? e : new UserError('Something went wrong. Please try again.', 'UNKNOWN')))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(run, [run])
  return { data, setData, loading, error, reload: run }
}
