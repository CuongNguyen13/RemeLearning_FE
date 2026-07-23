import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useSubmitListeningLibraryAnswers } from "@/features/learn/listening/library/hooks"
import { ApiError } from "@/lib/http"
import type { ListeningLibraryAnswerResult, ListeningLibrarySection } from "@/types/api"

interface SectionRunnerProps {
  userId: string
  section: ListeningLibrarySection
  onBackToTopics: () => void
}

// Runs one listening-library Section: passage + audio up front, then every MCQ question answered
// locally (same RadioGroup rendering as ListeningQuestions' practice-mode MCQ), before a single
// batch submit. Unlike listening's non-library practice mode, the question payload withholds the
// correct option (see ListeningLibraryQuestion), so there's no local pre-submit feedback here - the
// whole set is only graded once, server-side, on submit.
export function SectionRunner({ userId, section, onBackToTopics }: SectionRunnerProps) {
  const { t } = useTranslation()
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [result, setResult] = useState<ListeningLibraryAnswerResult | null>(null)
  const submitAnswers = useSubmitListeningLibraryAnswers(userId)

  function setAnswer(questionId: number, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  function handleSubmit() {
    submitAnswers.mutate(
      {
        sectionId: section.sectionId,
        request: {
          answers: section.questions.map((question) => ({
            questionId: question.questionId,
            selectedOption: answers[question.questionId] ?? "",
          })),
        },
      },
      {
        onSuccess: setResult,
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : t("learn.listening.library.answerError")),
      }
    )
  }

  if (result) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <p className="text-xl font-semibold">
            {result.topicPassed
              ? t("learn.listening.library.passedTitle")
              : t("learn.listening.library.notPassedTitle")}
          </p>
          <p className="text-muted-foreground">
            {t("learn.listening.library.scoreSubtitle", {
              correct: result.correctCount,
              total: result.totalQuestions,
            })}
          </p>
          {result.nextTopicUnlocked && <Badge>{t("learn.listening.library.nextUnlocked")}</Badge>}
          <Button onClick={onBackToTopics}>{t("learn.listening.library.backToTopics")}</Button>
        </CardContent>
      </Card>
    )
  }

  const allAnswered = section.questions.every((question) => !!answers[question.questionId])

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-3 py-5">
          <p className="text-sm font-medium text-muted-foreground">{t("learn.listening.library.passageLabel")}</p>
          <p className="whitespace-pre-line text-base">{section.passageText}</p>
          {section.audioUrl && (
            // eslint-disable-next-line jsx-a11y/media-has-caption -- no captions source exists, matching ListeningPlayer.
            <audio controls className="w-full" src={section.audioUrl}>
              {t("learn.listening.audioUnsupported")}
            </audio>
          )}
        </CardContent>
      </Card>

      {section.questions.map((question, index) => (
        <Card key={question.questionId}>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm font-medium text-muted-foreground">
              {t("learn.listening.question", { number: index + 1 })}
            </p>
            <p className="text-base">{question.questionText}</p>
            <RadioGroup
              value={answers[question.questionId] ?? ""}
              onValueChange={(value) => setAnswer(question.questionId, value ?? "")}
              disabled={submitAnswers.isPending}
            >
              {question.options.map((option) => (
                <div key={option} className="flex items-center gap-2">
                  <RadioGroupItem
                    id={`listening-library-answer-${question.questionId}-${option}`}
                    value={option}
                  />
                  <Label htmlFor={`listening-library-answer-${question.questionId}-${option}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      ))}

      <Button
        size="lg"
        className="h-12 w-full"
        onClick={handleSubmit}
        disabled={!allAnswered}
        loading={submitAnswers.isPending}
      >
        {t("learn.listening.library.submit")}
      </Button>
    </div>
  )
}
