import axios from "axios"
import { useAuthStore } from "@/stores/auth-store"
import type { ApiResponse } from "@/types/api"

// Every Java service in the BE wraps responses in this envelope (common/response/ApiResponse.java).
export class ApiError extends Error {
  errorCode: string | null
  status: number | undefined

  constructor(message: string, errorCode: string | null, status: number | undefined) {
    super(message)
    this.name = "ApiError"
    this.errorCode = errorCode
    this.status = status
  }
}

// Unwraps the shared ApiResponse<T> envelope, throwing ApiError on success=false.
export function unwrap<T>(res: ApiResponse<T>, status?: number): T {
  if (!res.success) {
    throw new ApiError(res.message ?? "Request failed", res.errorCode, status)
  }
  return res.data as T
}

// One axios instance per backend base URL, both attaching the stored JWT (harmless today since
// no service enforces it yet, but keeps the client ready for when auth enforcement lands).
export function createHttpClient(baseURL: string) {
  const client = axios.create({ baseURL })

  client.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`)
    }
    return config
  })

  return client
}
