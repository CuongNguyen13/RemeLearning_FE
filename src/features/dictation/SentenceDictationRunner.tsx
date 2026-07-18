import { Headphones, Lightbulb } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { useRef } from "react"
import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSentenceRunner } from "@/features/dictation/useSentenceRunner"
import type { DictationClipDetail } from "@/types/api"

// Quint ease-out: fast start, gentle settle - matches the rest of the practice flow's motion.
const EASE_OUT = [0.22, 1, 0.36, 1] as const

// Sentence-by-sentence dictation practice for one clip: listen to a sentence, type it, and
// either auto-advance on a correct match or move on manually. A hint button unlocks once the
// learner has listened to the current sentence at least `minListensForHint` times.
export function SentenceDictationRunner({
  clip,
  audioSrc,
  minListensForHint,
  onComplete,
}: {
  clip: DictationClipDetail
  audioSrc: string
  minListensForHint: number
  onComplete: (fullTranscript: string) => void
}) {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const audioRef = useRef<HTMLAudioElement>(null)
  const runner = useSentenceRunner(clip.sentences, minListensForHint, onComplete)
  const { currentSentence } = runner

  function handleListen() {
    const audio = audioRef.current
    if (!audio || !currentSentence) return

    runner.registerListen()
    const { startMs, endMs } = currentSentence
    if (startMs == null) {
      // Not yet AI-aligned - fall back to playing the whole clip from the start.
      audio.currentTime = 0
      void audio.play()
      return
    }

    audio.currentTime = startMs / 1000
    void audio.play()
    if (endMs != null) {
      const stopAt = () => {
        if (audio.currentTime * 1000 >= endMs) {
          audio.pause()
          audio.removeEventListener("timeupdate", stopAt)
        }
      }
      audio.addEventListener("timeupdate", stopAt)
    }
  }

  if (!currentSentence) return null

  return (
    <div className="flex w-full max-w-md flex-col gap-5 rounded-3xl bg-card p-6 shadow-clay">
      <div className="flex items-center justify-between">
        <Badge variant="secondary">{clip.title}</Badge>
        <p className="text-sm font-medium text-muted-foreground">
          {t("dictation.sentenceProgress", { current: runner.index + 1, total: runner.total })}
        </p>
      </div>

      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} preload="metadata" className="hidden" src={audioSrc} />

      <motion.div
        key={runner.index}
        className="flex flex-col gap-4"
        initial={{ opacity: 0, x: reduceMotion ? 0 : 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.25, ease: EASE_OUT }}
      >
        <Button variant="outline" className="h-11" onClick={handleListen}>
          <Headphones /> {t("dictation.listenSentence")}
        </Button>

        <Input
          value={runner.input}
          onChange={(e) => runner.onInputChange(e.target.value)}
          placeholder={t("dictation.transcriptPlaceholder")}
          aria-label={t("dictation.transcriptLabel")}
          className="h-11"
          autoFocus
        />

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="h-11 flex-1"
            disabled={!runner.hintUnlocked}
            title={
              runner.hintUnlocked
                ? undefined
                : t("dictation.hintLocked", {
                    count: minListensForHint - runner.listenCount,
                  })
            }
          >
            <Lightbulb /> {t("dictation.hint")}
          </Button>
          <Button className="h-11 flex-1" onClick={runner.goToNext}>
            {t("dictation.nextSentence")}
          </Button>
        </div>

        {runner.hintUnlocked && (
          <p className="rounded-2xl bg-muted/50 p-3 text-sm text-muted-foreground">
            {currentSentence.text}
          </p>
        )}
      </motion.div>
    </div>
  )
}
