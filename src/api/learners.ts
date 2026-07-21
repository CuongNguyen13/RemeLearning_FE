import { apiBaseUrl, apiClient } from "@/lib/api-client"
import { unwrap } from "@/lib/http"
import type {
  ApiResponse,
  DictationAttemptDetail,
  DictationAttemptRequest,
  DictationAttemptResult,
  DictationClip,
  DictationClipDetail,
  DictationFacets,
  DictationFolder,
  DictationHistoryEntry,
  DictationLessonSummary,
  DictationPracticeItem,
  DictationPracticeItemDetail,
  GenerateAiPracticeRequest,
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

// GET /api/v1/learners/{userId}/dictation/folders - browsable topic folders.
export async function getDictationFolders(userId: string): Promise<DictationFolder[]> {
  const { data } = await apiClient.get<ApiResponse<DictationFolder[]>>(
    `/learners/${userId}/dictation/folders`
  )
  return unwrap(data)
}

// GET /api/v1/learners/{userId}/dictation/folders/{folderId}/lessons - lessons in one folder.
export async function getDictationFolderLessons(
  userId: string,
  folderId: string
): Promise<DictationLessonSummary[]> {
  const { data } = await apiClient.get<ApiResponse<DictationLessonSummary[]>>(
    `/learners/${userId}/dictation/folders/${folderId}/lessons`
  )
  return unwrap(data)
}

// GET /api/v1/learners/{userId}/dictation/clips/{clipId} - full clip detail (script + sentences),
// optionally with a per-sentence translation to translationLang (only "vi" ever returns one - the
// content is always English, so translating to "en" would be a no-op and is skipped server-side).
export async function getDictationClip(
  userId: string,
  clipId: number,
  translationLang?: string
): Promise<DictationClipDetail> {
  const { data } = await apiClient.get<ApiResponse<DictationClipDetail>>(
    `/learners/${userId}/dictation/clips/${clipId}`,
    { params: translationLang ? { translationLang } : undefined }
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

// GET /api/v1/learners/{userId}/dictation/history/{attemptId} - full detail for one past attempt.
export async function getDictationAttemptDetail(
  userId: string,
  attemptId: number
): Promise<DictationAttemptDetail> {
  const { data } = await apiClient.get<ApiResponse<DictationAttemptDetail>>(
    `/learners/${userId}/dictation/history/${attemptId}`
  )
  return unwrap(data)
}

// POST /api/v1/learners/{userId}/dictation/history/{attemptId}/ai-practice - generate one AI-practice
// dialogue/passage targeted at one specific past attempt's mistakes.
export async function generateAiPracticeFromAttempt(
  userId: string,
  attemptId: number,
  translationLang?: string
): Promise<DictationPracticeItem[]> {
  const { data } = await apiClient.post<ApiResponse<DictationPracticeItem[]>>(
    `/learners/${userId}/dictation/history/${attemptId}/ai-practice`,
    undefined,
    { params: translationLang ? { translationLang } : undefined }
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

// POST /api/v1/learners/{userId}/dictation/ai-practice/generate - synthesize one new AI-practice
// passage honoring the requested level/examType facets (concrete value, "RANDOM", or omitted) and
// translation language.
export async function generateAiPractice(
  userId: string,
  request: GenerateAiPracticeRequest
): Promise<DictationPracticeItem[]> {
  const { data } = await apiClient.post<ApiResponse<DictationPracticeItem[]>>(
    `/learners/${userId}/dictation/ai-practice/generate`,
    request
  )
  return unwrap(data)
}

// GET /api/v1/learners/{userId}/dictation/ai-practice/items/{practiceItemId}/detail - passage split
// into sentences, for sentence-by-sentence AI-practice runs (mirrors getDictationClip).
export async function getAiPracticeDetail(
  userId: string,
  practiceItemId: number
): Promise<DictationPracticeItemDetail> {
  const { data } = await apiClient.get<ApiResponse<DictationPracticeItemDetail>>(
    `/learners/${userId}/dictation/ai-practice/items/${practiceItemId}/detail`
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
