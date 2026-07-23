// Client-side grading utilities that mirror english-service's scorers exactly, so the learner gets
// instant per-question feedback while practicing. The server still re-grades on the final submit and
// runs the AI/LLM pass - this is only for immediate UI feedback, never the source of truth for
// history/weak-points.

// Threshold (WER accuracy) above which a listening KEYWORD answer counts as correct - mirrors the
// server's DictationScorer pass mark.
export const KEYWORD_ACCURACY_THRESHOLD = 0.6

// Normalizes a string for exact comparison: trim, lowercase, collapse internal whitespace, and
// (optionally) strip trailing sentence punctuation - mirrors the server's normalizeExact.
export function normalizeExact(
  text: string | null | undefined,
  stripTrailingPunctuation: boolean
): string {
  if (text == null) return ""
  let normalized = text.trim().toLowerCase().replace(/\s+/g, " ")
  if (stripTrailingPunctuation) {
    normalized = normalized.replace(/[.!?]+$/, "")
  }
  return normalized
}

// Splits text into word tokens for WER, dropping punctuation - mirrors DictationScorer.tokenize.
export function tokenize(text: string | null | undefined): string[] {
  if (text == null || text.trim() === "") return []
  const cleaned = text
    .toLowerCase()
    .replace(/[^a-z0-9' ]/g, " ")
    .trim()
  if (cleaned === "") return []
  return cleaned.split(/\s+/)
}

// Word-level Wagner-Fischer edit distance between reference and actual token lists; returns the
// substitution/deletion/insertion count needed to turn reference into actual.
function wordEditDistance(reference: string[], actual: string[]): number {
  const rows = reference.length
  const cols = actual.length
  // dp[i][j] = edit distance between reference[0..i) and actual[0..j).
  const dp: number[][] = Array.from({ length: rows + 1 }, () => new Array<number>(cols + 1).fill(0))
  for (let i = 0; i <= rows; i++) dp[i][0] = i
  for (let j = 0; j <= cols; j++) dp[0][j] = j
  for (let i = 1; i <= rows; i++) {
    for (let j = 1; j <= cols; j++) {
      if (reference[i - 1] === actual[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])
      }
    }
  }
  return dp[rows][cols]
}

// Word-error-rate accuracy in [0,1]: 1 - WER, clamped - mirrors DictationScorer's accuracy.
export function werAccuracy(answer: string | null | undefined, user: string | null | undefined): number {
  const reference = tokenize(answer)
  const actual = tokenize(user)
  let wer: number
  if (reference.length === 0) {
    wer = actual.length === 0 ? 0 : 1
  } else {
    wer = wordEditDistance(reference, actual) / reference.length
  }
  return Math.max(0, Math.min(1, 1 - wer))
}

// Vocabulary: exact match, punctuation kept - mirrors VocabAttemptScorer.
export function scoreVocabAnswer(user: string, answer: string): boolean {
  return normalizeExact(user, false) === normalizeExact(answer, false)
}

// Grammar: exact match, trailing punctuation stripped - mirrors GrammarAttemptScorer.
export function scoreGrammarAnswer(user: string, answer: string): boolean {
  return normalizeExact(user, true) === normalizeExact(answer, true)
}

// Listening: MCQ = exact match, KEYWORD = WER accuracy >= threshold, OPEN = not gradable locally
// (answer is null on the server). Returns null when it cannot be graded on the client.
export function scoreListeningAnswer(
  user: string,
  answer: string | null,
  type: "MCQ" | "KEYWORD" | "OPEN"
): boolean | null {
  if (type === "OPEN" || answer == null) return null
  if (type === "MCQ") return normalizeExact(user, false) === normalizeExact(answer, false)
  // KEYWORD
  return werAccuracy(answer, user) >= KEYWORD_ACCURACY_THRESHOLD
}
