import { useCallback, useEffect, useState } from 'react'

function readValue<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const stored = window.localStorage.getItem(key)
    return stored === null ? fallback : (JSON.parse(stored) as T)
  } catch {
    return fallback
  }
}

function writeValue<T>(key: string, value: T) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    return
  }
}

export function usePersistentState<T>(key: string, initialValue: T | (() => T)) {
  const [value, setValue] = useState<T>(() => {
    const fallback = typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue
    return readValue(key, fallback)
  })

  useEffect(() => {
    writeValue(key, value)
  }, [key, value])

  return [value, setValue] as const
}

export function useBestScore(key: string) {
  const [storedScore, setBestScore] = usePersistentState(key, 0)
  const bestScore =
    typeof storedScore === 'number' && Number.isFinite(storedScore) ? storedScore : 0
  const saveBestScore = useCallback(
    (score: number) => {
      if (!Number.isFinite(score)) return
      setBestScore((previous) =>
        Math.max(typeof previous === 'number' && Number.isFinite(previous) ? previous : 0, score),
      )
    },
    [setBestScore],
  )
  return [bestScore, saveBestScore] as const
}
