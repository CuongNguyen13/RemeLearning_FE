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

/** Exactly one of clipId / practiceItemId is set (library clip vs AI-practice clip). */
export interface DictationAttemptRequest {
  clipId?: number
  practiceItemId?: number
  userTranscript: string
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
}

/** One AI-practice item (Supertonic-voiced); audioUrl null until synthesized. */
export interface DictationPracticeItem {
  practiceItemId: number
  audioUrl: string | null
}
