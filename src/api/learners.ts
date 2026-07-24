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
  FinishSpeakingSectionResult,
  GenerateAiPracticeRequest,
  GenerateGrammarPracticeRequest,
  GenerateVocabPracticeRequest,
  GrammarAttemptDetail,
  GrammarAttemptHistoryEntry,
  GrammarAttemptResult,
  GrammarHistoryEntry,
  GrammarPracticeItem,
  GenerateListeningPracticeRequest,
  LearnerOverview,
  ListeningAttemptDetail,
  ListeningAttemptHistoryEntry,
  ListeningAttemptResult,
  ListeningHistoryEntry,
  ListeningLibraryAnswerResult,
  ListeningLibraryHistoryEntry,
  ListeningLibrarySection,
  ListeningLibraryTopic,
  ListeningPracticeItem,
  PracticeRedoRequest,
  RecommendationsByCategory,
  SectionAnswerResult,
  SectionHistoryEntry,
  SectionCard,
  SpeakingSentenceAttemptResult,
  StartDictationSessionRequest,
  StartSectionRequest,
  SubmitSectionAnswerRequest,
  GenerateSpeakingPracticeRequest,
  GrammarAnswerResult,
  GrammarLibraryContent,
  GrammarLibraryTopicSummary,
  GrammarSessionHistoryEntry,
  FinishGrammarSessionResponse,
  SpeakingAttemptDetail,
  SpeakingAttemptHistoryEntry,
  SpeakingAttemptResult,
  SpeakingLibraryHistoryEntry,
  SpeakingLibrarySection,
  SpeakingLibraryTopic,
  SpeakingPracticeItem,
  StartGrammarSessionResponse,
  SubmitGrammarAnswerRequest,
  SubmitGrammarAttemptRequest,
  SubmitListeningAttemptRequest,
  SubmitListeningLibraryAnswersRequest,
  SubmitVocabAttemptRequest,
  VocabAttemptDetail,
  VocabAttemptHistoryEntry,
  VocabAttemptResult,
  VocabPracticeItem,
  VocabTopicSummary,
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

// POST /api/v1/learners/{userId}/learn/vocabulary/generate - generate one AI vocabulary practice
// set, targeting the given focus words or (if omitted) the learner's own top weak points.
export async function generateVocabPractice(
  userId: string,
  request: GenerateVocabPracticeRequest
): Promise<VocabPracticeItem> {
  const { data } = await apiClient.post<ApiResponse<VocabPracticeItem>>(
    `/learners/${userId}/learn/vocabulary/generate`,
    request
  )
  return unwrap(data)
}

// GET /api/v1/learners/{userId}/learn/vocabulary/items - a learner's generated practice sets.
export async function getVocabPracticeItems(userId: string): Promise<VocabPracticeItem[]> {
  const { data } = await apiClient.get<ApiResponse<VocabPracticeItem[]>>(
    `/learners/${userId}/learn/vocabulary/items`
  )
  return unwrap(data)
}

// GET /api/v1/learners/{userId}/learn/vocabulary/items/{itemId} - full detail (no answers).
export async function getVocabPracticeItem(
  userId: string,
  itemId: number
): Promise<VocabPracticeItem> {
  const { data } = await apiClient.get<ApiResponse<VocabPracticeItem>>(
    `/learners/${userId}/learn/vocabulary/items/${itemId}`
  )
  return unwrap(data)
}

// POST /api/v1/learners/{userId}/learn/vocabulary/attempts - grade a submitted attempt.
export async function submitVocabAttempt(
  userId: string,
  payload: SubmitVocabAttemptRequest
): Promise<VocabAttemptResult> {
  const { data } = await apiClient.post<ApiResponse<VocabAttemptResult>>(
    `/learners/${userId}/learn/vocabulary/attempts`,
    payload
  )
  return unwrap(data)
}

// GET /api/v1/learners/{userId}/learn/vocabulary/history - past attempts, newest first.
export async function getVocabPracticeHistory(userId: string): Promise<VocabAttemptHistoryEntry[]> {
  const { data } = await apiClient.get<ApiResponse<VocabAttemptHistoryEntry[]>>(
    `/learners/${userId}/learn/vocabulary/history`
  )
  return unwrap(data)
}

// GET /api/v1/learners/{userId}/learn/vocabulary/history/{attemptId} - full detail for one past attempt.
export async function getVocabAttemptDetail(
  userId: string,
  attemptId: number
): Promise<VocabAttemptDetail> {
  const { data } = await apiClient.get<ApiResponse<VocabAttemptDetail>>(
    `/learners/${userId}/learn/vocabulary/history/${attemptId}`
  )
  return unwrap(data)
}

