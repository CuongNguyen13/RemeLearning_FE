import { Check, RotateCcw } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { EASE_OUT } from "@/lib/motion"
import { cn } from "@/lib/utils"

interface AttemptResultShellProps {
  /** 0..1 score for the attempt just graded, shown as a gauge - the same shape as
   * DictationAttemptResult.accuracy. */
  score: number
  /** Skill-specific analysis/content (diff view, mistake table, exercises, ...) nested below
   * the gauge - this shell has no opinion on what that looks like. */
  children?: ReactNode
  /** Shown as a "Practice more" action when provided; omitted entirely otherwise. */
  onRetry?: () => void
}

// Shared "attempt result" shell for the 4 learning skills, mirroring dictation's
// AttemptResultPanel (verdict header + accuracy gauge) so a graded attempt looks the same
// regardless of which skill produced it. Each skill nests its own domain-specific analysis
// via `children` instead of this component owning any skill-specific fields.
export function AttemptResultShell({ score, children, onRetry }: AttemptResultShellProps) {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const isStrongMatch = score >= 0.8
  const percent = Math.round(score * 100)

  return (
    <motion.div
      className="flex w-full max-w-2xl flex-col gap-5 rounded-2xl bg-card p-6 shadow-clay"
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.25, ease: EASE_OUT }}
    >
      {/* Result header: verdict icon + accuracy gauge. */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              isStrongMatch ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            )}
          >
            {isStrongMatch ? <Check className="size-5" /> : <RotateCcw className="size-5" />}
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="font-heading text-lg font-semibold">
              {isStrongMatch ? t("learn.result.feedbackGreat") : t("learn.result.feedbackRetry")}
            </p>
            <p className="text-sm text-muted-foreground">{t("learn.result.score", { percent })}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Progress
            value={percent}
            className={cn(
              "h-2 flex-1",
              isStrongMatch && "[&>div]:bg-primary",
              !isStrongMatch && percent >= 50 && "[&>div]:bg-amber-500",
              !isStrongMatch && percent < 50 && "[&>div]:bg-destructive/60"
            )}
            aria-label={t("learn.result.score", { percent })}
          />
          <span
            className={cn(
              "min-w-[3.5ch] text-sm font-bold tabular-nums",
              isStrongMatch && "text-primary",
              !isStrongMatch && percent >= 50 && "text-amber-600 dark:text-amber-400",
              !isStrongMatch && percent < 50 && "text-destructive"
            )}
          >
            {percent}%
          </span>
        </div>
      </div>

      {children && (
        <>
          <Separator />
          {children}
        </>
      )}

      {onRetry && (
        <Button size="lg" className="h-12 w-full gap-2" onClick={onRetry}>
          <RotateCcw className="size-4.5" />
          {t("learn.result.retry")}
        </Button>
      )}
    </motion.div>
  )
}
