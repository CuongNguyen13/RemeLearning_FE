import { useCallback, useState } from "react"
import type { DictationSentence, DictationSentenceMistake } from "@/types/api"

// Normalizes a transcript for comparison: lowercase, strip punctuation, collapse whitespace.
export function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
}

// Strips a leading "Speaker: " label from a sentence's text (e.g. "Anna: Excuse me" -> "Excuse me").
// The speaker label is transcript metadata, not part of what's actually spoken in the audio, so the
// learner shouldn't have to type it and it shouldn't count toward audio-timing word estimates.
export function stripSpeakerLabel(text: string): string {
  return text.replace(/^[A-Za-z][A-Za-z .'-]{0,29}:\s*/, "")
}

interface UseSentenceRunnerResult {
  index: number
  total: number
  currentSentence: DictationSentence | undefined
  input: string
  isDone: boolean
  listenCount: number
  hintUnlocked: boolean
  hintRevealed: boolean
  /** Whether the learner has checked the current input since their last edit. */
  checked: boolean
  /** Result of the last check for the current sentence; null before the first check. */
  isCorrect: boolean | null
  onInputChange: (value: string) => void
  registerListen: () => void
  toggleHint: () => void
  /** Validates the typed input against the current sentence; records a mistake if wrong. */
  checkAnswer: () => void
  /** Advances to the next sentence - a no-op unless the current sentence was just checked correct. */
  goToNext: () => void
}

// Drives the sentence-by-sentence dictation flow: the learner types an answer, explicitly checks it
// (checkAnswer), and only advances (goToNext) once that check comes back correct - there is no
// auto-advance and no way to skip a wrong answer, so every sentence in the final transcript is one
// the learner actually got right. Wrong checks are still recorded in `mistakes` (deduped against an
// unedited repeat check) so the caller can forward them to the backend's AI/weak-point pipeline even
// though they never show up in the final per-word diff. Listens are counted per sentence and reset
// when advancing, gating the hint button.
export function useSentenceRunner(
  sentences: DictationSentence[],
  minListensForHint: number,
  onComplete: (fullTranscript: string, mistakes: DictationSentenceMistake[]) => void
): UseSentenceRunnerResult {
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState("")
  const [listenCount, setListenCount] = useState(0)
  const [hintRevealed, setHintRevealed] = useState(false)
  const [answers, setAnswers] = useState<string[]>([])
  const [checked, setChecked] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [lastCheckedInput, setLastCheckedInput] = useState<string | null>(null)
  const [mistakes, setMistakes] = useState<DictationSentenceMistake[]>([])

  const currentSentence = sentences[index]
  const isDone = index >= sentences.length

  const commitAndAdvance = useCallback(
    (answerText: string) => {
      const nextAnswers = [...answers, answerText]
      setAnswers(nextAnswers)
      if (index + 1 >= sentences.length) {
        onComplete(nextAnswers.join(" "), mistakes)
      }
      setIndex((i) => i + 1)
      setInput("")
      setListenCount(0)
      setHintRevealed(false)
      setChecked(false)
      setIsCorrect(null)
      setLastCheckedInput(null)
    },
    [answers, index, sentences.length, onComplete, mistakes]
  )

  // Editing after a check invalidates it - the learner must check again before advancing. Also
  // hides an open hint, since it'd otherwise keep handing over the answer while the learner is
  // still supposed to be recalling it from memory.
  const onInputChange = useCallback((value: string) => {
    setInput(value)
    setChecked(false)
    setIsCorrect(null)
    setHintRevealed(false)
  }, [])

  const registerListen = useCallback(() => {
    setListenCount((count) => count + 1)
  }, [])

  // Reveal/hide the hint once it's unlocked - a no-op if the listen threshold hasn't been met yet,
  // so the caller can bind it directly to the hint button's onClick (and show its own "keep
  // listening" feedback when this turns out to be a no-op).
  const toggleHint = useCallback(() => {
    if (listenCount >= minListensForHint) {
      setHintRevealed((open) => !open)
    }
  }, [listenCount, minListensForHint])

  // Validates the current input against the expected sentence. A wrong result is recorded once per
  // distinct attempt (re-checking the same unedited text again doesn't pile up duplicate mistakes).
  // A correct result replaces the learner's rough typing with the properly capitalized/punctuated
  // sentence - normalizeForMatch ignores case and punctuation for grading, so what the learner typed
  // ("its very big im a little nervous") and the canonical sentence ("It's very big! I'm a little
  // nervous.") both count as correct, but only the canonical form should stick around on screen.
  const checkAnswer = useCallback(() => {
    if (!currentSentence) return
    const expectedText = stripSpeakerLabel(currentSentence.text)
    const correct = normalizeForMatch(input) === normalizeForMatch(expectedText)
    const isRepeatOfLastCheck = checked && input === lastCheckedInput
    setChecked(true)
    setIsCorrect(correct)
    setLastCheckedInput(input)
    if (correct) {
      setInput(expectedText)
    } else if (!isRepeatOfLastCheck) {
      setMistakes((prev) => [
        ...prev,
        { sentenceIndex: index, expectedText, attemptedText: input.trim() },
      ])
    }
  }, [checked, currentSentence, index, input, lastCheckedInput])

  // Only ever advances past a sentence the learner just checked correct.
  const goToNext = useCallback(() => {
    if (!currentSentence || !checked || !isCorrect) return
    commitAndAdvance(input.trim())
  }, [currentSentence, checked, isCorrect, input, commitAndAdvance])

  return {
    index,
    total: sentences.length,
    currentSentence,
    input,
    isDone,
    listenCount,
    hintUnlocked: listenCount >= minListensForHint,
    hintRevealed,
    checked,
    isCorrect,
    onInputChange,
    registerListen,
    toggleHint,
    checkAnswer,
    goToNext,
  }
}
