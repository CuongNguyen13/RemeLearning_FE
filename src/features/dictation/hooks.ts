import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  generateAiPractice,
  getAiPractice,
  getDictationFacets,
  getDictationHistory,
  startDictationSession,
  submitDictationAttempt,
} from "@/api/learners"
import type { DictationAttemptRequest, StartDictationSessionRequest } from "@/types/api"

export function useDictationFacets(userId: string) {
  return useQuery({
    queryKey: ["learner", userId, "dictation", "facets"],
    queryFn: () => getDictationFacets(userId),
    enabled: !!userId,
  })
}

export function useStartDictationSession(userId: string) {
  return useMutation({
    mutationFn: (payload: StartDictationSessionRequest) => startDictationSession(userId, payload),
  })
}

export function useSubmitDictationAttempt(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: DictationAttemptRequest) => submitDictationAttempt(userId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["learner", userId] })
    },
  })
}

export function useDictationHistory(userId: string) {
  return useQuery({
    queryKey: ["learner", userId, "dictation", "history"],
    queryFn: () => getDictationHistory(userId),
    enabled: !!userId,
  })
}

export function useAiPractice(userId: string) {
  return useQuery({
    queryKey: ["learner", userId, "dictation", "ai-practice"],
    queryFn: () => getAiPractice(userId),
    enabled: !!userId,
  })
}

export function useGenerateAiPractice(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => generateAiPractice(userId),
    onSuccess: (items) => {
      queryClient.setQueryData(["learner", userId, "dictation", "ai-practice"], items)
    },
  })
}
