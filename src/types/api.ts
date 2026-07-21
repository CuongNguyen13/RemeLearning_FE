// Types mirroring RemeLearning/services/bff-service/openapi.yaml + docs/API.md (section 6),
// which is the source of truth for fields the checked-in openapi.yaml hasn't caught up with yet
// (e.g. Recommendation.exercises, User.photoUrl, the practice/next & practice/redo endpoints).

export interface ApiResponse<T> {
  success: boolean
  data: T | null
  errorCode: string | null
  message: string | null
  timestamp: string
}

export type Category = "vocabulary" | "grammar" | "pronunciation"

export interface User {
  userId: string
  email: string
  name: string
  role: string
  createdAt: string
  photoUrl?: string | null
}

export interface AuthResponse {
  token: string
  user: User
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface UpdateProfileRequest {
  name: string
}

export interface Recording {
  recordingId: string
  userId: string
  status: string
  s3Bucket: string
  s3Key: string
  createdAt: string
}

export interface WeakPoint {
  itemId: string
  label: string
  category: Category
  forgettingScore: number
  recommendation: string
}

export type WeakPointsByCategory = Partial<Record<Category, WeakPoint[]>>

export interface Recommendation {
  itemId: string
  category: Category
  label: string
  forgettingScore: number
  recommendationText: string
  exercises: string[]
  updatedAt: string
}

export type RecommendationsByCategory = Partial<Record<Category, Recommendation[]>>

export interface CategoryProgress {
  category: Category
  weakPointCount: number
  avgForgettingScore: number
  lastUpdated: string
}

export interface RecommendationSnapshot {
  userId: string
  itemId: string
  category: Category
  label: string
  recommendationText: string
  exercises: string[]
  forgettingScore: number
  receivedAt: string
}

export interface LearnerOverview {
  userId: string
  user: User | null
  categoryProgress: CategoryProgress[]
  recentRecommendations: RecommendationSnapshot[]
  recentRecordings: Recording[]
}

export interface PracticeAttempt {
  itemId: string
  category: Category
  label: string
  correct: boolean
}

export interface PracticeRedoRequest {
  attempts: PracticeAttempt[]
}

/** The distinct dictation-library filter values, for the browse filters. */
export interface DictationFacets {
  skills: string[]
  levels: string[]
  topics: string[]
  examTypes: string[]
  minListensForHint: number
}

/** One browsable dictation topic (folder), listed on the library home screen. */
export interface DictationFolder {
  folderId: string
  name: string
  lessonCount: number
}

/** One lesson inside a folder — lightweight, no script/sentences yet. */
export interface DictationLessonSummary {
  clipId: number
  code: string
  title: string
  audioUrl: string
  /** Number of past attempts by the current learner (0 = never practiced). */
  attemptCount?: number
}

/** One sentence of a clip's script, with optional AI-aligned audio timestamps and translation. */
export interface DictationSentence {
  index: number
  text: string
  startMs: number | null
  endMs: number | null
  translation: string | null
}

/** Full detail of a single clip opened for sentence-by-sentence practice. */
export interface DictationClipDetail {
  clipId: number
  code: string
  title: string
  audioUrl: string
  scriptText: string
  sentences: DictationSentence[]
}

/** One library clip to listen to and transcribe. Has no script text so the answer isn't leaked. */
export interface DictationClip {
  clipId: number
  code: string
  title: string
  skill: string | null
  level: string | null
  topic: string | null
  examType: string
  /** english-service-relative audio path; the FE builds its own bff-relative URL from clipId. */
  audioUrl: string
}

export interface StartDictationSessionRequest {
  skill?: string
  level?: string
  topic?: string
  examType?: string
  count?: number
}

export type WordDiffTag = "CORRECT" | "SUBSTITUTED" | "MISSING" | "EXTRA"

export interface WordDiff {
  tag: WordDiffTag
  actualWord: string | null
  expectedWord: string | null
}

/**
 * One incorrect attempt at a single sentence during sentence-mode practice. The learner must
 * eventually retype the sentence correctly to advance (see SentenceDictationRunner), so these never
 * show up in the final `userTranscript` diff - they're carried separately so the backend can still
 * fold them into the same miss/weak-point pipeline as a regular wrong answer.
 */
export interface DictationSentenceMistake {
  sentenceIndex: number
  expectedText: string
  attemptedText: string
}

/** Exactly one of clipId / practiceItemId is set (library clip vs AI-practice clip). */
export interface DictationAttemptRequest {
  clipId?: number
  practiceItemId?: number
  userTranscript: string
  /** Wrong attempts recorded while working through a sentence-mode clip; sent for both library and AI-practice attempts when there were sentence-mode retries. */
  sentenceMistakes?: DictationSentenceMistake[]
}

export interface DictationAttemptResult {
  referenceText: string
  accuracy: number
  wer: number
  diff: WordDiff[]
  aiSuggestions: string[]
  practiceSentences: string[]
}

export interface DictationHistoryEntry {
  attemptId: number
  clipId: number | null
  title: string | null
  skill: string | null
  level: string | null
  examType: string | null
  accuracy: number
  wer: number
  attemptedAt: string
  /** How many attempts (including this one) the learner has made on this clip; null for AI-practice entries. */
  attemptCount: number | null
  /** LIBRARY when clipId is present, AI_PRACTICE otherwise. */
  practiceType: "LIBRARY" | "AI_PRACTICE"
}

/** One word the learner got wrong in a past attempt. */
export interface DictationMistake {
  expectedWord: string | null
  actualWord: string | null
  tag: WordDiffTag
}

/** Full detail for one past dictation attempt, shown when a History entry is clicked. */
export interface DictationAttemptDetail {
  attemptId: number
  title: string | null
  skill: string | null
  level: string | null
  examType: string | null
  referenceText: string
  userTranscript: string
  accuracy: number
  wer: number
  mistakes: DictationMistake[]
  aiSuggestions: string[]
  attemptedAt: string
}

/** One AI-practice item (Supertonic-voiced); audioUrl null until synthesized. level/examType/topic are
 * null for items generated without an explicit facet selection (e.g. from a history attempt). */
export interface DictationPracticeItem {
  practiceItemId: number
  audioUrl: string | null
  level: string | null
  examType: string | null
  topic: string | null
}

/** Full detail for one AI-practice item - passage text split into sentences for sentence-by-sentence
 * practice, mirroring DictationClipDetail. Sentences never carry AI-aligned timestamps (the passage's
 * audio is one merged file with no per-sentence timing), so SentenceDictationRunner falls back to its
 * own word-count-share estimate the same way it does for an unaligned library clip. */
export interface DictationPracticeItemDetail {
  practiceItemId: number
  audioUrl: string | null
  scriptText: string
  level: string | null
  examType: string | null
  topic: string | null
  sentences: DictationSentence[]
}

/** Facets for generating one AI-practice passage. Each of level/examType may be a concrete value
 * (e.g. "B1", "TOEIC"), the literal "RANDOM" (resolved server-side), or omitted (no preference). */
export interface GenerateAiPracticeRequest {
  level?: string
  examType?: string
  translationLang?: string
}
