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

export type Category = "vocabulary" | "grammar" | "pronunciation" | "listening"

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
  /** CEFR level (A1..C2), null if untagged. */
  level: string | null
  /** Number of sentences in the script — stands in for a duration estimate (no audio-length data is stored). */
  sentenceCount: number
  /** Number of past attempts by the current learner; null/undefined if never attempted. */
  attemptCount?: number | null
  /** 0..1 accuracy of the learner's most recent attempt; null/undefined if never attempted. */
  latestAccuracy?: number | null
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

/** Root-cause classification for one dictation mistake (listening-coach analysis). */
export type DictationErrorCategory = "LEXICON" | "GRAMMAR" | "PHONOLOGY"

/** One row of the mistake-comparison table: original vs. what the learner typed, root-classified. */
export interface DictationErrorEntry {
  original: string | null
  transcribed: string | null
  category: DictationErrorCategory
  note?: string | null
}

/** A root-cause explanation for one category, only present when it has misses. */
export interface DictationRootCauseGroup {
  category: DictationErrorCategory
  summary: string
  examples: string[]
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
  errorTable: DictationErrorEntry[]
  rootCauses: DictationRootCauseGroup[]
  actionAdvice: string[]
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
  errorTable: DictationErrorEntry[]
  rootCauses: DictationRootCauseGroup[]
  actionAdvice: string[]
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

// --- "Học & Luyện tập với AI" - vocabulary skill ---

export type VocabQuestionType = "CLOZE" | "MCQ" | "MATCHING"

/** Practice-time question shape. Now carries the answer so the client can grade each answer
 *  instantly (server still re-grades + does the AI/LLM pass on the final submit). */
export interface VocabQuestion {
  index: number
  prompt: string
  type: VocabQuestionType
  /** null for CLOZE; the answer/distractor choices for MCQ/MATCHING. */
  options: string[] | null
  /** The correct answer, for immediate client-side grading. */
  answer: string
  /** Optional VI translation/gloss shown alongside the correct answer. */
  translation: string | null
}

export interface VocabPracticeItem {
  practiceItemId: number
  level: string | null
  examType: string | null
  topic: string | null
  targetWords: string[]
  questions: VocabQuestion[]
  createdAt: string
}

export interface GenerateVocabPracticeRequest {
  level?: string
  examType?: string
  focusItems?: string[]
}

export interface SubmitVocabAttemptRequest {
  practiceItemId: number
  answers: string[]
}

/** One graded question, revealed after submission - unlike VocabQuestion, includes the answer. */
export interface VocabAttemptQuestionResult {
  index: number
  prompt: string
  yourAnswer: string | null
  correctAnswer: string
  correct: boolean
  translation: string | null
}

export interface VocabAttemptResult {
  accuracy: number
  results: VocabAttemptQuestionResult[]
  actionAdvice: string[]
}

export interface VocabAttemptHistoryEntry {
  attemptId: number
  practiceItemId: number
  level: string | null
  examType: string | null
  topic: string | null
  score: number
  attemptedAt: string
}

export interface VocabAttemptDetail {
  attemptId: number
  level: string | null
  examType: string | null
  topic: string | null
  accuracy: number
  results: VocabAttemptQuestionResult[]
  attemptedAt: string
}

// --- Vocabulary library: topic word bank + Leitner-lite Section practice ---

export type SectionCardKind = "INTRO" | "QUIZ"

export type SectionExerciseType =
  | "MCQ"
  | "CLOZE"
  | "MATCHING"
  | "LISTENING_DICTATION"
  | "TRANSLATE_EN_TO_VI"
  | "TRANSLATE_VI_TO_EN"

export interface VocabTopicSummary {
  topicId: number
  code: string
  name: string
  description: string | null
  level: string | null
  wordCount: number
  masteredCount: number
}

export interface SectionProgress {
  totalWords: number
  wordsMastered: number
  wordsRemaining: number
}

/** One Section card - an unscored INTRO flashcard, or a graded QUIZ of one SectionExerciseType.
 *  Fields are populated only where doing so cannot leak the answer - see the BE design spec. */
export interface SectionCard {
  sectionId: number
  cardKind: SectionCardKind
  libraryWordId: number
  word: string | null
  ipa: string | null
  meaningVi: string | null
  exampleEn: string | null
  audioUrl: string | null
  exerciseType: SectionExerciseType | null
  prompt: string | null
  options: string[] | null
  progress: SectionProgress
}

export interface StartSectionRequest {
  sectionSize?: number
}

/** Omit/blank submittedAnswer to acknowledge an INTRO card. */
export interface SubmitSectionAnswerRequest {
  submittedAnswer?: string
}

export interface SectionAnswerResult {
  correct: boolean
  correctAnswer: string | null
  score: number
  completed: boolean
  nextCard: SectionCard | null
  progress: SectionProgress
}

export interface SectionHistoryEntry {
  sectionAttemptId: number
  topicName: string | null
  accuracy: number
  wordsCount: number
  completedAt: string | null
}

// --- "Học & Luyện tập với AI" - grammar skill ---

export type GrammarQuestionType = "ERROR_CORRECTION" | "FILL_TENSE" | "TRANSFORM" | "MCQ"

/** Practice-time question shape. Now carries the answer so the client can grade each answer
 *  instantly (server still re-grades + does the AI/LLM pass on the final submit). */
export interface GrammarQuestion {
  index: number
  prompt: string
  type: GrammarQuestionType
  /** null for ERROR_CORRECTION/FILL_TENSE/TRANSFORM; the choices for MCQ. */
  options: string[] | null
  /** The correct answer, for immediate client-side grading. */
  answer: string
  /** Optional VI translation/gloss shown alongside the correct answer. */
  translation: string | null
  /** Plain VI translation of `answer`'s meaning (distinct from `translation`, a rule explanation). */
  translationVi: string | null
}

export interface GrammarPracticeItem {
  practiceItemId: number
  level: string | null
  examType: string | null
  topic: string | null
  targetRules: string[]
  questions: GrammarQuestion[]
  createdAt: string
}

export interface GenerateGrammarPracticeRequest {
  level?: string
  examType?: string
  focusItems?: string[]
}

export interface SubmitGrammarAttemptRequest {
  practiceItemId: number
  answers: string[]
}

/** One graded question, revealed after submission - unlike GrammarQuestion, includes the answer. */
export interface GrammarAttemptQuestionResult {
  index: number
  prompt: string
  yourAnswer: string | null
  correctAnswer: string
  correct: boolean
  translation: string | null
  /** Plain VI translation of `correctAnswer`'s meaning (distinct from `translation`, a rule explanation). */
  translationVi: string | null
}

export interface GrammarAttemptResult {
  accuracy: number
  results: GrammarAttemptQuestionResult[]
  actionAdvice: string[]
}

export interface GrammarAttemptHistoryEntry {
  attemptId: number
  practiceItemId: number
  level: string | null
  examType: string | null
  topic: string | null
  score: number
  attemptedAt: string
}

export interface GrammarAttemptDetail {
  attemptId: number
  level: string | null
  examType: string | null
  topic: string | null
  accuracy: number
  results: GrammarAttemptQuestionResult[]
  attemptedAt: string
}

// --- Grammar library: 60 fixed grammar topics, theory + AI illustration + practice/retry sessions ---

export type GrammarLibraryTopicStatus = "LOCKED" | "UNLOCKED" | "IN_PROGRESS" | "PASSED"

// Renamed from the design doc's bare "GrammarQuestionType" to avoid colliding with the practice-item
// GrammarQuestionType above (different value set, different concept - AI practice item vs library
// content question).
export type GrammarLibraryQuestionType = "ERROR_CORRECTION" | "FILL_TENSE" | "TRANSFORM" | "MCQ"

export type GrammarSessionType = "INITIAL" | "RETRY"

export interface GrammarLibraryTopicSummary {
  topicId: number
  code: string
  name: string
  level: string | null
  sequenceOrder: number
  status: GrammarLibraryTopicStatus
}

export interface GrammarLibraryExample {
  en: string
  vi: string
}

/** Content-page question shape - includes the answer since these are shown read-only (not scored). */
export interface GrammarLibraryQuestion {
  questionId: number
  type: GrammarLibraryQuestionType
  prompt: string
  options: string[] | null
  answer: string
  explanationVi: string | null
  /** Plain VI translation of `answer`'s meaning (distinct from `explanationVi`, a rule explanation). */
  translationVi: string | null
}

export interface GrammarLibraryContent {
  topicId: number
  code: string
  name: string
  explanationEn: string
  explanationVi: string
  illustrationText: string | null
  examples: GrammarLibraryExample[]
  questions: GrammarLibraryQuestion[]
}

/** Session-time question shape - answer withheld while the learner is answering it. */
export interface GrammarSessionQuestion {
  questionRef: string
  type: GrammarLibraryQuestionType
  prompt: string
  options: string[] | null
}

export interface StartGrammarSessionResponse {
  sessionId: number
  sessionType: GrammarSessionType
  questions: GrammarSessionQuestion[]
}

export interface SubmitGrammarAnswerRequest {
  questionRef: string
  submittedAnswer: string
}

export interface GrammarAnswerResult {
  questionRef: string
  correct: boolean
  correctAnswer: string
  explanationVi: string | null
  /** Plain VI translation of `correctAnswer`'s meaning (distinct from `explanationVi`, a rule explanation). */
  translationVi: string | null
}

export interface FinishGrammarSessionResponse {
  sessionId: number
  correctCount: number
  totalCount: number
  passed: boolean
  /** Non-null only when `passed` is false — a fresh RETRY session covering the missed questions,
   *  with its questions already inlined (no GET-by-sessionId endpoint exists). */
  retrySession: StartGrammarSessionResponse | null
  nextTopicUnlocked: boolean
  nextTopicId: number | null
}

export interface GrammarSessionHistoryEntry {
  sessionId: number
  sessionType: GrammarSessionType
  correctCount: number
  totalCount: number
  completedAt: string | null
}

// --- "Học & Luyện tập với AI" - listening skill ---

export type ListeningQuestionType = "MCQ" | "KEYWORD" | "OPEN"

/** Practice-time shape. MCQ/KEYWORD now carry the answer for instant client-side grading; OPEN
 *  keeps answer = null (graded only by the server/AI pass on submit). */
export interface ListeningQuestion {
  index: number
  prompt: string
  type: ListeningQuestionType
  /** Choices for MCQ; null for KEYWORD/OPEN. */
  options: string[] | null
  /** The correct answer for MCQ/KEYWORD; null for OPEN (cannot be graded locally). */
  answer: string | null
  /** Optional explanation shown alongside the correct answer. */
  explanation: string
}

export interface ListeningPracticeItem {
  practiceItemId: number
  /** Null until Supertonic has finished synthesizing the audio. */
  audioUrl: string | null
  level: string | null
  examType: string | null
  topic: string | null
  questions: ListeningQuestion[]
  createdAt: string
}

export interface GenerateListeningPracticeRequest {
  level?: string
  examType?: string
  translationLang?: string
  focusItems?: string[]
}

export interface SubmitListeningAttemptRequest {
  practiceItemId: number
  answers: string[]
}

export interface ListeningAttemptQuestionResult {
  index: number
  prompt: string
  yourAnswer: string | null
  correctAnswer: string
  correct: boolean
  /** 0..1 partial credit - meaningful for KEYWORD/OPEN; 0 or 1 for MCQ. */
  subScore: number
  explanation: string | null
}

export interface ListeningAttemptResult {
  accuracy: number
  results: ListeningAttemptQuestionResult[]
  transcript: string
  translation: string | null
  actionAdvice: string[]
}

export interface ListeningAttemptHistoryEntry {
  attemptId: number
  practiceItemId: number
  level: string | null
  examType: string | null
  topic: string | null
  score: number
  attemptedAt: string
}

export interface ListeningAttemptDetail {
  attemptId: number
  level: string | null
  examType: string | null
  topic: string | null
  accuracy: number
  results: ListeningAttemptQuestionResult[]
  transcript: string
  translation: string | null
  attemptedAt: string
}

// --- Listening library: fixed topics -> one generated passage+audio Section with MCQ comprehension
// questions each, gated by the same 4-state status the grammar library uses ---

export type ListeningLibraryTopicStatus = "LOCKED" | "UNLOCKED" | "IN_PROGRESS" | "PASSED"

export interface ListeningLibraryTopic {
  id: number
  name: string
  level: string | null
  status: ListeningLibraryTopicStatus
}

/** Learner-facing question shape - no correct option, so the answer isn't leaked before submit. */
export interface ListeningLibraryQuestion {
  questionId: number
  questionText: string
  options: string[]
}

export interface ListeningLibrarySection {
  sectionId: number
  passageText: string
  /** Null if audio synthesis hasn't produced a clip for this section. */
  audioUrl: string | null
  questions: ListeningLibraryQuestion[]
}

export interface ListeningLibraryAnswerItem {
  questionId: number
  selectedOption: string
}

export interface SubmitListeningLibraryAnswersRequest {
  answers: ListeningLibraryAnswerItem[]
}

/** Whole-section grading result - unlike grammar/vocab library's per-question grading, listening
 *  library scores the entire submitted answer set in one call. */
export interface ListeningLibraryAnswerResult {
  score: number
  correctCount: number
  totalQuestions: number
  topicPassed: boolean
  nextTopicId: number | null
  nextTopicUnlocked: boolean
}

export interface ListeningLibraryHistoryEntry {
  id: number
  sectionId: number
  score: number | null
  correctCount: number | null
  totalQuestions: number | null
  startedAt: string | null
  completedAt: string | null
}

// --- "Học & Luyện tập với AI" - speaking/pronunciation skill ---

export interface PhonemeScore {
  ipa: string
  score: number
}

export interface WordScore {
  word: string
  score: number
  phonemes: PhonemeScore[]
}

/** Unlike vocabulary/grammar/listening, the target text is shown upfront - speaking practice is
 * about pronouncing known text, not testing comprehension. */
export interface SpeakingPracticeItem {
  practiceItemId: number
  /** Null until Supertonic has finished synthesizing the sample (model) audio. */
  sampleAudioUrl: string | null
  level: string | null
  examType: string | null
  topic: string | null
  targetText: string
  translation: string | null
  createdAt: string
}

export interface GenerateSpeakingPracticeRequest {
  level?: string
  examType?: string
  focusItems?: string[]
}

export interface SpeakingAttemptResult {
  overall: number
  words: WordScore[]
  /** What the learner actually said, per ai-service's own ASR pass. */
  transcript: string
  weakPhonemes: string[]
  actionAdvice: string[]
}

export interface SpeakingAttemptHistoryEntry {
  attemptId: number
  practiceItemId: number
  level: string | null
  examType: string | null
  topic: string | null
  overallScore: number
  attemptedAt: string
}

export interface SpeakingAttemptDetail {
  attemptId: number
  level: string | null
  examType: string | null
  topic: string | null
  targetText: string
  overallScore: number
  words: WordScore[]
  transcript: string
  weakPhonemes: string[]
  attemptedAt: string
}

// --- Speaking library: fixed topics -> a Section of sample sentences, each read aloud and scored
// one at a time (unlike listening's single passage+batch-submit, or vocab's card-by-card Section) ---

export type SpeakingLibraryTopicStatus = "LOCKED" | "UNLOCKED" | "IN_PROGRESS" | "PASSED"

export interface SpeakingLibraryTopic {
  id: number
  name: string
  level: string | null
  status: SpeakingLibraryTopicStatus
}

/** Learner-facing view of one sentence in the section: text, IPA and the fetchable sample-audio URL. */
export interface SpeakingLibrarySentence {
  sentenceId: number
  sentenceText: string
  ipa: string | null
  /** Null if Supertonic hasn't finished synthesizing the sample audio yet. */
  sampleAudioUrl: string | null
}

export interface SpeakingLibrarySection {
  sectionId: number
  sentences: SpeakingLibrarySentence[]
}

/** Scoring result for one recorded sentence attempt - unlike the non-library flow's
 *  SpeakingAttemptResult, there's no per-word/phoneme breakdown, just this sentence's phoneme/word
 *  scores and pass/fail. Does not itself affect topic gating (see FinishSpeakingSectionResult). */
export interface SpeakingSentenceAttemptResult {
  sentenceId: number
  phonemeScore: number
  wordScore: number
  passed: boolean
  transcript: string
}

/** Result of finishing a section: whether every sentence passed, plus whether the topic was just
 *  passed/unlocked the next one. */
export interface FinishSpeakingSectionResult {
  totalSentences: number
  passedSentences: number
  passed: boolean
  nextTopicId: number | null
  nextTopicUnlocked: boolean
}

export interface SpeakingLibraryHistoryEntry {
  id: number
  sectionId: number
  sentenceId: number
  phonemeScore: number | null
  wordScore: number | null
  createdAt: string
}
