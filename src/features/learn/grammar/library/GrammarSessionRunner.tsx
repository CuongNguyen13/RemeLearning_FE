import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { LoadingOverlay } from "@/components/common/LoadingOverlay"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { LocalAnswerFeedback } from "@/features/learn/shared/LocalAnswerFeedback"
import type { GrammarAnswerResult, GrammarSessionQuestion } from "@/types/api"

interface GrammarSessionRunnerProps {
  question: GrammarSessionQuestion
  questionIndex: number
  totalQuestions: number
  isSubmitting: boolean
  // Set once the current question's answer call resolves - swaps the input/options for a
  // correct/incorrect + VI explanation panel until the learner explicitly moves on.
  answerResult: GrammarAnswerResult | null
  onSubmit: (answer: string) => void
  onNext: () => void
}

// Renders one session question: MCQ shows `options` as pick buttons, every other questionType is a
// free-text Input with an explicit submit button. Answers are hidden server-side until submitted
// (see StartGrammarSessionResponse), so there is nothing to grade locally here. Once `answerResult`
// arrives, the input/options are replaced by a translation/explanation panel and a "Next" button -
// the session only advances to the next question when the learner presses it, never automatically.
export function GrammarSessionRunner({
  question,
  questionIndex,
  totalQuestions,
  isSubmitting,
  answerResult,
  onSubmit,
  onNext,
}: GrammarSessionRunnerProps) {
  const { t } = useTranslation()
  const [textAnswer, setTextAnswer] = useState("")
  // What was actually submitted for the current question (MCQ option or free-text value) - captured
  // at submit time so it can still be shown once answerResult arrives and the input/options are
  // swapped out for the feedback panel, letting the learner compare their answer against the
  // correct one.
  const [submittedAnswer, setSubmittedAnswer] = useState<string | null>(null)
  const isMultipleChoice = question.options != null
  // The last question's "Next" click calls finishSession instead of just advancing the index -
  // that server call re-grades the whole set and can take a moment, so swap the label/spinner in
  // rather than leaving the button looking idle while the learner waits.
  const isLastQuestion = questionIndex === totalQuestions - 1

  // Clears the typed answer whenever a new question arrives, so a leftover value from the previous
  // question's Input can't be accidentally submitted for this one.
  useEffect(() => {
    setTextAnswer("")
    setSubmittedAnswer(null)
  }, [question.questionRef])

  function handleSubmit(answer: string) {
    setSubmittedAnswer(answer)
    onSubmit(answer)
  }

  const progressPercent = totalQuestions === 0 ? 0 : Math.round((questionIndex / totalQuestions) * 100)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Progress value={progressPercent} />
        <span className="text-xs text-muted-foreground">
          {t("learn.grammar.question", { number: questionIndex + 1 })} / {totalQuestions}
        </span>
      </div>

      <p className="text-sm text-muted-foreground">
        {t(
          isMultipleChoice
            ? "learn.grammar.library.instructionsChoice"
            : "learn.grammar.library.instructionsInput"
        )}
      </p>

      <Card className="relative">
        <LoadingOverlay show={isSubmitting} label={t("common.grading")} />
        <CardContent className="flex flex-col gap-3 py-6">
          {/* Per-type task requirement (what to do with the sentence), always in the app language -
              distinct from the generic "how to submit" line above. Guarantees every question shows a
              requirement even when the AI-generated prompt omits one. */}
          <p className="text-sm font-medium text-primary">
            {t(`learn.grammar.exerciseInstructions.${question.type}`)}
          </p>
          <p className="text-lg font-medium">{question.prompt}</p>

          {/* The answer input/options stay rendered (disabled) even after answering, so the learner
              still sees the box and what they submitted alongside the feedback below - not hidden. */}
          {isMultipleChoice ? (
            <div className="flex flex-col gap-2">
              {question.options?.map((option) => (
                <Button
                  key={option}
                  variant={answerResult && option === submittedAnswer ? "default" : "outline"}
                  className="justify-start"
                  disabled={isSubmitting || answerResult != null}
                  onClick={() => handleSubmit(option)}
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
                handleSubmit(textAnswer)
              }}
            >
              <Input
                autoFocus
                value={textAnswer}
                onChange={(event) => setTextAnswer(event.target.value)}
                placeholder={t("learn.grammar.library.typeAnswer")}
                disabled={isSubmitting || answerResult != null}
              />
              {!answerResult && (
                <Button type="submit" disabled={isSubmitting}>
                  {t("learn.grammar.library.submit")}
                </Button>
              )}
            </form>
          )}

          {/* Feedback + advance button, shown below the (now disabled) input once the answer lands. */}
          {answerResult && (
            <>
              {/* yourAnswer omitted on purpose: the (disabled) input above already shows what the
                  learner submitted, so repeating it here would be redundant. */}
              <LocalAnswerFeedback
                correct={answerResult.correct}
                correctAnswer={answerResult.correctAnswer}
                note={answerResult.explanationVi}
                translationVi={answerResult.translationVi}
              />
              <Button className="self-end" onClick={onNext} loading={isSubmitting}>
                {isSubmitting && isLastQuestion
                  ? t("learn.grammar.library.grading")
                  : t("learn.grammar.library.next")}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