// GET /api/v1/learners/{userId}/learn/vocabulary/library/topics - topics + this learner's mastery.
export async function getVocabLibraryTopics(userId: string): Promise<VocabTopicSummary[]> {
  const { data } = await apiClient.get<ApiResponse<VocabTopicSummary[]>>(
    `/learners/${userId}/learn/vocabulary/library/topics`
  )
  return unwrap(data)
}

// POST /api/v1/learners/{userId}/learn/vocabulary/library/topics/{topicId}/sections - start a Section.
export async function startVocabSection(
  userId: string,
  topicId: number,
  request: StartSectionRequest
): Promise<SectionCard> {
  const { data } = await apiClient.post<ApiResponse<SectionCard>>(
    `/learners/${userId}/learn/vocabulary/library/topics/${topicId}/sections`,
    request
  )
  return unwrap(data)
}

// POST /api/v1/learners/{userId}/learn/vocabulary/library/sections/{sectionId}/answers - submit one card's answer.
export async function submitVocabSectionAnswer(
  userId: string,
  sectionId: number,
  request: SubmitSectionAnswerRequest
): Promise<SectionAnswerResult> {
  const { data } = await apiClient.post<ApiResponse<SectionAnswerResult>>(
    `/learners/${userId}/learn/vocabulary/library/sections/${sectionId}/answers`,
    request
  )
  return unwrap(data)
}

// POST /api/v1/learners/{userId}/learn/vocabulary/library/sections/{sectionId}/finish - end a Section early.
export async function finishVocabSection(userId: string, sectionId: number): Promise<SectionAnswerResult> {
  const { data } = await apiClient.post<ApiResponse<SectionAnswerResult>>(
    `/learners/${userId}/learn/vocabulary/library/sections/${sectionId}/finish`
  )
  return unwrap(data)
}

// GET /api/v1/learners/{userId}/learn/vocabulary/library/sections/history - past Sections, newest first.
export async function getVocabSectionHistory(userId: string): Promise<SectionHistoryEntry[]> {
  const { data } = await apiClient.get<ApiResponse<SectionHistoryEntry[]>>(
    `/learners/${userId}/learn/vocabulary/library/sections/history`
  )
  return unwrap(data)
}

// Not an axios call - builds the same-origin URL an <audio> element's src can hit directly (proxied
// by Vite/prod routing straight to bff-service, matching this exact bff route from Step above).
export function getVocabLibraryWordAudioUrl(userId: string, wordId: number): string {
  return `/api/v1/learners/${userId}/learn/vocabulary/library/words/${wordId}/audio`
}

// POST /api/v1/learners/{userId}/learn/grammar/generate - generate one AI grammar practice set,
// targeting the given focus rules or (if omitted) the learner's own top weak points.
export async function generateGrammarPractice(
  userId: string,
  request: GenerateGrammarPracticeRequest
): Promise<GrammarPracticeItem> {
  const { data } = await apiClient.post<ApiResponse<GrammarPracticeItem>>(
    `/learners/${userId}/learn/grammar/generate`,
    request
  )
  return unwrap(data)
}

// GET /api/v1/learners/{userId}/learn/grammar/items - a learner's generated practice sets.
export async function getGrammarPracticeItems(userId: string): Promise<GrammarPracticeItem[]> {
  const { data } = await apiClient.get<ApiResponse<GrammarPracticeItem[]>>(
    `/learners/${userId}/learn/grammar/items`
  )
  return unwrap(data)
}

// GET /api/v1/learners/{userId}/learn/grammar/items/{itemId} - full detail (no answers).
export async function getGrammarPracticeItem(
  userId: string,
  itemId: number
): Promise<GrammarPracticeItem> {
  const { data } = await apiClient.get<ApiResponse<GrammarPracticeItem>>(
    `/learners/${userId}/learn/grammar/items/${itemId}`
  )
  return unwrap(data)
}

// POST /api/v1/learners/{userId}/learn/grammar/attempts - grade a submitted attempt.
export async function submitGrammarAttempt(
  userId: string,
  payload: SubmitGrammarAttemptRequest
): Promise<GrammarAttemptResult> {
  const { data } = await apiClient.post<ApiResponse<GrammarAttemptResult>>(
    `/learners/${userId}/learn/grammar/attempts`,
    payload
  )
  return unwrap(data)
}

