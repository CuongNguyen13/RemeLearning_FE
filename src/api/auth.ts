import { apiClient } from "@/lib/api-client"
import { unwrap } from "@/lib/http"
import type { ApiResponse, AuthResponse, LoginRequest, RegisterRequest } from "@/types/api"

// POST /api/v1/auth/register - thin proxy to user-service, issues a real JWT (not yet enforced anywhere).
export async function register(payload: RegisterRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<ApiResponse<AuthResponse>>("/auth/register", payload)
  return unwrap(data)
}

// POST /api/v1/auth/login
export async function login(payload: LoginRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<ApiResponse<AuthResponse>>("/auth/login", payload)
  return unwrap(data)
}
