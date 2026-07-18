import { useMutation, useQuery } from "@tanstack/react-query"
import { getUser, updateUser, uploadUserPhoto } from "@/api/users"
import { useAuthStore } from "@/stores/auth-store"
import type { UpdateProfileRequest } from "@/types/api"

// AuthResponse.user (from login/register) omits createdAt - fetch the full profile for that.
export function useUserProfile(userId: string) {
  return useQuery({
    queryKey: ["users", userId],
    queryFn: () => getUser(userId),
    enabled: !!userId,
  })
}

export function useUpdateProfile(userId: string) {
  const updateSession = useAuthStore((state) => state.updateUser)

  return useMutation({
    mutationFn: (payload: UpdateProfileRequest) => updateUser(userId, payload),
    onSuccess: (user) => updateSession(user),
  })
}

export function useUploadProfilePhoto(userId: string) {
  const updateSession = useAuthStore((state) => state.updateUser)

  return useMutation({
    mutationFn: (file: File) => uploadUserPhoto(userId, file),
    onSuccess: (user) => updateSession(user),
  })
}
