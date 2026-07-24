import { Wand2 } from "lucide-react"
import { useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { LoadingOverlay } from "@/components/common/LoadingOverlay"
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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const LEVELS = ["A1", "A2", "B1", "B2", "C1"]
const RANDOM = "RANDOM"
const NONE = "NONE"

export interface GenerateDialogParams {
  level?: string
  examType?: string
}

interface GenerateDialogProps {
  trigger: ReactNode
  /** Called with the collected level/examType once the learner submits. This component never
   * calls an API itself - each skill (vocabulary/grammar/listening/speaking) wires its own
   * mutation and passes the result back in here, per its own backend contract. */
  onGenerate: (params: GenerateDialogParams) => void
  /** Disables inputs and shows a loading state on the submit button while the caller's own
   * mutation is in flight. */
  isGenerating?: boolean
}

// Shared "generate AI practice" dialog for the 4 learning skills - copies
// dictation/GenerateAiPracticeDialog's level picker UI (CEFR A1-C1 + "no preference"/"random"),
// but stays API-agnostic and uses a free-text exam-type field since each skill's set of valid
// exam types isn't known here (no facets endpoint to read from at this generic layer).
export function GenerateDialog({ trigger, onGenerate, isGenerating = false }: GenerateDialogProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [level, setLevel] = useState(NONE)
  const [examType, setExamType] = useState("")

  function handleOpenChange(next: boolean) {
    if (isGenerating) return
    setOpen(next)
  }

  function handleSubmit() {
    onGenerate({
      level: level === NONE ? undefined : level,
      examType: examType.trim() === "" ? undefined : examType.trim(),
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<span />}>{trigger}</DialogTrigger>
      <DialogContent showCloseButton={!isGenerating}>
        <DialogHeader>
          <DialogTitle>{t("learn.generateDialog.title")}</DialogTitle>
        </DialogHeader>

        <FieldGroup className="relative">
          <LoadingOverlay show={isGenerating} label={t("common.generating")} />
          <Field>
            <FieldLabel htmlFor="generate-dialog-level">{t("learn.generateDialog.levelLabel")}</FieldLabel>
            <Select
              value={level}
              onValueChange={(value) => setLevel(value ?? NONE)}
              disabled={isGenerating}
            >
              <SelectTrigger id="generate-dialog-level" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>{t("learn.generateDialog.noPreference")}</SelectItem>
                <SelectItem value={RANDOM}>{t("learn.generateDialog.random")}</SelectItem>
                {LEVELS.map((lvl) => (
                  <SelectItem key={lvl} value={lvl}>
                    {lvl}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="generate-dialog-exam-type">
              {t("learn.generateDialog.examTypeLabel")}
            </FieldLabel>
            <Input
              id="generate-dialog-exam-type"
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              placeholder={t("learn.generateDialog.examTypePlaceholder")}
              disabled={isGenerating}
            />
          </Field>
        </FieldGroup>

        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" disabled={isGenerating} />}>
            {t("common.cancel")}
          </DialogClose>
          <Button onClick={handleSubmit} loading={isGenerating}>
            <Wand2 /> {t("learn.generateDialog.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
