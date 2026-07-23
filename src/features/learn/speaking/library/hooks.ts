import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  finishSpeakingLibrarySection,
  getSpeakingLibraryHistory,
  getSpeakingLibraryTopics,
  startSpeakingLibrarySection,
  submitSentenceAttempt,
} from "@/api/learners"

function topicsKey(userId: string) {
  return ["learner", userId, "learn", "speaking", "library", "topics"]
}

function historyKey(userId: string) {
  return ["learner", userId, "learn", "speaking", "library", "sections", "history"]
}

export function useSpeakingLibraryTopics(userId: string) {
  return useQuery({
    queryKey: topicsKey(userId),
    queryFn: () => getSpeakingLibraryTopics(userId),
    enabled: !!userId,
  })
}

export function useStartSpeakingLibrarySection(userId: string) {
  return useMutation({
    mutationFn: (topicId: number) => startSpeakingLibrarySection(userId, topicId),
  })
}

// A per-sentence attempt never itself changes topic gating - only finishing the section can pass
// the topic and unlock the next one (see useFinishSpeakingSection) - so no query invalidation
// happens here.
export function useSubmitSentenceAttempt(userId: string) {
  return useMutation({
    mutationFn: ({
      sectionId,
      sentenceId,
      audio,
    }: {
      sectionId: number
      sentenceId: number
      audio: Blob
    }) => submitSentenceAttempt(userId, sectionId, sentenceId, audio),
  })
}

// Finishing a section can mark the topic PASSED and unlock the next one, so both the topics list
// and the section-history list are invalidated on a successful finish.
export function useFinishSpeakingSection(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sectionId: number) => finishSpeakingLibrarySection(userId, sectionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: topicsKey(userId) })
      void queryClient.invalidateQueries({ queryKey: historyKey(userId) })
    },
  })
}

export function useSpeakingLibraryHistory(userId: string) {
  return useQuery({
    queryKey: historyKey(userId),
    queryFn: () => getSpeakingLibraryHistory(userId),
    enabled: !!userId,
  })
}
