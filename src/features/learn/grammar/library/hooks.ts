import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  finishGrammarLibrarySession,
  getGrammarLibraryHistory,
  getGrammarLibraryTopicContent,
  getGrammarLibraryTopics,
  startGrammarLibrarySession,
  submitGrammarLibraryAnswer,
} from "@/api/learners"
import type { SubmitGrammarAnswerRequest } from "@/types/api"

function topicsKey(userId: string) {
  return ["learner", userId, "learn", "grammar", "library", "topics"]
}

function historyKey(userId: string, topicId: number) {
  return ["learner", userId, "learn", "grammar", "library", "topics", topicId, "history"]
}

export function useGrammarLibraryTopics(userId: string) {
  return useQuery({
    queryKey: topicsKey(userId),
    queryFn: () => getGrammarLibraryTopics(userId),
    enabled: !!userId,
  })
}

export function useGrammarLibraryTopicContent(userId: string, topicId: number | null) {
  return useQuery({
    queryKey: ["learner", userId, "learn", "grammar", "library", "topics", topicId],
    queryFn: () => getGrammarLibraryTopicContent(userId, topicId as number),
    enabled: !!userId && topicId != null,
  })
}

export function useStartGrammarLibrarySession(userId: string) {
  return useMutation({
    mutationFn: (topicId: number) => startGrammarLibrarySession(userId, topicId),
  })
}

export function useSubmitGrammarLibraryAnswer(userId: string) {
  return useMutation({
    mutationFn: ({ sessionId, request }: { sessionId: number; request: SubmitGrammarAnswerRequest }) =>
      submitGrammarLibraryAnswer(userId, sessionId, request),
  })
}

// Finishing a session can change this topic's status (and unlock the next one), so both this
// topic's history and the whole topics list are invalidated on success.
export function useFinishGrammarLibrarySession(userId: string, topicId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: number) => finishGrammarLibrarySession(userId, sessionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: topicsKey(userId) })
      void queryClient.invalidateQueries({ queryKey: historyKey(userId, topicId) })
    },
  })
}

export function useGrammarLibraryHistory(userId: string, topicId: number | null) {
  return useQuery({
    queryKey: topicId != null ? historyKey(userId, topicId) : historyKey(userId, -1),
    queryFn: () => getGrammarLibraryHistory(userId, topicId as number),
    enabled: !!userId && topicId != null,
  })
}
