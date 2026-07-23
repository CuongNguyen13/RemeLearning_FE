import { Mic, RotateCcw, Square } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

interface SpeakingRecorderProps {
  onRecorded: (audio: Blob) => void
  disabled?: boolean
}

type RecorderState = "idle" | "recording" | "recorded"

// Records the learner's spoken attempt via the browser's native MediaRecorder API (no external
// dependency needed - every evergreen browser supports it) and previews it before submitting.
export function SpeakingRecorder({ onRecorded, disabled = false }: SpeakingRecorderProps) {
  const { t } = useTranslation()
  const [state, setState] = useState<RecorderState>("idle")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        setPreviewUrl(URL.createObjectURL(blob))
        setState("recorded")
        onRecorded(blob)
        stream.getTracks().forEach((track) => track.stop())
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      setState("recording")
    } catch {
      toast.error(t("learn.speaking.micError"))
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
  }

  function reRecord() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setState("idle")
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/60 bg-card p-6">
      {state === "idle" && (
        <Button size="lg" className="h-14 gap-2 rounded-full px-8" onClick={startRecording} disabled={disabled}>
          <Mic className="size-5" /> {t("learn.speaking.startRecording")}
        </Button>
      )}

      {state === "recording" && (
        <Button
          size="lg"
          variant="destructive"
          className="h-14 gap-2 rounded-full px-8"
          onClick={stopRecording}
        >
          <Square className="size-5" /> {t("learn.speaking.stopRecording")}
        </Button>
      )}

      {state === "recorded" && previewUrl && (
        <div className="flex w-full flex-col items-center gap-3">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption -- learner's own recording, no captions source exists */}
          <audio controls className="w-full" src={previewUrl} />
          <Button variant="outline" size="sm" className="gap-1.5" onClick={reRecord} disabled={disabled}>
            <RotateCcw className="size-4" /> {t("learn.speaking.reRecord")}
          </Button>
        </div>
      )}
    </div>
  )
}
