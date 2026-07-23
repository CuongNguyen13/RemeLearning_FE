import { Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useVocabAttemptDetail } from "@/features/learn/vocabulary/hooks"
import { VocabResultPanel } from "@/features/learn/vocabulary/VocabResultPanel"

interface VocabAttemptDetailDialogProps {
  userId: string
  attemptId: number | null
  onOpenChange: (open: boolean) => void
}

// Read-only replay of one past vocabulary-practice attempt, reusing VocabResultPanel (no onRetry)
// so a history row looks exactly like the result screen the learner saw right after submitting.
export function VocabAttemptDetailDialog({ userId, attemptId, onOpenChange }: VocabAttemptDetailDialogProps) {
  const { data, isLoading } = useVocabAttemptDetail(userId, attemptId)

  return (
    <Dialog open={attemptId != null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{data?.topic ?? "Vocabulary"}</DialogTitle>
        </DialogHeader>

        {isLoading || !data ? (
          <div aria-busy="true" aria-live="polite" className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <VocabResultPanel accuracy={data.accuracy} results={data.results} />
        )}
      </DialogContent>
    </Dialog>
  )
}
