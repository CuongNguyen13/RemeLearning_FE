import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  generateAiPractice,
  generateAiPracticeFromAttempt,
  getAiPractice,
  getAiPracticeDetail,
  getDictationAttemptDetail,
  getDictationClip,
  getDictationFacets,
  getDictationFolderLessons,
  getDictationFolders,
  getDictationHistory,
  startDictationSession,
  submitDictationAttempt,
} from "@/api/learners"
import type {
  DictationAttemptRequest,
  GenerateAiPracticeRequest,
  StartDictationSessionRequest,
} from "@/types/api"

export function useDictationFacets(userId: string) {
  return useQuery({
    queryKey: ["learner", userId, "dictation", "facets"],
    queryFn: () => getDictationFacets(userId),
    enabled: !!userId,
  })
}

export function useDictationFolders(userId: string) {
  return useQuery({
    queryKey: ["learner", userId, "dictation", "folders"],
    queryFn: () => getDictationFolders(userId),
    enabled: !!userId,
  })
}

export function useDictationFolderLessons(userId: string, folderId: string | null) {
  return useQuery({
    queryKey: ["learner", userId, "dictation", "folders", folderId, "lessons"],
    queryFn: () => getDictationFolderLessons(userId, folderId as string),
    enabled: !!userId && !!folderId,
  })
}

export function useDictationClip(userId: string, clipId: number | null, translationLang?: string) {
  return useQuery({
    queryKey: ["learner", userId, "dictation", "clips", clipId, translationLang],
    queryFn: () => getDictationClip(userId, clipId as number, translationLang),
    enabled: !!userId && !!clipId,
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

export function useDictationAttemptDetail(userId: string, attemptId: number | null) {
  return useQuery({
    queryKey: ["learner", userId, "dictation", "history", attemptId],
    queryFn: () => getDictationAttemptDetail(userId, attemptId as number),
    enabled: !!userId && attemptId != null,
  })
}

export function useAiPractice(userId: string) {
  return useQuery({
    queryKey: ["learner", userId, "dictation", "ai-practice"],
    queryFn: () => getAiPractice(userId),
    enabled: !!userId,
  })
}

export function useAiPracticeDetail(userId: string, practiceItemId: number | null) {
  return useQuery({
    queryKey: ["learner", userId, "dictation", "ai-practice", practiceItemId],
    queryFn: () => getAiPracticeDetail(userId, practiceItemId as number),
    enabled: !!userId && practiceItemId != null,
  })
}

export function useGenerateAiPractice(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: GenerateAiPracticeRequest) => generateAiPractice(userId, request),
    onSuccess: (items) => {
      queryClient.setQueryData(["learner", userId, "dictation", "ai-practice"], items)
    },
  })
}

export function useGenerateAiPracticeFromAttempt(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ attemptId, translationLang }: { attemptId: number; translationLang?: string }) =>
      generateAiPracticeFromAttempt(userId, attemptId, translationLang),
    onSuccess: (items) => {
      queryClient.setQueryData(["learner", userId, "dictation", "ai-practice"], items)
    },
  })
}
