'use client'

import { useEffect, useRef, useState } from 'react'
import {
  getCachedEntry,
  invalidateEndpoint,
  loadEndpoint,
  seedCachedEntry,
  subscribeToEndpoint,
} from '@/lib/api/client-cache'

interface UseApiResourceOptions<T> {
  endpoint: string
  initialData?: T | null
  enabled?: boolean
  staleMs?: number
}

export function useApiResource<T>({
  endpoint,
  initialData = null,
  enabled = true,
  staleMs = 30_000,
}: UseApiResourceOptions<T>) {
  const initialDataRef = useRef(initialData)
  seedCachedEntry(endpoint, initialDataRef.current)
  const [snapshot, setSnapshot] = useState(() =>
    getCachedEntry<T | null>(endpoint, initialDataRef.current),
  )
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const unsubscribe = subscribeToEndpoint(endpoint, () => {
      setSnapshot(getCachedEntry<T | null>(endpoint, initialDataRef.current))
    })

    if (enabled) {
      void loadEndpoint<T | null>(endpoint, {
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
