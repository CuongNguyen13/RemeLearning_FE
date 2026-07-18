import { AlertCircle, CheckCircle2, Loader2, Mic } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { useTranslation } from "react-i18next"
import { EmptyState } from "@/components/EmptyState"
import { ErrorState } from "@/components/ErrorState"
import { RevealGroup, RevealItem } from "@/components/Reveal"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useLearnerOverview } from "@/features/dashboard/hooks"
import { UploadRecordingDialog } from "@/features/recordings/UploadRecordingDialog"
import { formatDateTime } from "@/lib/format"
import { useAuthStore } from "@/stores/auth-store"
import type { Recording } from "@/types/api"

// The pipeline's async stages (recording-service only ever persists `UPLOADED` today, but any
// downstream status the API starts returning later should still land somewhere sensible) collapse
// into three tones the learner actually cares about: still working on it, ready to review, or
// something went wrong. Unrecognized values fall back to showing the raw status text.
type StatusTone = "processing" | "ready" | "failed" | "unknown"

const STATUS_TONE_BY_VALUE: Record<string, StatusTone> = {
  uploaded: "processing",
  pending: "processing",
  queued: "processing",
  processing: "processing",
  transcribing: "processing",
  analyzing: "processing",
  ready: "ready",
  completed: "ready",
  analyzed: "ready",
  done: "ready",
  failed: "failed",
  error: "failed",
}

function getStatusTone(status: string): StatusTone {
  return STATUS_TONE_BY_VALUE[status.toLowerCase()] ?? "unknown"
}

// Renders the recording's pipeline status as a badge, colored/iconed by tone so learners can
// scan a list and immediately tell what's still processing vs ready vs failed.
function RecordingStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation()
  const tone = getStatusTone(status)

  if (tone === "processing") {
    return (
      <Badge variant="secondary">
        <Loader2
          data-icon="inline-start"
          className="motion-safe:animate-spin"
          aria-hidden="true"
        />
        {t("recordings.statusProcessing")}
      </Badge>
    )
  }

  if (tone === "ready") {
    return (
      <Badge>
        <CheckCircle2 data-icon="inline-start" aria-hidden="true" />
        {t("recordings.statusReady")}
      </Badge>
    )
  }

  if (tone === "failed") {
    return (
      <Badge variant="destructive">
        <AlertCircle data-icon="inline-start" aria-hidden="true" />
        {t("recordings.statusFailed")}
      </Badge>
    )
  }

  return <Badge variant="outline">{status}</Badge>
}

// One row in the recordings list: id, status, and upload time. Animates in on arrival, staggered
// by index, with a no-motion fallback for prefers-reduced-motion.
function RecordingRow({ recording, index }: { recording: Recording; index: number }) {
  const { i18n } = useTranslation()
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.li
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.2,
        ease: "easeOut",
        delay: shouldReduceMotion ? 0 : Math.min(index, 8) * 0.04,
      }}
      className="flex min-h-11 flex-col gap-2 rounded-2xl bg-muted/60 p-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <span className="truncate font-mono text-sm text-muted-foreground">
        {recording.recordingId}
      </span>
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <RecordingStatusBadge status={recording.status} />
        <span className="text-sm text-muted-foreground">
          {formatDateTime(recording.createdAt, i18n.language)}
        </span>
      </div>
    </motion.li>
  )
}

export function RecordingsPage() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const { data, isLoading, isError, refetch } = useLearnerOverview(user?.userId ?? "")

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">{t("recordings.title")}</h1>
          <p className="max-w-prose text-sm text-muted-foreground">{t("recordings.subtitle")}</p>
        </div>
        <UploadRecordingDialog />
      </div>

      {isLoading && (
        <Card>
          <CardContent className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full rounded-2xl" />
            ))}
          </CardContent>
        </Card>
      )}
      {isError && <ErrorState onRetry={() => void refetch()} />}

      {data && (
        <RevealGroup>
          <RevealItem>
            <Card className="shadow-clay">
              <CardContent>
                {data.recentRecordings.length === 0 ? (
                  <EmptyState
                    icon={<Mic className="size-6" />}
                    title={t("recordings.emptyTitle")}
                    description={t("recordings.emptyDescription")}
                    action={
                      <UploadRecordingDialog
                        triggerVariant="secondary"
                        triggerLabel={t("recordings.uploadFirst")}
                      />
                    }
                  />
                ) : (
                  <ul className="flex flex-col gap-3" aria-live="polite">
                    {data.recentRecordings.map((recording, index) => (
                      <RecordingRow
                        key={recording.recordingId}
                        recording={recording}
                        index={index}
                      />
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </RevealItem>
        </RevealGroup>
      )}
    </div>
  )
}
