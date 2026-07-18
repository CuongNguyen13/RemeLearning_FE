import { useCallback, useState } from "react"
import type { DictationSentence } from "@/types/api"

// Normalizes a transcript for comparison: lowercase, strip punctuation, collapse whitespace.
export function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
}

interface UseSentenceRunnerResult {
  index: number
  total: number
  currentSentence: DictationSentence | undefined
  input: string
  isDone: boolean
  listenCount: number
  hintUnlocked: boolean
  onInputChange: (value: string) => void
  registerListen: () => void
  goToNext: () => void
}

// Drives the sentence-by-sentence dictation flow: matches typed input against the current
// sentence, auto-advancing on a correct match, and always allows a manual "next" as a fallback.
// Listens are counted per sentence and reset when advancing, gating the hint button.
export function useSentenceRunner(
  sentences: DictationSentence[],
  minListensForHint: number,
  onComplete: (fullTranscript: string) => void
): UseSentenceRunnerResult {
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState("")
  const [listenCount, setListenCount] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])

  const currentSentence = sentences[index]
  const isDone = index >= sentences.length

  const commitAndAdvance = useCallback(
    (answerText: string) => {
      const next = [...answers, answerText]
      setAnswers(next)
      if (index + 1 >= sentences.length) {
        onComplete(next.join(" "))
      }
      setIndex((i) => i + 1)
      setInput("")
      setListenCount(0)
    },
    [answers, index, sentences.length, onComplete]
  )

  const onInputChange = useCallback(
    (value: string) => {
      setInput(value)
      if (currentSentence && normalizeForMatch(value) === normalizeForMatch(currentSentence.text)) {
        commitAndAdvance(value.trim())
      }
    },
    [currentSentence, commitAndAdvance]
  )

  const registerListen = useCallback(() => {
    setListenCount((count) => count + 1)
  }, [])

  const goToNext = useCallback(() => {
    if (!currentSentence) return
    commitAndAdvance(input.trim())
  }, [currentSentence, input, commitAndAdvance])

  return {
    index,
    total: sentences.length,
    currentSentence,
    input,
    isDone,
    listenCount,
    hintUnlocked: listenCount >= minListensForHint,
    onInputChange,
    registerListen,
    goToNext,
  }
}
