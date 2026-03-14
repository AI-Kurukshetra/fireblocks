import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/types/api'

export function ok<T>(data: T, meta?: Record<string, unknown>, init?: ResponseInit) {
  return NextResponse.json<ApiResponse<T>>(
    {
      data,
      error: null,
      ...(meta ? { meta } : {}),
    },
    init,
  )
}

export function fail(
  code: string,
  message: string,
  status = 400,
  details?: Record<string, unknown>,
  meta?: Record<string, unknown>,
) {
  return NextResponse.json<ApiResponse<never>>(
    {
      data: null,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
      ...(meta ? { meta } : {}),
    },
    { status },
  )
}
