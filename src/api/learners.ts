import { apiBaseUrl, apiClient } from "@/lib/api-client"
import { unwrap } from "@/lib/http"
import type {
  ApiResponse,
  DictationAttemptRequest,
  DictationAttemptResult,
  DictationClip,
  DictationFacets,
  DictationHistoryEntry,
  DictationPracticeItem,
  LearnerOverview,
  PracticeRedoRequest,
  RecommendationsByCategory,
  StartDictationSessionRequest,
  WeakPoint,
  WeakPointsByCategory,
} from "@/types/api"

// GET /api/v1/learners/{userId}/overview - composite: profile + dashboard progress + recent recordings.
export async function getLearnerOverview(userId: string): Promise<LearnerOverview> {
  const { data } = await apiClient.get<ApiResponse<LearnerOverview>>(
    `/learners/${userId}/overview`
  )
  return unwrap(data)
}

// GET /api/v1/learners/{userId}/weak-points - merged vocabulary/grammar/pronunciation, keyed by category.
export async function getLearnerWeakPoints(userId: string): Promise<WeakPointsByCategory> {
  const { data } = await apiClient.get<ApiResponse<WeakPointsByCategory>>(
    `/learners/${userId}/weak-points`
  )
  return unwrap(data)
}

// GET /api/v1/learners/{userId}/recommendations - grouped by category.
export async function getLearnerRecommendations(
  userId: string
): Promise<RecommendationsByCategory> {
  const { data } = await apiClient.get<ApiResponse<RecommendationsByCategory>>(
    `/learners/${userId}/recommendations`
  )
  return unwrap(data)
}

// GET /api/v1/learners/{userId}/practice/next - top N weakest items across all 3 domains.
export async function getPracticeNext(userId: string, limit = 10): Promise<WeakPoint[]> {
  const { data } = await apiClient.get<ApiResponse<WeakPoint[]>>(
    `/learners/${userId}/practice/next`,
    { params: { limit } }
  )
  return unwrap(data)
}

// POST /api/v1/learners/{userId}/practice/redo - submit a batch of self-assessed redo attempts.
export async function submitPracticeRedo(
  userId: string,
  payload: PracticeRedoRequest
): Promise<void> {
  const { data } = await apiClient.post<ApiResponse<null>>(
    `/learners/${userId}/practice/redo`,
    payload
  )
  unwrap(data)
}

// GET /api/v1/learners/{userId}/dictation/facets - the library's filter facets.
export async function getDictationFacets(userId: string): Promise<DictationFacets> {
  const { data } = await apiClient.get<ApiResponse<DictationFacets>>(
    `/learners/${userId}/dictation/facets`
  )
  return unwrap(data)
}

// GET /api/v1/learners/{userId}/dictation/clips - browse library clips by facet.
export async function getDictationClips(
  userId: string,
  filters: { skill?: string; level?: string; topic?: string; examType?: string; limit?: number }
): Promise<DictationClip[]> {
  const { data } = await apiClient.get<ApiResponse<DictationClip[]>>(
    `/learners/${userId}/dictation/clips`,
    { params: filters }
  )
  return unwrap(data)
}

// POST /api/v1/learners/{userId}/dictation/sessions - a batch of library clips matching the facets.
export async function startDictationSession(
  userId: string,
  payload: StartDictationSessionRequest
): Promise<DictationClip[]> {
  const { data } = await apiClient.post<ApiResponse<DictationClip[]>>(
    `/learners/${userId}/dictation/sessions`,
    payload
  )
  return unwrap(data)
}

// POST /api/v1/learners/{userId}/dictation/attempts - grade a learner's typed transcript.
export async function submitDictationAttempt(
  userId: string,
  payload: DictationAttemptRequest
): Promise<DictationAttemptResult> {
  const { data } = await apiClient.post<ApiResponse<DictationAttemptResult>>(
    `/learners/${userId}/dictation/attempts`,
    payload
  )
  return unwrap(data)
}

// GET /api/v1/learners/{userId}/dictation/history - past attempts, newest first.
export async function getDictationHistory(userId: string): Promise<DictationHistoryEntry[]> {
  const { data } = await apiClient.get<ApiResponse<DictationHistoryEntry[]>>(
    `/learners/${userId}/dictation/history`
  )
  return unwrap(data)
}

// GET /api/v1/learners/{userId}/dictation/ai-practice - the learner's AI-practice items.
export async function getAiPractice(userId: string): Promise<DictationPracticeItem[]> {
  const { data } = await apiClient.get<ApiResponse<DictationPracticeItem[]>>(
    `/learners/${userId}/dictation/ai-practice`
  )
  return unwrap(data)
}

// POST /api/v1/learners/{userId}/dictation/ai-practice/generate - synthesize AI-practice audio.
export async function generateAiPractice(userId: string): Promise<DictationPracticeItem[]> {
  const { data } = await apiClient.post<ApiResponse<DictationPracticeItem[]>>(
    `/learners/${userId}/dictation/ai-practice/generate`
  )
  return unwrap(data)
}

// Absolute URL for a library clip's audio stream, for use directly in an <audio src>.
export function dictationClipAudioUrl(userId: string, clipId: number): string {
  return `${apiBaseUrl}/learners/${userId}/dictation/clips/${clipId}/audio`
}

// Absolute URL for an AI-practice item's synthesized audio stream.
export function dictationPracticeAudioUrl(userId: string, practiceItemId: number): string {
  return `${apiBaseUrl}/learners/${userId}/dictation/ai-practice/items/${practiceItemId}/audio`
}