// GET /api/v1/learners/{userId}/learn/grammar/history - past attempts, newest first.
export async function getGrammarPracticeHistory(userId: string): Promise<GrammarAttemptHistoryEntry[]> {
  const { data } = await apiClient.get<ApiResponse<GrammarAttemptHistoryEntry[]>>(
    `/learners/${userId}/learn/grammar/history`
  )
  return unwrap(data)
}

// GET /api/v1/learners/{userId}/learn/grammar/history/{attemptId} - full detail for one past attempt.
export async function getGrammarAttemptDetail(
  userId: string,
  attemptId: number
): Promise<GrammarAttemptDetail> {
  const { data } = await apiClient.get<ApiResponse<GrammarAttemptDetail>>(
    `/learners/${userId}/learn/grammar/history/${attemptId}`
  )
  return unwrap(data)
}

// GET /api/v1/learners/{userId}/learn/grammar/library/topics - the 60 fixed topics + this learner's
// per-topic status (LOCKED/UNLOCKED/IN_PROGRESS/PASSED), ordered by sequenceOrder.
export async function getGrammarLibraryTopics(userId: string): Promise<GrammarLibraryTopicSummary[]> {
  const { data } = await apiClient.get<ApiResponse<GrammarLibraryTopicSummary[]>>(
    `/learners/${userId}/learn/grammar/library/topics`
  )
  return unwrap(data)
}

// GET /api/v1/learners/{userId}/learn/grammar/library/topics/{topicId} - theory + illustration +
// the topic's read-only sample questions (answers included, not scored here).
export async function getGrammarLibraryTopicContent(
  userId: string,
  topicId: number
): Promise<GrammarLibraryContent> {
  const { data } = await apiClient.get<ApiResponse<GrammarLibraryContent>>(
    `/learners/${userId}/learn/grammar/library/topics/${topicId}`
  )
  return unwrap(data)
}

// POST /api/v1/learners/{userId}/learn/grammar/library/topics/{topicId}/sessions - start an INITIAL
// practice session for this topic (answers withheld until submitted).
export async function startGrammarLibrarySession(
  userId: string,
  topicId: number
): Promise<StartGrammarSessionResponse> {
  const { data } = await apiClient.post<ApiResponse<StartGrammarSessionResponse>>(
    `/learners/${userId}/learn/grammar/library/topics/${topicId}/sessions`,
    {}
  )
  return unwrap(data)
}

// POST /api/v1/learners/{userId}/learn/grammar/library/sessions/{sessionId}/answers - grade one
// question of the running session.
export async function submitGrammarLibraryAnswer(
  userId: string,
  sessionId: number,
  request: SubmitGrammarAnswerRequest
): Promise<GrammarAnswerResult> {
  const { data } = await apiClient.post<ApiResponse<GrammarAnswerResult>>(
    `/learners/${userId}/learn/grammar/library/sessions/${sessionId}/answers`,
    request
  )
  return unwrap(data)
}

// POST /api/v1/learners/{userId}/learn/grammar/library/sessions/{sessionId}/finish - close out the
// session; if any answer was wrong a RETRY session is created server-side (nextRetrySessionId).
export async function finishGrammarLibrarySession(
  userId: string,
  sessionId: number
): Promise<FinishGrammarSessionResponse> {
  const { data } = await apiClient.post<ApiResponse<FinishGrammarSessionResponse>>(
    `/learners/${userId}/learn/grammar/library/sessions/${sessionId}/finish`,
    {}
  )
  return unwrap(data)
}

// GET /api/v1/learners/{userId}/learn/grammar/library/topics/{topicId}/history - past sessions for
// this topic, newest first.
export async function getGrammarLibraryHistory(
  userId: string,
  topicId: number
): Promise<GrammarSessionHistoryEntry[]> {
  const { data } = await apiClient.get<ApiResponse<GrammarSessionHistoryEntry[]>>(
    `/learners/${userId}/learn/grammar/library/topics/${topicId}/history`
  )
  return unwrap(data)
}

// POST /api/v1/learners/{userId}/learn/grammar/history/{attemptId}/ai-practice - generate AI practice
// targeted at one past learn attempt's mistakes (the "Luyện tập với AI" history-row action).
export async function generateGrammarPracticeFromAttempt(
  userId: string,
  attemptId: number
): Promise<GrammarPracticeItem[]> {
  const { data } = await apiClient.post<ApiResponse<GrammarPracticeItem[]>>(
    `/learners/${userId}/learn/grammar/history/${attemptId}/ai-practice`
  )
  return unwrap(data)
}

