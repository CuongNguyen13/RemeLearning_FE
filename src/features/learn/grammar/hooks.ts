import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  generateGrammarPractice,
  getGrammarAttemptDetail,
  getGrammarPracticeHistory,
  getGrammarPracticeItem,
  getGrammarPracticeItems,
  submitGrammarAttempt,
} from "@/api/learners"
import type { GenerateGrammarPracticeRequest, SubmitGrammarAttemptRequest } from "@/types/api"

export function useGrammarPracticeItems(userId: string) {
  return useQuery({
    queryKey: ["learner", userId, "learn", "grammar", "items"],
    queryFn: () => getGrammarPracticeItems(userId),
    enabled: !!userId,
  })
}

export function useGrammarPracticeItem(userId: string, itemId: number | null) {
  return useQuery({
    queryKey: ["learner", userId, "learn", "grammar", "items", itemId],
    queryFn: () => getGrammarPracticeItem(userId, itemId as number),
    enabled: !!userId && itemId != null,
  })
}

export function useGenerateGrammarPractice(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: GenerateGrammarPracticeRequest) => generateGrammarPractice(userId, request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["learner", userId, "learn", "grammar"] })
    },
  })
}

export function useSubmitGrammarAttempt(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SubmitGrammarAttemptRequest) => submitGrammarAttempt(userId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["learner", userId, "learn", "grammar", "history"],
      })
    },
  })
}

export function useGrammarPracticeHistory(userId: string) {
  return useQuery({
    queryKey: ["learner", userId, "learn", "grammar", "history"],
    queryFn: () => getGrammarPracticeHistory(userId),
    enabled: !!userId,
  })
}

export function useGrammarAttemptDetail(userId: string, attemptId: number | null) {
  return useQuery({
    queryKey: ["learner", userId, "learn", "grammar", "history", attemptId],
    queryFn: () => getGrammarAttemptDetail(userId, attemptId as number),
    enabled: !!userId && attemptId != null,
  })
}
