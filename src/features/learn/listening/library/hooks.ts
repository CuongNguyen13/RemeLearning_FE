import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  getListeningLibraryHistory,
  getListeningLibraryTopics,
  startListeningLibrarySection,
  submitListeningLibraryAnswers,
} from "@/api/learners"
import type { SubmitListeningLibraryAnswersRequest } from "@/types/api"

function topicsKey(userId: string) {
  return ["learner", userId, "learn", "listening", "library", "topics"]
}

function historyKey(userId: string) {
  return ["learner", userId, "learn", "listening", "library", "sections", "history"]
}

export function useListeningLibraryTopics(userId: string) {
  return useQuery({
    queryKey: topicsKey(userId),
    queryFn: () => getListeningLibraryTopics(userId),
    enabled: !!userId,
  })
}

export function useStartListeningLibrarySection(userId: string) {
  return useMutation({
    mutationFn: (topicId: number) => startListeningLibrarySection(userId, topicId),
  })
}

// Passing a section can mark the topic PASSED and unlock the next one, so both the topics list and
// the section-history list are invalidated on a successful submit.
export function useSubmitListeningLibraryAnswers(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      sectionId,
      request,
    }: {
      sectionId: number
      request: SubmitListeningLibraryAnswersRequest
    }) => submitListeningLibraryAnswers(userId, sectionId, request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: topicsKey(userId) })
      void queryClient.invalidateQueries({ queryKey: historyKey(userId) })
    },
  })
}

export function useListeningLibraryHistory(userId: string) {
  return useQuery({
    queryKey: historyKey(userId),
    queryFn: () => getListeningLibraryHistory(userId),
    enabled: !!userId,
  })
}
