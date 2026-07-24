import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  generateGrammarPractice,
  generateGrammarPracticeFromAttempt,
  generateGrammarPracticeFromSession,
  getGrammarAttemptDetail,
  getGrammarMergedHistory,
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

// Merged (learn + library) history list, tagged by source, used by the history tab's retry actions.
export function useGrammarMergedHistory(userId: string) {
  return useQuery({
    queryKey: ["learner", userId, "learn", "grammar", "merged-history"],
    queryFn: () => getGrammarMergedHistory(userId),
    enabled: !!userId,
  })
}

// "Luyện tập với AI" from a learn-attempt history row: regenerates a practice set targeting that
// attempt's own mistakes, then refreshes the practice-item list/merged history.
export function useGenerateGrammarPracticeFromAttempt(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (attemptId: number) => generateGrammarPracticeFromAttempt(userId, attemptId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["learner", userId, "learn", "grammar", "items"] })
      void queryClient.invalidateQueries({ queryKey: ["learner", userId, "learn", "grammar", "merged-history"] })
    },
  })
}

// "Luyện tập với AI" from a library-session history row: regenerates a practice set targeting that
// session's missed questions, then refreshes the practice-item list/merged history.
export function useGenerateGrammarPracticeFromSession(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: number) => generateGrammarPracticeFromSession(userId, sessionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["learner", userId, "learn", "grammar", "items"] })
      void queryClient.invalidateQueries({ queryKey: ["learner", userId, "learn", "grammar", "merged-history"] })
    },
  })
}
