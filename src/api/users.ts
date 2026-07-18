import { apiClient } from "@/lib/api-client"
import { unwrap } from "@/lib/http"
import { userServiceClient } from "@/lib/user-service-client"
import type { ApiResponse, UpdateProfileRequest, User } from "@/types/api"

// GET /api/v1/users/{userId} - thin proxy to user-service.
export async function getUser(userId: string): Promise<User> {
  const { data } = await apiClient.get<ApiResponse<User>>(`/users/${userId}`)
  return unwrap(data)
}

// PATCH /api/v1/users/{userId} - updates the display name.
export async function updateUser(userId: string, payload: UpdateProfileRequest): Promise<User> {
  const { data } = await apiClient.patch<ApiResponse<User>>(`/users/${userId}`, payload)
  return unwrap(data)
}

// POST {user-service}/api/v1/users/{userId}/photo - direct call, bff-service doesn't proxy this
// endpoint yet (see src/lib/user-service-client.ts).
export async function uploadUserPhoto(userId: string, file: File): Promise<User> {
  const form = new FormData()
  form.append("file", file)
  const { data } = await userServiceClient.post<ApiResponse<User>>(
    `/api/v1/users/${userId}/photo`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  )
  return unwrap(data)
}
