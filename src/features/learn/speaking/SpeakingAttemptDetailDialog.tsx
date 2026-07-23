import { Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useSpeakingAttemptDetail } from "@/features/learn/speaking/hooks"
import { PronunciationResultPanel } from "@/features/learn/speaking/PronunciationResultPanel"

interface SpeakingAttemptDetailDialogProps {
  userId: string
  attemptId: number | null
  onOpenChange: (open: boolean) => void
}

export function SpeakingAttemptDetailDialog({ userId, attemptId, onOpenChange }: SpeakingAttemptDetailDialogProps) {
  const { data, isLoading } = useSpeakingAttemptDetail(userId, attemptId)

  return (
    <Dialog open={attemptId != null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{data?.topic ?? "Speaking"}</DialogTitle>
        </DialogHeader>

        {isLoading || !data ? (
          <div aria-busy="true" aria-live="polite" className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <PronunciationResultPanel
            overall={data.overallScore}
            words={data.words}
            transcript={data.transcript}
            weakPhonemes={data.weakPhonemes}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
