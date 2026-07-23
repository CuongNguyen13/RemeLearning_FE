import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  generateVocabPractice,
  getVocabAttemptDetail,
  getVocabPracticeHistory,
  getVocabPracticeItem,
  getVocabPracticeItems,
  submitVocabAttempt,
} from "@/api/learners"
import type { GenerateVocabPracticeRequest, SubmitVocabAttemptRequest } from "@/types/api"

export function useVocabPracticeItems(userId: string) {
  return useQuery({
    queryKey: ["learner", userId, "learn", "vocabulary", "items"],
    queryFn: () => getVocabPracticeItems(userId),
    enabled: !!userId,
  })
}

export function useVocabPracticeItem(userId: string, itemId: number | null) {
  return useQuery({
    queryKey: ["learner", userId, "learn", "vocabulary", "items", itemId],
    queryFn: () => getVocabPracticeItem(userId, itemId as number),
    enabled: !!userId && itemId != null,
  })
}

export function useGenerateVocabPractice(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: GenerateVocabPracticeRequest) => generateVocabPractice(userId, request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["learner", userId, "learn", "vocabulary"] })
    },
  })
}

export function useSubmitVocabAttempt(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SubmitVocabAttemptRequest) => submitVocabAttempt(userId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["learner", userId, "learn", "vocabulary", "history"],
      })
    },
  })
}

export function useVocabPracticeHistory(userId: string) {
  return useQuery({
    queryKey: ["learner", userId, "learn", "vocabulary", "history"],
    queryFn: () => getVocabPracticeHistory(userId),
    enabled: !!userId,
  })
}

export function useVocabAttemptDetail(userId: string, attemptId: number | null) {
  return useQuery({
    queryKey: ["learner", userId, "learn", "vocabulary", "history", attemptId],
    queryFn: () => getVocabAttemptDetail(userId, attemptId as number),
    enabled: !!userId && attemptId != null,
  })
}