// POST /api/v1/learners/{userId}/learn/grammar/library/sessions/{sessionId}/ai-practice - generate AI
// practice targeted at one past library session's missed questions.
export async function generateGrammarPracticeFromSession(
  userId: string,
  sessionId: number
): Promise<GrammarPracticeItem[]> {
  const { data } = await apiClient.post<ApiResponse<GrammarPracticeItem[]>>(
    `/learners/${userId}/learn/grammar/library/sessions/${sessionId}/ai-practice`
  )
  return unwrap(data)
}

// GET /api/v1/learners/{userId}/learn/grammar/merged-history - learn attempts + library sessions
// combined into one time-sorted list, tagged by source.
export async function getGrammarMergedHistory(userId: string): Promise<GrammarHistoryEntry[]> {
  const { data } = await apiClient.get<ApiResponse<GrammarHistoryEntry[]>>(
    `/learners/${userId}/learn/grammar/merged-history`
  )
  return unwrap(data)
}

// POST /api/v1/learners/{userId}/learn/listening/generate - generate one AI listening passage,
// targeting the given focus keywords or (if omitted) the learner's own recently-missed keywords.
export async function generateListeningPractice(
  userId: string,
  request: GenerateListeningPracticeRequest
): Promise<ListeningPracticeItem> {
  const { data } = await apiClient.post<ApiResponse<ListeningPracticeItem>>(
    `/learners/${userId}/learn/listening/generate`,
    request
  )
  return unwrap(data)
}

// GET /api/v1/learners/{userId}/learn/listening/items - a learner's generated practice items.
export async function getListeningPracticeItems(userId: string): Promise<ListeningPracticeItem[]> {
  const { data } = await apiClient.get<ApiResponse<ListeningPracticeItem[]>>(
    `/learners/${userId}/learn/listening/items`
  )
  return unwrap(data)
}

// GET /api/v1/learners/{userId}/learn/listening/items/{itemId} - full detail (no transcript/answers).
export async function getListeningPracticeItem(
  userId: string,
  itemId: number
): Promise<ListeningPracticeItem> {
  const { data } = await apiClient.get<ApiResponse<ListeningPracticeItem>>(
    `/learners/${userId}/learn/listening/items/${itemId}`
  )
  return unwrap(data)
}

// POST /api/v1/learners/{userId}/learn/listening/attempts - grade a submitted attempt.
export async function submitListeningAttempt(
  userId: string,
  payload: SubmitListeningAttemptRequest
): Promise<ListeningAttemptResult> {
  const { data } = await apiClient.post<ApiResponse<ListeningAttemptResult>>(
    `/learners/${userId}/learn/listening/attempts`,
    payload
  )
  return unwrap(data)
}

// GET /api/v1/learners/{userId}/learn/listening/history - past attempts, newest first.
export async function getListeningPracticeHistory(userId: string): Promise<ListeningAttemptHistoryEntry[]> {
  const { data } = await apiClient.get<ApiResponse<ListeningAttemptHistoryEntry[]>>(
    `/learners/${userId}/learn/listening/history`
  )
  return unwrap(data)
}

// GET /api/v1/learners/{userId}/learn/listening/history/{attemptId} - full detail for one past attempt.
export async function getListeningAttemptDetail(
  userId: string,
  attemptId: number
): Promise<ListeningAttemptDetail> {
  const { data } = await apiClient.get<ApiResponse<ListeningAttemptDetail>>(
    `/learners/${userId}/learn/listening/history/${attemptId}`
  )
  return unwrap(data)
}

// Absolute URL for one listening practice item's synthesized audio stream.
export function listeningPracticeAudioUrl(userId: string, itemId: number): string {
  return `${apiBaseUrl}/learners/${userId}/learn/listening/items/${itemId}/audio`
}

// GET /api/v1/learners/{userId}/learn/listening/library/topics - the fixed topics + this learner's
// per-topic status (LOCKED/UNLOCKED/IN_PROGRESS/PASSED).
export async function getListeningLibraryTopics(userId: string): Promise<ListeningLibraryTopic[]> {
  const { data } = await apiClient.get<ApiResponse<ListeningLibraryTopic[]>>(
    `/learners/${userId}/learn/listening/library/topics`
  )
  return unwrap(data)
}

