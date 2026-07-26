import { useMemo } from 'react'
import { buildIndex, type Index } from './data'
import { useStore } from '../store'

/** Memoized id→entity lookup maps for the current dataset. */
export function useIndex(): Index {
  const data = useStore((s) => s.data)
  return useMemo(() => buildIndex(data), [data])
}
