import { Wand2 } from "lucide-react"
import { useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDictationFacets, useGenerateAiPractice } from "@/features/dictation/hooks"
import { ApiError } from "@/lib/http"

const LEVELS = ["A1", "A2", "B1", "B2", "C1"]
const RANDOM = "RANDOM"
const NONE = "NONE"

interface GenerateAiPracticeDialogProps {
  userId: string
  trigger: ReactNode
}

// Dialog shown before generating a new AI-practice passage: lets the learner optionally pick a CEFR
// level and/or exam type to frame it around, each independently defaulting to "no preference" or
// randomizable via its own "Random" option (resolved server-side, not here) - see
// GenerateAiPracticeRequest. Replaces the old one-click "Tạo bài luyện" button that always generated
// with no facets at all.
export function GenerateAiPracticeDialog({ userId, trigger }: GenerateAiPracticeDialogProps) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const [level, setLevel] = useState(NONE)
  const [examType, setExamType] = useState(NONE)
  const { data: facets } = useDictationFacets(userId)
  const generate = useGenerateAiPractice(userId)

  function handleOpenChange(next: boolean) {
    if (generate.isPending) return
    setOpen(next)
  }

  function handleSubmit() {
    generate.mutate(
      {
        level: level === NONE ? undefined : level,
        examType: examType === NONE ? undefined : examType,
        translationLang: i18n.resolvedLanguage,
      },
      {
        onSuccess: () => setOpen(false),
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : t("dictation.aiError")),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<span />}>{trigger}</DialogTrigger>
      <DialogContent showCloseButton={!generate.isPending}>
        <DialogHeader>
          <DialogTitle>{t("dictation.aiGenerateDialog.title")}</DialogTitle>
        </DialogHeader>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="ai-practice-level">{t("dictation.aiGenerateDialog.levelLabel")}</FieldLabel>
            <Select
              value={level}
              onValueChange={(value) => setLevel(value ?? NONE)}
              disabled={generate.isPending}
            >
              <SelectTrigger id="ai-practice-level" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>{t("dictation.aiGenerateDialog.noPreference")}</SelectItem>
                <SelectItem value={RANDOM}>{t("dictation.aiGenerateDialog.random")}</SelectItem>
                {LEVELS.map((lvl) => (
                  <SelectItem key={lvl} value={lvl}>
                    {lvl}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="ai-practice-exam-type">{t("dictation.aiGenerateDialog.examTypeLabel")}</FieldLabel>
            <Select
              value={examType}
              onValueChange={(value) => setExamType(value ?? NONE)}
              disabled={generate.isPending}
            >
              <SelectTrigger id="ai-practice-exam-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>{t("dictation.aiGenerateDialog.noPreference")}</SelectItem>
                <SelectItem value={RANDOM}>{t("dictation.aiGenerateDialog.random")}</SelectItem>
                {(facets?.examTypes ?? []).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>

        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" disabled={generate.isPending} />}>
            {t("common.cancel")}
          </DialogClose>
          <Button onClick={handleSubmit} loading={generate.isPending}>
            <Wand2 /> {t("dictation.aiGenerateDialog.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
