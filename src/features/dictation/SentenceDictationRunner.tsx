import { Check, Lightbulb, Play, SkipForward, Volume2, X } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { useSentenceRunner } from "@/features/dictation/useSentenceRunner"
import { rawApiClient } from "@/lib/api-client"
import { EASE_OUT } from "@/lib/motion"
import { cn } from "@/lib/utils"
import type { DictationClipDetail, DictationSentence, DictationSentenceMistake } from "@/types/api"

// Estimates a not-yet-AI-aligned sentence's time range as its share of the clip's word count against
// the audio's total duration, so "Listen to this sentence" still plays roughly just that sentence
// instead of the whole clip - an approximation, not exact word-boundary timing, but far closer than
// starting over from 0:00 every time.
function estimateSentenceRange(
  sentences: DictationSentence[],
  index: number,
  durationSeconds: number
): { startMs: number; endMs: number } {
  const wordCounts = sentences.map((s) => s.text.trim().split(/\s+/).filter(Boolean).length || 1)
  const totalWords = wordCounts.reduce((sum, count) => sum + count, 0)
  const wordsBefore = wordCounts.slice(0, index).reduce((sum, count) => sum + count, 0)
  const wordsThroughCurrent = wordsBefore + wordCounts[index]
  const durationMs = durationSeconds * 1000
  return {
    startMs: (wordsBefore / totalWords) * durationMs,
    endMs: (wordsThroughCurrent / totalWords) * durationMs,
  }
}

