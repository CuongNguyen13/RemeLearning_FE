import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  finishVocabSection,
  getVocabLibraryTopics,
  getVocabSectionHistory,
  startVocabSection,
  submitVocabSectionAnswer,
} from "@/api/learners"
import type { StartSectionRequest, SubmitSectionAnswerRequest } from "@/types/api"

export function useVocabLibraryTopics(userId: string) {
  return useQuery({
    queryKey: ["learner", userId, "learn", "vocabulary", "library", "topics"],
    queryFn: () => getVocabLibraryTopics(userId),
    enabled: !!userId,
  })
}

export function useStartVocabSection(userId: string) {
  return useMutation({
    mutationFn: ({ topicId, request }: { topicId: number; request: StartSectionRequest }) =>
      startVocabSection(userId, topicId, request),
  })
}

export function useSubmitVocabSectionAnswer(userId: string) {
  return useMutation({
    mutationFn: ({ sectionId, request }: { sectionId: number; request: SubmitSectionAnswerRequest }) =>
      submitVocabSectionAnswer(userId, sectionId, request),
  })
}

export function useFinishVocabSection(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sectionId: number) => finishVocabSection(userId, sectionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["learner", userId, "learn", "vocabulary", "library", "topics"],
      })
      void queryClient.invalidateQueries({
        queryKey: ["learner", userId, "learn", "vocabulary", "library", "sections", "history"],
      })
    },
  })
}

export function useVocabSectionHistory(userId: string) {
  return useQuery({
    queryKey: ["learner", userId, "learn", "vocabulary", "library", "sections", "history"],
    queryFn: () => getVocabSectionHistory(userId),
    enabled: !!userId,
  })
}
