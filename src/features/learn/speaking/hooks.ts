import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  generateSpeakingPractice,
  getSpeakingAttemptDetail,
  getSpeakingPracticeHistory,
  getSpeakingPracticeItem,
  getSpeakingPracticeItems,
  submitSpeakingAttempt,
} from "@/api/learners"
import type { GenerateSpeakingPracticeRequest } from "@/types/api"

export function useSpeakingPracticeItems(userId: string) {
  return useQuery({
    queryKey: ["learner", userId, "learn", "speaking", "items"],
    queryFn: () => getSpeakingPracticeItems(userId),
    enabled: !!userId,
  })
}

export function useSpeakingPracticeItem(userId: string, itemId: number | null) {
  return useQuery({
    queryKey: ["learner", userId, "learn", "speaking", "items", itemId],
    queryFn: () => getSpeakingPracticeItem(userId, itemId as number),
    enabled: !!userId && itemId != null,
  })
}

export function useGenerateSpeakingPractice(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: GenerateSpeakingPracticeRequest) => generateSpeakingPractice(userId, request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["learner", userId, "learn", "speaking"] })
    },
  })
}

export function useSubmitSpeakingAttempt(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ practiceItemId, audio }: { practiceItemId: number; audio: Blob }) =>
      submitSpeakingAttempt(userId, practiceItemId, audio),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["learner", userId, "learn", "speaking", "history"],
      })
    },
  })
}

export function useSpeakingPracticeHistory(userId: string) {
  return useQuery({
    queryKey: ["learner", userId, "learn", "speaking", "history"],
    queryFn: () => getSpeakingPracticeHistory(userId),
    enabled: !!userId,
  })
}

export function useSpeakingAttemptDetail(userId: string, attemptId: number | null) {
  return useQuery({
    queryKey: ["learner", userId, "learn", "speaking", "history", attemptId],
    queryFn: () => getSpeakingAttemptDetail(userId, attemptId as number),
    enabled: !!userId && attemptId != null,
  })
}
