import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getPracticeNext, submitPracticeRedo } from "@/api/learners"
import type { PracticeAttempt } from "@/types/api"

export function usePracticeNext(userId: string, limit = 10) {
  return useQuery({
    queryKey: ["learner", userId, "practice", "next", limit],
    queryFn: () => getPracticeNext(userId, limit),
    enabled: !!userId,
  })
}

export function useSubmitPracticeRedo(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (attempts: PracticeAttempt[]) => submitPracticeRedo(userId, { attempts }),
    onSuccess: () => {
      // Forgetting scores change for every learner query, not just this one - refresh them all.
      void queryClient.invalidateQueries({ queryKey: ["learner", userId] })
    },
  })
}
