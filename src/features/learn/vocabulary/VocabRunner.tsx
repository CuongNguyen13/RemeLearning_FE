import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { LocalAnswerFeedback } from "@/features/learn/shared/LocalAnswerFeedback"
import { scoreVocabAnswer } from "@/features/learn/shared/localScoring"
import type { VocabPracticeItem } from "@/types/api"

interface VocabRunnerProps {
  item: VocabPracticeItem
  onSubmit: (answers: string[]) => void
  isSubmitting?: boolean
}

// Renders every question of one vocabulary practice set (CLOZE = free-text input, MCQ/MATCHING =
// radio group over the AI-generated options) and collects answers aligned by index, mirroring the
// shape english-service's VocabAttemptScorer expects. Grades each answer locally the moment it's
// given (MCQ on select, CLOZE on blur) for instant feedback; the server still re-grades on submit.
export function VocabRunner({ item, onSubmit, isSubmitting = false }: VocabRunnerProps) {
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
              {t("learn.vocabulary.question", { number: question.index + 1 })}
            </p>
            {/* Per-type task requirement in the app language, so every question states what to do
                even when the AI-generated prompt omits an instruction. */}
            <p className="text-sm font-medium text-primary">
              {t(`learn.vocabulary.exerciseInstructions.${question.type}`)}
            </p>
            <p className="text-base">{question.prompt}</p>

            {question.type === "CLOZE" ? (
              <Field>
                <FieldLabel htmlFor={`vocab-answer-${question.index}`}>
                  {t("learn.vocabulary.yourAnswer")}
                </FieldLabel>
                <Input
                  id={`vocab-answer-${question.index}`}
                  value={answers[question.index]}
                  onChange={(e) => setAnswer(question.index, e.target.value)}
                  onBlur={() => answers[question.index].trim() !== "" && reveal(question.index)}
                  disabled={isSubmitting}
                />
              </Field>
            ) : (
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
                    <RadioGroupItem
                      id={`vocab-answer-${question.index}-${option}`}
                      value={option}
                    />
                    <Label htmlFor={`vocab-answer-${question.index}-${option}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {revealed[question.index] && (
              <LocalAnswerFeedback
                correct={scoreVocabAnswer(answers[question.index], question.answer)}
                correctAnswer={question.answer}
                note={question.translation}
              />
            )}
          </CardContent>
        </Card>
      ))}

      <Button
        size="lg"
        className="h-12 w-full"
        onClick={() => onSubmit(answers)}
        loading={isSubmitting}
      >
        {t("learn.vocabulary.submit")}
      </Button>
    </div>
  )
}
