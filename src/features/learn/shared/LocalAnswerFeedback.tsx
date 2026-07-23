import { Check, Clock, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"

interface LocalAnswerFeedbackProps {
  // null = cannot be graded locally (e.g. listening OPEN) - shown as a "graded on submit" hint.
  correct: boolean | null
  correctAnswer: string | null
  // Extra note shown under the correct answer: a short explanation of the rule/reasoning (grammar/
  // listening) - distinct from translationVi below, which is a literal sentence translation.
  note?: string | null
  // Plain Vietnamese translation of correctAnswer's meaning (e.g. grammar's translationVi field) -
  // shown as its own "Dịch:" line, separate from note (a rule explanation, not a translation).
  translationVi?: string | null
  // What the learner actually typed/selected. Only needed by callers that swap their input/options
  // out of view once feedback is shown (e.g. GrammarSessionRunner) - callers that keep the
  // input/options visible alongside this feedback can omit it.
  yourAnswer?: string | null
}

// Inline per-question feedback shown the moment a learner answers, mirroring the final result panel
// but computed locally for instant response. Never rendered for un-answered questions.
export function LocalAnswerFeedback({ correct, correctAnswer, note, translationVi, yourAnswer }: LocalAnswerFeedbackProps) {
  const { t } = useTranslation()

  // OPEN-style question that only the server/AI can grade.
  if (correct === null) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-muted/40 p-3 text-sm text-muted-foreground">
        <Clock className="mt-0.5 size-4 shrink-0" />
        <p>{t("learn.feedback.gradedOnSubmit")}</p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-xl border p-3 text-sm",
        correct ? "border-primary/20 bg-primary/5" : "border-destructive/20 bg-destructive/5"
      )}
    >
      <div className="flex items-center gap-2 font-medium">
        {correct ? (
          <>
            <Check className="size-4 shrink-0 text-primary" />
            <span className="text-primary">{t("learn.feedback.correct")}</span>
          </>
        ) : (
          <>
            <X className="size-4 shrink-0 text-destructive" />
            <span className="text-destructive">{t("learn.feedback.incorrect")}</span>
          </>
        )}
      </div>
      {yourAnswer !== undefined && (
        <p className="pl-6 text-muted-foreground">
          {t("learn.feedback.yourAnswerWas", {
            answer: yourAnswer || t("learn.feedback.noAnswer"),
          })}
        </p>
      )}
      {correctAnswer && (
        <p className="pl-6 text-foreground">
          {t("learn.feedback.correctAnswerIs", { answer: correctAnswer })}
        </p>
      )}
      {translationVi && (
        <p className="pl-6 text-muted-foreground">
          {t("learn.feedback.translationIs", { translation: translationVi })}
        </p>
      )}
      {note && <p className="pl-6 text-muted-foreground">{note}</p>}
    </div>
  )
}
