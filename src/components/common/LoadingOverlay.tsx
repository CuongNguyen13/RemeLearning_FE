import { Loader2 } from "lucide-react"

interface LoadingOverlayProps {
  show: boolean
  label?: string
}

// Blocking overlay for an in-progress AI action (grading, generating).
// Must be rendered inside a `relative`-positioned parent — it covers only
// that parent, not the whole page, and swallows clicks via pointer-events.
export function LoadingOverlay({ show, label }: LoadingOverlayProps) {
  if (!show) return null

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-2 rounded-md bg-background/70 backdrop-blur-sm pointer-events-auto"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{label ?? "Đang xử lý..."}</p>
    </div>
  )
}
