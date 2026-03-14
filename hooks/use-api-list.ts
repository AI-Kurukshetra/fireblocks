'use client'

import { useEffect, useRef, useState } from 'react'
import {
  getCachedEntry,
  invalidateEndpoint,
  loadEndpoint,
  seedCachedEntry,
  subscribeToEndpoint,
} from '@/lib/api/client-cache'

interface UseApiListOptions<T> {
  endpoint: string
  initialData?: T[]
  enabled?: boolean
  staleMs?: number
}

export function useApiList<T>({
  endpoint,
  initialData = [],
  enabled = true,
  staleMs = 15_000,
}: UseApiListOptions<T>) {
  const initialDataRef = useRef(initialData)
  seedCachedEntry(endpoint, initialDataRef.current)
  const [snapshot, setSnapshot] = useState(() =>
    getCachedEntry<T[]>(endpoint, initialDataRef.current),
  )
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const unsubscribe = subscribeToEndpoint(endpoint, () => {
      setSnapshot(getCachedEntry<T[]>(endpoint, initialDataRef.current))
    })

    if (enabled) {
      void loadEndpoint<T[]>(endpoint, {
        force: reloadKey > 0,
        staleMs,
      })
    }

    return unsubscribe
  }, [enabled, endpoint, reloadKey, staleMs])

  return {
    data: snapshot.data,
    isLoading: snapshot.isLoading,
    error: snapshot.error,
    reload: () => {
      invalidateEndpoint(endpoint)
      setReloadKey((current) => current + 1)
    },
  }
}
