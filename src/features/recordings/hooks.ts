import { useMutation, useQueryClient } from "@tanstack/react-query"
import { uploadRecording } from "@/api/recordings"
import { learnerOverviewKey } from "@/features/dashboard/hooks"

export function useUploadRecording(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: uploadRecording,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: learnerOverviewKey(userId) })
    },
  })
}
