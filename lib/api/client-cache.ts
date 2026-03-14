import type { ApiResponse } from '@/types/api'

interface CacheEntry {
  data: unknown
  error: string | null
  isLoading: boolean
  updatedAt: number
  inFlight?: Promise<void>
}

const cache = new Map<string, CacheEntry>()
const listeners = new Map<string, Set<() => void>>()

function emit(endpoint: string) {
  const endpointListeners = listeners.get(endpoint)
  if (!endpointListeners) {
    return
  }

  for (const listener of endpointListeners) {
    listener()
  }
}

export function getCachedEntry<T>(endpoint: string, fallback: T) {
  const entry = cache.get(endpoint)

  return {
    data: (entry?.data as T | undefined) ?? fallback,
    error: entry?.error ?? null,
    isLoading: entry?.isLoading ?? false,
    updatedAt: entry?.updatedAt ?? 0,
  }
}

export function seedCachedEntry<T>(endpoint: string, data: T) {
  if (cache.has(endpoint)) {
    return
  }

  cache.set(endpoint, {
    data,
    error: null,
    isLoading: false,
    updatedAt: 0,
  })
}

export function subscribeToEndpoint(endpoint: string, listener: () => void) {
  const endpointListeners = listeners.get(endpoint) ?? new Set<() => void>()
  endpointListeners.add(listener)
  listeners.set(endpoint, endpointListeners)

  return () => {
    const current = listeners.get(endpoint)
    if (!current) {
      return
    }

    current.delete(listener)
    if (current.size === 0) {
      listeners.delete(endpoint)
    }
  }
}

export async function loadEndpoint<T>(
  endpoint: string,
  options?: {
    force?: boolean
    staleMs?: number
  },
) {
  const force = options?.force ?? false
  const staleMs = options?.staleMs ?? 15_000
  const current = cache.get(endpoint)
  const now = Date.now()

  if (!force && current?.inFlight) {
    return current.inFlight
  }

  if (!force && current && current.updatedAt > 0 && now - current.updatedAt < staleMs) {
    return
  }

  const nextEntry: CacheEntry = {
    data: current?.data ?? null,
    error: null,
    isLoading: true,
    updatedAt: current?.updatedAt ?? 0,
  }

  cache.set(endpoint, nextEntry)
  emit(endpoint)

  const request = (async () => {
    try {
      const response = await fetch(endpoint, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      const payload = (await response.json()) as ApiResponse<T>

      if (payload.error) {
        throw new Error(payload.error.message)
      }

      cache.set(endpoint, {
        data: payload.data,
        error: null,
        isLoading: false,
        updatedAt: Date.now(),
      })
    } catch (error) {
      cache.set(endpoint, {
        data: current?.data ?? null,
        error: error instanceof Error ? error.message : 'Failed to load data',
        isLoading: false,
        updatedAt: current?.updatedAt ?? 0,
      })
    } finally {
      emit(endpoint)
    }
  })()

  cache.set(endpoint, {
    ...nextEntry,
    inFlight: request,
  })

  return request
}

export function invalidateEndpoint(endpoint: string) {
  const current = cache.get(endpoint)
  if (!current) {
    return
  }

  cache.set(endpoint, {
    ...current,
    updatedAt: 0,
  })
  emit(endpoint)
}
