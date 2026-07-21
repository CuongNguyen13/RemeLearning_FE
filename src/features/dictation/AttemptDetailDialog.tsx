// File: src/features/dictation/AttemptDetailDialog.tsx
import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AiAnalysisPanel } from "@/features/dictation/AiAnalysisPanel"
import { useDictationAttemptDetail } from "@/features/dictation/hooks"

interface AttemptDetailDialogProps {
  userId: string
  attemptId: number | null
  onOpenChange: (open: boolean) => void
}

// Shows the full detail of one past dictation attempt: reference text, the learner's transcript,
// the specific words they got wrong, and the AI suggestions generated at the time. Fetched lazily
// (enabled only while attemptId is set) rather than prefetched for every History row.
export function AttemptDetailDialog({ userId, attemptId, onOpenChange }: AttemptDetailDialogProps) {
  const { t } = useTranslation()
  const { data, isLoading } = useDictationAttemptDetail(userId, attemptId)

  return (
    <Dialog open={attemptId != null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{data?.title ?? t("dictation.aiBadge")}</DialogTitle>
        </DialogHeader>

        {isLoading || !data ? (
          <div aria-busy="true" aria-live="polite" className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {t("dictation.accuracy", { accuracy: Math.round(data.accuracy * 100) })}
              </Badge>
              {[data.examType, data.level, data.skill]
                .filter((value): value is string => !!value)
                .map((meta) => (
                  <Badge key={meta} variant="outline">
                    {meta}
                  </Badge>
                ))}
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                {t("dictation.historyDetail.referenceText")}
              </span>
              <p className="rounded-2xl bg-muted/40 p-4 text-sm leading-relaxed">{data.referenceText}</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                {t("dictation.historyDetail.yourTranscript")}
              </span>
              <p className="rounded-2xl bg-muted/40 p-4 text-sm leading-relaxed">{data.userTranscript}</p>
            </div>

            {data.mistakes.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  {t("dictation.historyDetail.mistakes")}
                </span>
                <div className="flex flex-wrap gap-2">
                  {data.mistakes.map((mistake, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-destructive/10 px-3 py-1 text-xs text-destructive"
                    >
                      {mistake.expectedWord}
                      {mistake.actualWord ? ` → ${mistake.actualWord}` : ""}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <AiAnalysisPanel
              errorTable={data.errorTable}
              rootCauses={data.rootCauses}
              actionAdvice={data.actionAdvice}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