// POST /api/v1/learners/{userId}/learn/listening/library/topics/{topicId}/sections - start (or
// resume) a Section for this topic (must be UNLOCKED or IN_PROGRESS).
export async function startListeningLibrarySection(
  userId: string,
  topicId: number
): Promise<ListeningLibrarySection> {
  const { data } = await apiClient.post<ApiResponse<ListeningLibrarySection>>(
    `/learners/${userId}/learn/listening/library/topics/${topicId}/sections`,
    {}
  )
  return unwrap(data)
}

// POST /api/v1/learners/{userId}/learn/listening/library/sections/{sectionId}/answers - score the
// whole submitted answer set at once; passes the topic (and unlocks the next one) when all correct.
export async function submitListeningLibraryAnswers(
  userId: string,
  sectionId: number,
  request: SubmitListeningLibraryAnswersRequest
): Promise<ListeningLibraryAnswerResult> {
  const { data } = await apiClient.post<ApiResponse<ListeningLibraryAnswerResult>>(
    `/learners/${userId}/learn/listening/library/sections/${sectionId}/answers`,
    request
  )
  return unwrap(data)
}

// GET /api/v1/learners/{userId}/learn/listening/library/sections/history - completed Section
// attempts across all topics, newest first.
export async function getListeningLibraryHistory(userId: string): Promise<ListeningLibraryHistoryEntry[]> {
  const { data } = await apiClient.get<ApiResponse<ListeningLibraryHistoryEntry[]>>(
    `/learners/${userId}/learn/listening/library/sections/history`
  )
  return unwrap(data)
}

// POST /api/v1/learners/{userId}/learn/listening/history/{attemptId}/ai-practice - generate AI
// practice targeted at one past learn attempt's mistakes.
export async function generateListeningPracticeFromAttempt(
  userId: string,
  attemptId: number
): Promise<ListeningPracticeItem[]> {
  const { data } = await apiClient.post<ApiResponse<ListeningPracticeItem[]>>(
    `/learners/${userId}/learn/listening/history/${attemptId}/ai-practice`
  )
  return unwrap(data)
}

// POST /api/v1/learners/{userId}/learn/listening/library/sections/{sectionId}/ai-practice - generate
// AI practice targeted at one past library section's missed questions.
export async function generateListeningPracticeFromSection(
  userId: string,
  sectionId: number
): Promise<ListeningPracticeItem[]> {
  const { data } = await apiClient.post<ApiResponse<ListeningPracticeItem[]>>(
    `/learners/${userId}/learn/listening/library/sections/${sectionId}/ai-practice`
  )
  return unwrap(data)
}

// GET /api/v1/learners/{userId}/learn/listening/merged-history - learn attempts + library section
// attempts combined into one time-sorted list, tagged by source.
export async function getListeningMergedHistory(userId: string): Promise<ListeningHistoryEntry[]> {
  const { data } = await apiClient.get<ApiResponse<ListeningHistoryEntry[]>>(
    `/learners/${userId}/learn/listening/merged-history`
  )
  return unwrap(data)
}

// POST /api/v1/learners/{userId}/learn/speaking/generate - generate one AI speaking-practice
// sentence with a Supertonic sample recording, targeting the given focus words or (if omitted)
// the learner's own top pronunciation weak points.
export async function generateSpeakingPractice(
  userId: string,
  request: GenerateSpeakingPracticeRequest
): Promise<SpeakingPracticeItem> {
  const { data } = await apiClient.post<ApiResponse<SpeakingPracticeItem>>(
    `/learners/${userId}/learn/speaking/generate`,
    request
  )
  return unwrap(data)
}

// GET /api/v1/learners/{userId}/learn/speaking/items - a learner's generated practice items.
export async function getSpeakingPracticeItems(userId: string): Promise<SpeakingPracticeItem[]> {
  const { data } = await apiClient.get<ApiResponse<SpeakingPracticeItem[]>>(
    `/learners/${userId}/learn/speaking/items`
  )
  return unwrap(data)
}

// GET /api/v1/learners/{userId}/learn/speaking/items/{itemId} - full detail (target text + sample audio).
export async function getSpeakingPracticeItem(
  userId: string,
  itemId: number
): Promise<SpeakingPracticeItem> {
  const { data } = await apiClient.get<ApiResponse<SpeakingPracticeItem>>(
    `/learners/${userId}/learn/speaking/items/${itemId}`
  )
  return unwrap(data)
}