// Sentence-by-sentence dictation practice for one clip: listen to a sentence, type it, then
// explicitly check the answer. A wrong check must be corrected and re-checked - there is no way to
// skip past it - and only a correct check unlocks the manual "next sentence" action, so nothing ever
// auto-advances. A hint button unlocks once the learner has listened to the current sentence at
// least `minListensForHint` times; clicking it while still locked shows a toast telling the learner
// how many more listens are needed, instead of silently doing nothing.
//
// UI improvements over the previous version:
// - Wider layout (`max-w-2xl`) so the typing area and controls aren't cramped.
// - Visual "listening" state on the play button (pulsing icon + accent ring) so the learner
//   knows audio is active even though playback has no visible player UI (see the Web Audio API
//   note below).
// - A slim progress bar at the top replaces the text-only "Sentence 3/8" for faster scanning.
// - The primary action doubles as "Kiểm tra" (check) while unverified/wrong and "Câu tiếp theo"
//   (next) once the check comes back correct, so there's always exactly one clear next step.
// - Hint button uses a muted amber tint when almost unlocked (communicates "almost available")
//   rather than a plain disabled gray state, and is always clickable so a locked click can explain
//   itself via toast rather than doing nothing.
// - Pressing Ctrl (anywhere on the page, including while typing) replays the current sentence, with
//   a caption under the listen button so the learner discovers the shortcut.
// - Pressing Enter mirrors the primary button: checks the answer, then (once correct) advances to
//   the next sentence - bound at the window level since the input disables itself once correct.
// - "Listen to this sentence" only ever plays that one sentence: if the clip's sentences have real
//   AI-aligned timestamps it seeks precisely; if not (alignment still pending/failed), it estimates a
//   range from the sentence's share of the clip's word count rather than replaying the whole clip
//   from 0:00 (see estimateSentenceRange below).
// - The clip's audio is fetched once and decoded via the Web Audio API into an in-memory AudioBuffer,
//   then played per-sentence with an AudioBufferSourceNode(offset, duration) instead of seeking a
//   plain <audio> element. A native <audio> element's `.currentTime`/`.duration` are unreliable for
//   many real-world files (some browsers report `duration: Infinity` for certain containers, or
//   silently fail to seek forward when the resource isn't fully buffered/Range-served) - that's why
//   "Listen to this sentence" for, say, sentence 3 was audibly playing through sentences 1 and 2
//   first: the seek never actually landed, so playback just continued from wherever it already was
//   until the old stopAt logic caught up to sentence 3's endMs. Decoding once into an AudioBuffer and
//   starting playback at an exact sample offset/duration sidesteps all of that - it's sample-accurate
//   and has no dependency on container metadata or server Range support.
export function SentenceDictationRunner({
  clip,
  audioSrc,
  minListensForHint,
  onComplete,
}: {
  clip: DictationClipDetail
  audioSrc: string
  minListensForHint: number
  onComplete: (fullTranscript: string, mistakes: DictationSentenceMistake[]) => void
}) {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const runner = useSentenceRunner(clip.sentences, minListensForHint, onComplete)
  const { currentSentence } = runner

  // Whether audio is currently playing (for the listen-button visual state).
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioBufferReady, setAudioBufferReady] = useState(false)
  const [audioLoadFailed, setAudioLoadFailed] = useState(false)

  const audioContextRef = useRef<AudioContext | null>(null)
  const audioBufferRef = useRef<AudioBuffer | null>(null)
  // The currently-playing source node, if any - AudioBufferSourceNodes are one-shot (can't be
  // restarted), so every "Listen" click creates a fresh one from the shared buffer and stops
  // whichever node was previously playing.
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null)

  // Stops whatever sentence is currently playing (if any). Also called when advancing to the next
  // sentence, so leftover playback from the previous sentence never bleeds into the next one.
  const stopPlayback = useCallback(() => {
    const source = currentSourceRef.current
    if (source) {
      source.onended = null
      try {
        source.stop()
      } catch {
        // Already stopped/ended - nothing to do.
      }
      currentSourceRef.current = null
    }
    setIsPlaying(false)
  }, [])

  // Fetches the clip's audio once as raw bytes and decodes it into an AudioBuffer via the Web Audio
  // API - see the class-level comment above for why this replaces seeking a plain <audio> element.
  useEffect(() => {
    const AudioContextCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioContextCtor()
    audioContextRef.current = ctx
    audioBufferRef.current = null
    setAudioBufferReady(false)
    setAudioLoadFailed(false)

    let cancelled = false
    rawApiClient
      .get<ArrayBuffer>(audioSrc, { responseType: "arraybuffer" })
      .then(({ data }) => ctx.decodeAudioData(data))
      .then((buffer) => {
        if (cancelled) return
        audioBufferRef.current = buffer
        setAudioBufferReady(true)
      })
      .catch((err) => {
        console.error("Failed to load/decode dictation clip audio", err)
        if (!cancelled) setAudioLoadFailed(true)
      })

    return () => {
      cancelled = true
      stopPlayback()
      audioBufferRef.current = null
      void ctx.close()
      audioContextRef.current = null
    }
  }, [audioSrc, stopPlayback])

  // Stop (not just visually reset) any lingering playback when the learner advances to a new
  // sentence, so a still-playing previous sentence doesn't keep running underneath the new one.
  useEffect(() => {
    stopPlayback()
  }, [runner.index, stopPlayback])

  const playRange = useCallback(
    (startMs: number, endMs: number | null) => {
      const ctx = audioContextRef.current
      const buffer = audioBufferRef.current
      if (!ctx || !buffer) return
      stopPlayback()
      void ctx.resume()

      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.connect(ctx.destination)
      const offsetSeconds = Math.min(Math.max(startMs / 1000, 0), buffer.duration)
      const clipSeconds =
        endMs != null ? Math.max(0, endMs / 1000 - offsetSeconds) : undefined

      source.onended = () => {
        if (currentSourceRef.current === source) {
          currentSourceRef.current = null
          setIsPlaying(false)
        }
      }
      currentSourceRef.current = source
      setIsPlaying(true)
      if (clipSeconds != null) {
        source.start(0, offsetSeconds, clipSeconds)
      } else {
        source.start(0, offsetSeconds)
      }
    },
    [stopPlayback]
  )

  const handleListen = useCallback(() => {
    if (!currentSentence || !audioBufferReady) return

    runner.registerListen()
    const { startMs, endMs } = currentSentence
    if (startMs != null) {
      playRange(startMs, endMs)
      return
    }

    // Not yet AI-aligned - estimate this sentence's slice of the clip from its share of the total
    // word count (using the decoded buffer's exact duration), so it still plays roughly just this
    // sentence rather than the whole clip from 0:00.
    const buffer = audioBufferRef.current
    if (buffer) {
      const estimate = estimateSentenceRange(clip.sentences, runner.index, buffer.duration)
      playRange(estimate.startMs, estimate.endMs)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSentence, clip.sentences, runner.index, playRange, audioBufferReady])

  // Ctrl replays the current sentence from anywhere on the page (including while typing in the
  // transcript input), so the learner doesn't have to reach for the mouse to hear it again. Ignores
  // key-repeat so holding Ctrl down doesn't replay on a loop.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Control" && !e.repeat) {
        e.preventDefault()
        handleListen()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleListen])

  function handleHintClick() {
    if (!runner.hintUnlocked) {
      toast.info(
        t("dictation.hintLocked", { count: minListensForHint - runner.listenCount })
      )
      return
    }
    runner.toggleHint()
  }

  const readyToAdvance = runner.checked && runner.isCorrect === true
  const showsIncorrect = runner.checked && runner.isCorrect === false
  const canSubmit = readyToAdvance || runner.input.trim().length > 0

  const handlePrimaryAction = useCallback(() => {
    if (readyToAdvance) {
      runner.goToNext()
    } else if (runner.input.trim()) {
      runner.checkAnswer()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyToAdvance, runner.input, runner.goToNext, runner.checkAnswer])

  // Enter mirrors the primary button: checks the typed answer, or - once that check came back
  // correct - advances to the next sentence. Bound at the window level (not just the input's
  // onKeyDown) because the transcript input is disabled once a check is correct, so it can no
  // longer receive keyboard events itself.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Enter" && !e.repeat) {
        e.preventDefault()
        handlePrimaryAction()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handlePrimaryAction])

  if (!currentSentence) return null

  const hintAlmostReady =
    !runner.hintUnlocked && runner.listenCount > 0 && runner.listenCount < minListensForHint

  return (
    <div className="flex w-full max-w-2xl flex-col gap-5 rounded-2xl bg-card p-6 shadow-clay">
      {/* Top bar: clip badge + sentence progress. */}
      <div className="flex items-center justify-between gap-3">
        <Badge variant="secondary" className="shrink-0">
          {clip.title}
        </Badge>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Progress
            value={((runner.index + 1) / runner.total) * 100}
            className="h-1.5 flex-1"
            aria-label={t("dictation.sentenceProgress", {
              current: runner.index + 1,
              total: runner.total,
            })}
          />
          <span className="text-xs font-medium tabular-nums text-muted-foreground">
            {runner.index + 1}/{runner.total}
          </span>
        </div>
      </div>

      <motion.div
        key={runner.index}
        className="flex flex-col gap-4"
        initial={{ opacity: 0, x: reduceMotion ? 0 : 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.25, ease: EASE_OUT }}
      >
        {/* Listen button — visual "playing" state with pulsing icon + accent ring; disabled until
            the clip's audio has finished preloading. */}
        <Button
          variant="outline"
          size="lg"
          className={cn(
            "h-12 gap-2.5 transition-all duration-150 ease-out motion-reduce:transition-none",
            isPlaying && "border-accent-warm/40 bg-accent-warm/5 text-accent-warm shadow-clay-warm"
          )}
          disabled={!audioBufferReady}
          onClick={handleListen}
        >
          {isPlaying ? (
            <Volume2 className="size-5 animate-pulse motion-reduce:animate-none" />
          ) : (
            <Play className="size-5" />
          )}
          {isPlaying
            ? t("dictation.listeningNow")
            : audioLoadFailed
              ? t("dictation.audioLoadError")
              : audioBufferReady
                ? t("dictation.listenSentence")
                : t("dictation.audioLoading")}
        </Button>
        <p className="-mt-2 text-center text-xs text-muted-foreground">
          {t("dictation.listenShortcutHint")}
        </p>

        {/* Transcript input — reflects the last check's verdict until the learner edits again. */}
        <div className="relative">
          <Input
            id="sentence-transcript-input"
            value={runner.input}
            onChange={(e) => runner.onInputChange(e.target.value)}
            placeholder={t("dictation.transcriptPlaceholder")}
            aria-label={t("dictation.transcriptLabel")}
            aria-invalid={showsIncorrect}
            disabled={readyToAdvance}
            className={cn(
              "h-12 text-base transition-all duration-150 ease-out motion-reduce:transition-none",
              readyToAdvance && "border-primary/40 bg-primary/5 ring-2 ring-primary/20",
              showsIncorrect && "border-destructive/50 bg-destructive/5 ring-2 ring-destructive/20"
            )}
            autoFocus
          />
          {readyToAdvance && (
            <motion.span
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-semibold text-primary"
              initial={{ opacity: 0, x: reduceMotion ? 0 : 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.2, ease: EASE_OUT }}
            >
              <Check className="size-3.5" />
              {t("dictation.sentenceCorrect")}
            </motion.span>
          )}
        </div>

        {/* Incorrect-check feedback — explicit, persists until the learner edits or re-checks. */}
        {showsIncorrect && (
          <p className="flex items-center gap-1.5 text-sm font-medium text-destructive">
            <X className="size-4 shrink-0" />
            {t("dictation.sentenceIncorrect")}
          </p>
        )}

        {/* Actions: hint + primary (check/next). Hint uses warm tint when almost unlocked. */}
        <div className="flex gap-2">
          <Button
            variant={runner.hintUnlocked ? "outline" : "ghost"}
            size="lg"
            className={cn(
              "h-12 flex-1 gap-2 transition-all duration-150 ease-out motion-reduce:transition-none",
              hintAlmostReady && "border-amber-500/30 bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
            )}
            aria-pressed={runner.hintRevealed}
            title={
              runner.hintUnlocked
                ? undefined
                : t("dictation.hintLocked", { count: minListensForHint - runner.listenCount })
            }
            onClick={handleHintClick}
          >
            <Lightbulb
              className={cn(
                "size-4.5",
                hintAlmostReady && "text-amber-500 dark:text-amber-400"
              )}
            />
            {runner.hintRevealed ? t("dictation.hintHide") : t("dictation.hint")}
            {!runner.hintUnlocked && (
              <span className="ml-0.5 text-[0.65rem] tabular-nums opacity-60">
                ({minListensForHint - runner.listenCount})
              </span>
            )}
          </Button>
          <Button
            size="lg"
            className="h-12 flex-1 gap-2"
            disabled={!canSubmit}
            onClick={handlePrimaryAction}
          >
            {readyToAdvance ? (
              <>
                <SkipForward className="size-4.5" />
                {t("dictation.nextSentence")}
              </>
            ) : (
              <>
                <Check className="size-4.5" />
                {t("dictation.check")}
              </>
            )}
          </Button>
        </div>

        {/* Hint reveal — slides down when toggled. Shows the answer text, plus its translation
            (if one was generated for this sentence) right underneath. */}
        {runner.hintRevealed && (
          <motion.div
            className="flex flex-col gap-1.5 rounded-2xl bg-muted/50 p-4 text-sm leading-relaxed text-muted-foreground"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: EASE_OUT }}
          >
            <p>{currentSentence.text}</p>
            {currentSentence.translation && (
              <p className="border-t border-border/60 pt-1.5 text-xs italic">
                <span className="not-italic font-medium">{t("dictation.translationLabel")}: </span>
                {currentSentence.translation}
              </p>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
