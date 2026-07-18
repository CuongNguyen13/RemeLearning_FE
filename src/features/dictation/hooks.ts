import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  generateAiPractice,
  getAiPractice,
  getDictationClip,
  getDictationFacets,
  getDictationFolderLessons,
  getDictationFolders,
  getDictationHistory,
  startDictationSession,
  submitDictationAttempt,
} from "@/api/learners"
import type { DictationAttemptRequest, StartDictationSessionRequest } from "@/types/api"

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

export function useDictationClip(userId: string, clipId: number | null) {
  return useQuery({
    queryKey: ["learner", userId, "dictation", "clips", clipId],
    queryFn: () => getDictationClip(userId, clipId as number),
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

export function useAiPractice(userId: string) {
  return useQuery({
    queryKey: ["learner", userId, "dictation", "ai-practice"],
    queryFn: () => getAiPractice(userId),
    enabled: !!userId,
  })
}

export function useGenerateAiPractice(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => generateAiPractice(userId),
    onSuccess: (items) => {
      queryClient.setQueryData(["learner", userId, "dictation", "ai-practice"], items)
    },
  })
}
