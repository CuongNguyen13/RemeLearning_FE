import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircle, FileAudio, UploadCloud } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useUploadRecording } from "@/features/recordings/hooks"
import { ApiError } from "@/lib/http"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth-store"

const LANGUAGE_OPTIONS = [
  { code: "en", label: "English" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "fr", label: "Français" },
]

// Mirrors recording-service's `RECORDING_MAX_FILE_SIZE` (application.yml default) so an oversized
// file is rejected in the browser instead of failing after a long upload.
const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024

type UploadForm = { file: FileList; languageCode: string }

interface UploadRecordingDialogProps {
  /** "primary" renders the single warm-accent CTA (default, for the page header). "secondary"
   *  renders a lower-emphasis trigger for a second entry point on the same screen (e.g. the empty
   *  state) so the warm accent still appears on at most one element per screen. */
  triggerVariant?: "primary" | "secondary"
  triggerLabel?: string
}

export function UploadRecordingDialog({
  triggerVariant = "primary",
  triggerLabel,
}: UploadRecordingDialogProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [isDragActive, setIsDragActive] = useState(false)
  const [simulatedProgress, setSimulatedProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const userId = useAuthStore((state) => state.user?.userId ?? "")
  const mutation = useUploadRecording(userId)

  const uploadSchema = z.object({
    file: z
      .custom<FileList>((value) => value instanceof FileList && value.length > 0, {
        message: t("recordings.fileRequired"),
      })
      .refine((value) => value[0].size <= MAX_FILE_SIZE_BYTES, {
        message: t("recordings.fileTooLarge"),
      })
      .refine(
        (value) => {
          const type = value[0].type
          return type === "" || /^(audio|video)\//.test(type)
        },
        { message: t("recordings.fileInvalidType") }
      ),
    languageCode: z.string(),
  })

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UploadForm>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { languageCode: "en" },
  })

  const selectedFile = watch("file")?.[0]
  const fileFieldRegister = register("file")

  // The API client doesn't report real upload progress today, so this simulates a bar that
  // steadily approaches (but never quite reaches) full while the request is in flight - enough
  // to reassure the learner the upload is moving, not stalled, without claiming a false byte count.
  useEffect(() => {
    if (!mutation.isPending) {
      return
    }
    setSimulatedProgress(10)
    const interval = setInterval(() => {
      setSimulatedProgress((prev) => (prev >= 92 ? prev : prev + (92 - prev) * 0.15))
    }, 300)
    return () => clearInterval(interval)
  }, [mutation.isPending])

  // Ignores close attempts (Escape, backdrop, the header close button) while an upload is in
  // flight so the learner can't lose their place mid-request; otherwise resets the form/mutation
  // state so the dialog opens clean next time.
  function handleDialogOpenChange(next: boolean) {
    if (mutation.isPending) {
      return
    }
    setOpen(next)
    if (!next) {
      reset({ languageCode: "en" })
      mutation.reset()
    }
  }

  // Lets a file be dropped directly onto the dropzone, not just picked via the native file input.
  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragActive(false)
    if (mutation.isPending) {
      return
    }
    const files = event.dataTransfer.files
    if (files.length > 0) {
      if (fileInputRef.current) {
        fileInputRef.current.files = files
      }
      setValue("file", files, { shouldValidate: true, shouldDirty: true })
    }
  }

  function onSubmit(values: UploadForm) {
    mutation.mutate(
      { file: values.file[0], userId, languageCode: values.languageCode },
      {
        onSuccess: () => {
          toast.success(t("recordings.uploadSuccess"))
          reset({ languageCode: "en" })
          setOpen(false)
        },
        onError: (error) => {
          toast.error(error instanceof ApiError ? error.message : t("recordings.uploadError"))
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant={triggerVariant === "secondary" ? "secondary" : "default"}
            className={
              triggerVariant === "primary"
                ? "bg-accent-warm text-accent-warm-foreground shadow-clay-warm hover:bg-accent-warm/90"
                : undefined
            }
          />
        }
      >
        {triggerLabel ?? t("recordings.uploadNew")}
      </DialogTrigger>
      <DialogContent showCloseButton={!mutation.isPending}>
        <DialogHeader>
          <DialogTitle>{t("recordings.uploadDialogTitle")}</DialogTitle>
          <DialogDescription>{t("recordings.uploadDialogDescription")}</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field data-invalid={!!errors.file}>
              <FieldLabel htmlFor="file">{t("recordings.file")}</FieldLabel>
              <div
                className={cn(
                  "relative flex flex-col items-center gap-1.5 rounded-lg border-2 border-dashed p-5 text-center transition-colors has-[:focus-visible]:border-ring has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                  isDragActive ? "border-primary bg-primary/5" : "border-input",
                  errors.file && "border-destructive/60",
                  mutation.isPending && "pointer-events-none opacity-60"
                )}
                onDragOver={(event) => {
                  event.preventDefault()
                  if (!mutation.isPending) {
                    setIsDragActive(true)
                  }
                }}
                onDragLeave={() => setIsDragActive(false)}
                onDrop={handleDrop}
              >
                <input
                  id="file"
                  type="file"
                  accept="audio/*,video/*"
                  aria-invalid={!!errors.file}
                  disabled={mutation.isPending}
                  className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                  {...fileFieldRegister}
                  ref={(element) => {
                    fileFieldRegister.ref(element)
                    fileInputRef.current = element
                  }}
                />
                <UploadCloud className="size-6 text-muted-foreground" aria-hidden="true" />
                {selectedFile ? (
                  <p className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-foreground">
                    <FileAudio className="size-4 shrink-0" aria-hidden="true" />
                    <span className="max-w-64 truncate">{selectedFile.name}</span>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">{t("recordings.dropzoneLabel")}</p>
                )}
                <p className="text-xs text-muted-foreground">{t("recordings.dropzoneHint")}</p>
              </div>
              <FieldError errors={[errors.file]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="languageCode">{t("recordings.languageCode")}</FieldLabel>
              <Controller
                name="languageCode"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={mutation.isPending}
                  >
                    <SelectTrigger id="languageCode" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGE_OPTIONS.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </FieldGroup>

          {mutation.isPending && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">{t("recordings.uploading")}</span>
              <Progress value={simulatedProgress} />
            </div>
          )}

          {mutation.isError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                {mutation.error instanceof ApiError
                  ? mutation.error.message
                  : t("recordings.uploadError")}
              </span>
            </div>
          )}

          {/* Persistent (not conditionally mounted) live region so screen readers reliably
              announce the transition into/out of the uploading state. */}
          <p aria-live="polite" className="sr-only">
            {mutation.isPending ? t("recordings.uploading") : ""}
          </p>

          <DialogFooter>
            <DialogClose
              render={<Button type="button" variant="outline" disabled={mutation.isPending} />}
            >
              {t("common.cancel")}
            </DialogClose>
            <Button type="submit" loading={mutation.isPending}>
              {t("common.upload")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
