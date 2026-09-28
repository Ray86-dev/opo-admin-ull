import { useEffect, useState, type DependencyList } from 'react'

export function useAsync<T>(fn: () => Promise<T>, deps: DependencyList): { data: T | undefined; loading: boolean } {
  const [state, setState] = useState<{ data: T | undefined; loading: boolean }>({ data: undefined, loading: true })
  useEffect(() => {
    let alive = true
    setState((s) => ({ data: s.data, loading: true }))
    fn().then((data) => alive && setState({ data, loading: false }))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return state
}
