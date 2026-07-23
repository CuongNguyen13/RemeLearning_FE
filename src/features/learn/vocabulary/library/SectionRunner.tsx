import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { getVocabLibraryWordAudioUrl } from "@/api/learners"
import type { SectionCard as SectionCardData } from "@/types/api"

interface SectionRunnerProps {
  userId: string
  card: SectionCardData
  isSubmitting: boolean
  onSubmit: (answer?: string) => void
}

// Renders one Section card: the INTRO flashcard (word/meaning/example/audio, unscored "Đã hiểu" to
// continue) or one of the five typed-answer/options-based QUIZ shapes. MCQ/MATCHING show `options`
// as a pick-list (single click submits immediately); every other type is a free-text Input with an
// explicit submit button, since the learner is typing a word or a meaning, not choosing one.
export function SectionRunner({ userId, card, isSubmitting, onSubmit }: SectionRunnerProps) {
  const { t } = useTranslation()
  const [textAnswer, setTextAnswer] = useState("")
  const audioRef = useRef<HTMLAudioElement>(null)

  // Clears the typed answer whenever a new card arrives, so a leftover value from the previous
  // card's Input can't be accidentally submitted for this one.
  useEffect(() => {
    setTextAnswer("")
  }, [card.sectionId, card.libraryWordId, card.cardKind, card.exerciseType])

  // Pressing Ctrl (either key, without needing a full combo) replays the current card's audio, so
  // the learner can re-listen without reaching for the mouse.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Control") {
        void audioRef.current?.play()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const progressPercent = card.progress.totalWords === 0
    ? 0
    : Math.round((card.progress.wordsMastered / card.progress.totalWords) * 100)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Progress value={progressPercent} />
        <span className="text-xs text-muted-foreground">
          {t("learn.vocabulary.library.progress", {
            mastered: card.progress.wordsMastered,
            total: card.progress.totalWords,
          })}
        </span>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 py-6">
          {card.cardKind === "INTRO" ? (
            <div className="flex flex-col gap-3">
              <Badge variant="secondary" className="w-fit">{t("learn.vocabulary.library.newWord")}</Badge>
              <p className="text-2xl font-semibold">
                {card.word}
                {card.ipa && <span className="ml-2 text-base font-normal text-muted-foreground">/{card.ipa}/</span>}
              </p>
              <p className="text-muted-foreground">{card.meaningVi}</p>
              {card.exampleEn && <p className="italic text-sm">{card.exampleEn}</p>}
              {card.audioUrl && (
                <audio ref={audioRef} controls className="w-full" src={getVocabLibraryWordAudioUrl(userId, card.libraryWordId)}>
                  {t("learn.listening.audioUnsupported")}
                </audio>
              )}
              <Button onClick={() => onSubmit()} disabled={isSubmitting}>
                {t("learn.vocabulary.library.gotIt")}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Per-exercise-type task requirement in the app language, so every quiz card states
                  what to do (fill the blank, pick the meaning, ...) above the prompt. */}
              {card.exerciseType && (
                <p className="text-sm font-medium text-primary">
                  {t(`learn.vocabulary.library.exerciseInstructions.${card.exerciseType}`)}
                </p>
              )}
              <p className="text-lg font-medium">{card.prompt}</p>
              {card.audioUrl && (
                <audio ref={audioRef} controls className="w-full" src={getVocabLibraryWordAudioUrl(userId, card.libraryWordId)}>
                  {t("learn.listening.audioUnsupported")}
                </audio>
              )}

              {card.options ? (
                <div className="flex flex-col gap-2">
                  {card.options.map((option) => (
                    <Button
                      key={option}
                      variant="outline"
                      className="justify-start"
                      disabled={isSubmitting}
                      onClick={() => onSubmit(option)}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              ) : (
                <form
                  className="flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault()
                    onSubmit(textAnswer)
                  }}
                >
                  <Input
                    autoFocus
                    value={textAnswer}
                    onChange={(event) => setTextAnswer(event.target.value)}
                    placeholder={t("learn.vocabulary.library.typeAnswer")}
                    disabled={isSubmitting}
                  />
                  <Button type="submit" disabled={isSubmitting}>
                    {t("learn.vocabulary.library.submit")}
                  </Button>
                </form>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
