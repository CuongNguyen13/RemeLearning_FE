import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  generateListeningPractice,
  getListeningAttemptDetail,
  getListeningPracticeHistory,
  getListeningPracticeItem,
  getListeningPracticeItems,
  submitListeningAttempt,
} from "@/api/learners"
import type { GenerateListeningPracticeRequest, SubmitListeningAttemptRequest } from "@/types/api"

export function useListeningPracticeItems(userId: string) {
  return useQuery({
    queryKey: ["learner", userId, "learn", "listening", "items"],
    queryFn: () => getListeningPracticeItems(userId),
    enabled: !!userId,
  })
}

export function useListeningPracticeItem(userId: string, itemId: number | null) {
  return useQuery({
    queryKey: ["learner", userId, "learn", "listening", "items", itemId],
    queryFn: () => getListeningPracticeItem(userId, itemId as number),
    enabled: !!userId && itemId != null,
  })
}

export function useGenerateListeningPractice(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: GenerateListeningPracticeRequest) => generateListeningPractice(userId, request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["learner", userId, "learn", "listening"] })
    },
  })
}

export function useSubmitListeningAttempt(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SubmitListeningAttemptRequest) => submitListeningAttempt(userId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["learner", userId, "learn", "listening", "history"],
      })
    },
  })
}

export function useListeningPracticeHistory(userId: string) {
  return useQuery({
    queryKey: ["learner", userId, "learn", "listening", "history"],
    queryFn: () => getListeningPracticeHistory(userId),
    enabled: !!userId,
  })
}

export function useListeningAttemptDetail(userId: string, attemptId: number | null) {
  return useQuery({
    queryKey: ["learner", userId, "learn", "listening", "history", attemptId],
    queryFn: () => getListeningAttemptDetail(userId, attemptId as number),
    enabled: !!userId && attemptId != null,
  })
}
