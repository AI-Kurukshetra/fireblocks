'use client'

import { useMemo } from 'react'
import { useApiList } from '@/hooks/use-api-list'
import type { PendingApproval } from '@/types'

export function useApprovalCount() {
  const { data, error, isLoading, reload } = useApiList<PendingApproval>({
    endpoint: '/api/v1/approvals',
  })

  const count = useMemo(() => data.length, [data])

  return {
    count,
    error,
    isLoading,
    reload,
  }
}
