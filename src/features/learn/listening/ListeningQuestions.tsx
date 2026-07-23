import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { LocalAnswerFeedback } from "@/features/learn/shared/LocalAnswerFeedback"
import { scoreListeningAnswer } from "@/features/learn/shared/localScoring"
import type { ListeningPracticeItem } from "@/types/api"

interface ListeningQuestionsProps {
  item: ListeningPracticeItem
  onSubmit: (answers: string[]) => void
  isSubmitting?: boolean
}

// Renders the 3 listening-comprehension question shapes: MCQ (radio group), KEYWORD (short text
// input - the learner types the exact word/phrase they heard), OPEN (free-text textarea). MCQ and
// KEYWORD are graded locally on give for instant feedback (MCQ exact match, KEYWORD via WER); OPEN
// can only be graded by the server/AI on submit. The server always re-grades on the final submit.
export function ListeningQuestions({ item, onSubmit, isSubmitting = false }: ListeningQuestionsProps) {
  const { t } = useTranslation()
  const [answers, setAnswers] = useState<string[]>(() => item.questions.map(() => ""))
  const [revealed, setRevealed] = useState<boolean[]>(() => item.questions.map(() => false))

  function setAnswer(index: number, value: string) {
    setAnswers((prev) => prev.map((answer, i) => (i === index ? value : answer)))
  }

  function reveal(index: number) {
    setRevealed((prev) => prev.map((shown, i) => (i === index ? true : shown)))
  }

  return (
    <div className="flex flex-col gap-4">
      {item.questions.map((question) => (
        <Card key={question.index}>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm font-medium text-muted-foreground">
              {t("learn.listening.question", { number: question.index + 1 })}
            </p>
            {/* Per-type task requirement in the app language, so every question states what to do. */}
            <p className="text-sm font-medium text-primary">
              {t(`learn.listening.exerciseInstructions.${question.type}`)}
            </p>
            <p className="text-base">{question.prompt}</p>

            {question.type === "MCQ" && (
              <RadioGroup
                value={answers[question.index]}
                onValueChange={(value) => {
                  setAnswer(question.index, value ?? "")
                  reveal(question.index)
                }}
                disabled={isSubmitting}
              >
                {(question.options ?? []).map((option) => (
                  <div key={option} className="flex items-center gap-2">
                    <RadioGroupItem id={`listening-answer-${question.index}-${option}`} value={option} />
                    <Label htmlFor={`listening-answer-${question.index}-${option}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {question.type === "KEYWORD" && (
              <Field>
                <FieldLabel htmlFor={`listening-answer-${question.index}`}>
                  {t("learn.listening.keywordAnswer")}
                </FieldLabel>
                <Input
                  id={`listening-answer-${question.index}`}
                  value={answers[question.index]}
                  onChange={(e) => setAnswer(question.index, e.target.value)}
                  onBlur={() => answers[question.index].trim() !== "" && reveal(question.index)}
                  disabled={isSubmitting}
                />
              </Field>
            )}

            {question.type === "OPEN" && (
              <Field>
                <FieldLabel htmlFor={`listening-answer-${question.index}`}>
                  {t("learn.listening.openAnswer")}
                </FieldLabel>
                <Textarea
                  id={`listening-answer-${question.index}`}
                  value={answers[question.index]}
                  onChange={(e) => setAnswer(question.index, e.target.value)}
                  onBlur={() => answers[question.index].trim() !== "" && reveal(question.index)}
                  disabled={isSubmitting}
                  rows={3}
                />
              </Field>
            )}

            {revealed[question.index] && (
              <LocalAnswerFeedback
                correct={scoreListeningAnswer(answers[question.index], question.answer, question.type)}
                correctAnswer={question.answer}
                note={question.explanation}
              />
            )}
          </CardContent>
        </Card>
      ))}

      <Button size="lg" className="h-12 w-full" onClick={() => onSubmit(answers)} loading={isSubmitting}>
        {t("learn.listening.submit")}
      </Button>
    </div>
  )
}
