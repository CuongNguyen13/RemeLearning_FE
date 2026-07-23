import { Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useListeningAttemptDetail } from "@/features/learn/listening/hooks"
import { ListeningResultPanel } from "@/features/learn/listening/ListeningResultPanel"

interface ListeningAttemptDetailDialogProps {
  userId: string
  attemptId: number | null
  onOpenChange: (open: boolean) => void
}

// Read-only replay of one past listening-practice attempt, reusing ListeningResultPanel (no
// onRetry) so a history row looks exactly like the result screen the learner saw right after submitting.
export function ListeningAttemptDetailDialog({ userId, attemptId, onOpenChange }: ListeningAttemptDetailDialogProps) {
  const { data, isLoading } = useListeningAttemptDetail(userId, attemptId)

  return (
    <Dialog open={attemptId != null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{data?.topic ?? "Listening"}</DialogTitle>
        </DialogHeader>

        {isLoading || !data ? (
          <div aria-busy="true" aria-live="polite" className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ListeningResultPanel
            accuracy={data.accuracy}
            results={data.results}
            transcript={data.transcript}
            translation={data.translation}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
