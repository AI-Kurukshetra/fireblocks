export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}

export type ApiResponse<T> =
  | {
      data: T
      error: null
      meta?: Record<string, unknown>
    }
  | {
      data: null
      error: ApiError
      meta?: Record<string, unknown>
    }
