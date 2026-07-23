import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  useFinishSpeakingSection,
  useSubmitSentenceAttempt,
} from "@/features/learn/speaking/library/hooks"
import { SpeakingRecorder } from "@/features/learn/speaking/SpeakingRecorder"
import { ApiError } from "@/lib/http"
import { cn } from "@/lib/utils"
import type {
  FinishSpeakingSectionResult,
  SentenceAttemptResult,
  SpeakingLibrarySection,
} from "@/types/api"

interface SectionRunnerProps {
  userId: string
  section: SpeakingLibrarySection
  onBackToTopics: () => void
}

// Colors a score red/amber/green, same thresholds as PronunciationResultPanel's per-word scoring.
function scoreColorClass(score: number): string {
  if (score >= 0.8) return "text-primary"
  if (score >= 0.5) return "text-amber-600 dark:text-amber-400"
  return "text-destructive"
}

// Runs one speaking-library Section: every sentence in the pool read aloud one at a time (unlike
// listening's single passage+batch-submit, or vocab's card-by-card Section). Each sentence is
// recorded and submitted individually via the exact same SpeakingRecorder/multipart pattern the
// non-library speaking practice flow uses (see SpeakingLearnPage), scored right away with no effect
// on topic gating. Only once every sentence has an attempt does finishSpeakingLibrarySection get
// called, which grades the whole section and can pass the topic / unlock the next one.
export function SectionRunner({ userId, section, onBackToTopics }: SectionRunnerProps) {
  const { t } = useTranslation()
  const [index, setIndex] = useState(0)
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null)
  const [results, setResults] = useState<Record<number, SentenceAttemptResult>>({})
  const [finishResult, setFinishResult] = useState<FinishSpeakingSectionResult | null>(null)

  const submitAttempt = useSubmitSentenceAttempt(userId)
  const finishSection = useFinishSpeakingSection(userId)

  const sentence = section.sentences[index]
  const currentResult = sentence ? results[sentence.sentenceId] : undefined
  const allAttempted = section.sentences.every((s) => !!results[s.sentenceId])
  const isLast = index === section.sentences.length - 1

  function handleSubmit() {
    if (!sentence || !recordedAudio) return
    submitAttempt.mutate(
      { sectionId: section.sectionId, sentenceId: sentence.sentenceId, audio: recordedAudio },
      {
        onSuccess: (result) => {
          setResults((prev) => ({ ...prev, [sentence.sentenceId]: result }))
          setRecordedAudio(null)
        },
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : t("learn.speaking.library.submitError")),
      }
    )
  }

  function handleNext() {
    setRecordedAudio(null)
    setIndex((i) => Math.min(i + 1, section.sentences.length - 1))
  }

  function handleFinish() {
    finishSection.mutate(section.sectionId, {
      onSuccess: setFinishResult,
      onError: (error) =>
        toast.error(error instanceof ApiError ? error.message : t("learn.speaking.library.finishError")),
    })
  }

  if (finishResult) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <p className="text-xl font-semibold">
            {finishResult.passed
              ? t("learn.speaking.library.passedTitle")
              : t("learn.speaking.library.notPassedTitle")}
          </p>
          <p className="text-muted-foreground">
            {t("learn.speaking.library.scoreSubtitle", {
              passed: finishResult.passedSentences,
              total: finishResult.totalSentences,
            })}
          </p>
          {finishResult.nextTopicUnlocked && <Badge>{t("learn.speaking.library.nextUnlocked")}</Badge>}
          <Button onClick={onBackToTopics}>{t("learn.speaking.library.backToTopics")}</Button>
        </CardContent>
      </Card>
    )
  }

  if (!sentence) {
    return null
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-medium text-muted-foreground">
        {t("learn.speaking.library.sentence", { number: index + 1, total: section.sentences.length })}
      </p>

      <Card>
        <CardContent className="flex flex-col gap-2 py-6">
          <p className="text-sm font-medium text-primary">{t("learn.speaking.instruction")}</p>
          <p className="text-lg font-medium">{sentence.sentenceText}</p>
          {sentence.ipa && <p className="text-sm text-muted-foreground">/{sentence.ipa}/</p>}
          {sentence.sampleAudioUrl && (
            <div className="mt-2 flex flex-col gap-1">
              <p className="text-xs font-medium text-muted-foreground">{t("learn.speaking.sampleAudio")}</p>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption -- reference model audio, no captions source exists */}
              <audio controls className="w-full" src={sentence.sampleAudioUrl} />
            </div>
          )}
        </CardContent>
      </Card>

      {!currentResult && (
        <>
          <SpeakingRecorder onRecorded={setRecordedAudio} disabled={submitAttempt.isPending} />
          <Button
            size="lg"
            className="h-12 w-full"
            onClick={handleSubmit}
            disabled={!recordedAudio}
            loading={submitAttempt.isPending}
          >
            {t("learn.speaking.submit")}
          </Button>
        </>
      )}

      {currentResult && (
        <Card>
          <CardContent className="flex flex-col gap-3 py-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {t("learn.speaking.library.phonemeScore")}
              </span>
              <span className={cn("text-lg font-semibold", scoreColorClass(currentResult.phonemeScore))}>
                {Math.round(currentResult.phonemeScore * 100)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {t("learn.speaking.library.wordScore")}
              </span>
              <span className={cn("text-lg font-semibold", scoreColorClass(currentResult.wordScore))}>
                {Math.round(currentResult.wordScore * 100)}%
              </span>
            </div>
            <Badge variant={currentResult.passed ? "default" : "secondary"} className="w-fit">
              {currentResult.passed
                ? t("learn.speaking.library.passed")
                : t("learn.speaking.library.notPassed")}
            </Badge>
            <div className="rounded-xl bg-muted/60 p-3">
              <p className="text-xs font-medium text-primary">{t("learn.speaking.yourTranscript")}</p>
              <p className="text-sm text-foreground/90">{currentResult.transcript}</p>
            </div>

            {isLast ? (
              <Button
                size="lg"
                className="h-12 w-full"
                onClick={handleFinish}
                disabled={!allAttempted}
                loading={finishSection.isPending}
              >
                {t("learn.speaking.library.finish")}
              </Button>
            ) : (
              <Button size="lg" className="h-12 w-full" onClick={handleNext}>
                {t("learn.speaking.library.next")}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