// POST /api/v1/learners/{userId}/learn/speaking/attempts - submit a learner's recorded attempt
// (multipart audio), scored via ai-service's wav2vec2 GOP model.
export async function submitSpeakingAttempt(
  userId: string,
  practiceItemId: number,
  audio: Blob
): Promise<SpeakingAttemptResult> {
  const formData = new FormData()
  formData.append("audio", audio, "attempt.webm")
  formData.append("practiceItemId", String(practiceItemId))
  const { data } = await apiClient.post<ApiResponse<SpeakingAttemptResult>>(
    `/learners/${userId}/learn/speaking/attempts`,
    formData
  )
  return unwrap(data)
}

// GET /api/v1/learners/{userId}/learn/speaking/history - past attempts, newest first.
export async function getSpeakingPracticeHistory(userId: string): Promise<SpeakingAttemptHistoryEntry[]> {
  const { data } = await apiClient.get<ApiResponse<SpeakingAttemptHistoryEntry[]>>(
    `/learners/${userId}/learn/speaking/history`
  )
  return unwrap(data)
}

// GET /api/v1/learners/{userId}/learn/speaking/history/{attemptId} - full detail for one past attempt.
export async function getSpeakingAttemptDetail(
  userId: string,
  attemptId: number
): Promise<SpeakingAttemptDetail> {
  const { data } = await apiClient.get<ApiResponse<SpeakingAttemptDetail>>(
    `/learners/${userId}/learn/speaking/history/${attemptId}`
  )
  return unwrap(data)
}

// Absolute URL for one speaking practice item's Supertonic sample audio stream.
export function speakingSampleAudioUrl(userId: string, itemId: number): string {
  return `${apiBaseUrl}/learners/${userId}/learn/speaking/items/${itemId}/sample-audio`
}

// GET /api/v1/learners/{userId}/learn/speaking/library/topics - the fixed topics + this learner's
// per-topic status (LOCKED/UNLOCKED/IN_PROGRESS/PASSED).
export async function getSpeakingLibraryTopics(userId: string): Promise<SpeakingLibraryTopic[]> {
  const { data } = await apiClient.get<ApiResponse<SpeakingLibraryTopic[]>>(
    `/learners/${userId}/learn/speaking/library/topics`
  )
  return unwrap(data)
}

// POST /api/v1/learners/{userId}/learn/speaking/library/topics/{topicId}/sections - start (or
// resume) a Section for this topic (must be UNLOCKED or IN_PROGRESS).
export async function startSpeakingLibrarySection(
  userId: string,
  topicId: number
): Promise<SpeakingLibrarySection> {
  const { data } = await apiClient.post<ApiResponse<SpeakingLibrarySection>>(
    `/learners/${userId}/learn/speaking/library/topics/${topicId}/sections`,
    {}
  )
  return unwrap(data)
}

// POST /api/v1/learners/{userId}/learn/speaking/library/sections/{sectionId}/sentences/{sentenceId}/attempts
// - submit a learner's recorded reading of one section sentence (multipart audio), scored via
// ai-service's wav2vec2 GOP model; same FormData/multipart pattern as submitSpeakingAttempt above.
// Does not itself affect topic gating - see finishSpeakingLibrarySection.
export async function submitSpeakingSentenceAttempt(
  userId: string,
  sectionId: number,
  sentenceId: number,
  audio: Blob
): Promise<SpeakingSentenceAttemptResult> {
  const formData = new FormData()
  formData.append("audio", audio, "attempt.webm")
  const { data } = await apiClient.post<ApiResponse<SpeakingSentenceAttemptResult>>(
    `/learners/${userId}/learn/speaking/library/sections/${sectionId}/sentences/${sentenceId}/attempts`,
    formData
  )
  return unwrap(data)
}

// POST /api/v1/learners/{userId}/learn/speaking/library/sections/{sectionId}/finish - finish a
// section: if every sentence has a passing attempt, marks the topic PASSED and unlocks the next one.
export async function finishSpeakingLibrarySection(
  userId: string,
  sectionId: number
): Promise<FinishSpeakingSectionResult> {
  const { data } = await apiClient.post<ApiResponse<FinishSpeakingSectionResult>>(
    `/learners/${userId}/learn/speaking/library/sections/${sectionId}/finish`,
    {}
  )
  return unwrap(data)
}

// GET /api/v1/learners/{userId}/learn/speaking/library/sections/history - scored sentence attempts
// across all topics, newest first.
export async function getSpeakingLibraryHistory(userId: string): Promise<SpeakingLibraryHistoryEntry[]> {
  const { data } = await apiClient.get<ApiResponse<SpeakingLibraryHistoryEntry[]>>(
    `/learners/${userId}/learn/speaking/library/sections/history`
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
