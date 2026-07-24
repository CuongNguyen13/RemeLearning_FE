import { Wand2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import Markdown from "react-markdown"
import { useNavigate, useParams } from "react-router-dom"
import remarkGfm from "remark-gfm"
import { toast } from "sonner"
import { ErrorState } from "@/components/ErrorState"
import { LoadingOverlay } from "@/components/common/LoadingOverlay"
import { MermaidDiagram } from "@/components/MermaidDiagram"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useGrammarLibraryTopicContent,
  useStartGrammarLibrarySession,
} from "@/features/learn/grammar/library/hooks"
import { ApiError } from "@/lib/http"
import { useAuthStore } from "@/stores/auth-store"

// Renders the LLM-generated theory explanation as markdown so the **bold emphasis** the backend
// prompt now emits (section labels, formulas, key terms, signal words) shows through, instead of
// dumping the raw asterisks as plain text. Sections are blank-line separated, so markdown paragraphs
// reproduce the original spacing; older topics generated before bold was added still render fine.
function TheoryText({ text, muted }: { text: string; muted?: boolean }) {
  return (
    <div
      className={`space-y-2 text-sm leading-relaxed [&_ul]:ml-4 [&_ul]:list-disc ${
        muted ? "text-muted-foreground" : ""
      }`}
    >
      <Markdown remarkPlugins={[remarkGfm]}>{text}</Markdown>
    </div>
  )
}

// The LLM-generated illustration is either a ```mermaid fenced diagram or a plain markdown table
// (see LlmGrammarLibraryContentGenerator on the backend) - detect which and render accordingly
// instead of dumping the raw markdown/mermaid source as text.
function GrammarIllustration({ text }: { text: string }) {
  const mermaidMatch = /```mermaid\s*([\s\S]*?)```/.exec(text)
  if (mermaidMatch) {
    return <MermaidDiagram chart={mermaidMatch[1].trim()} />
  }
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={{
        table: (props) => <table className="w-full border-collapse text-sm" {...props} />,
        th: (props) => <th className="border border-border px-3 py-2 text-left font-medium" {...props} />,
        td: (props) => <td className="border border-border px-3 py-2" {...props} />,
      }}
    >
      {text}
    </Markdown>
  )
}

// Theory page for one grammar topic (/learn/grammar/library/topics/:topicId): explanation (EN/VI),
// the AI-generated illustration, and the topic's sample questions shown read-only (answers included,
// nothing here is scored). "Bắt đầu luyện tập" starts the INITIAL session and hands its payload over
// via router state to GrammarLibrarySessionPage, mirroring the vocabulary Section flow (there's no
// GET-by-sessionId endpoint to refetch it from).
export function GrammarTopicContentPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { topicId: topicIdParam } = useParams<{ topicId: string }>()
  const topicId = topicIdParam ? Number(topicIdParam) : null
  const userId = useAuthStore((state) => state.user?.userId ?? "")

  const { data: content, isLoading, isError } = useGrammarLibraryTopicContent(userId, topicId)
  const startSession = useStartGrammarLibrarySession(userId)

  function handleStart() {
    if (topicId == null) return
    startSession.mutate(topicId, {
      onSuccess: (session) =>
        navigate(`/learn/grammar/library/sessions/${session.sessionId}`, {
          state: { session, topicId },
        }),
      onError: (error) =>
        toast.error(error instanceof ApiError ? error.message : t("learn.grammar.library.startError")),
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (isError || !content) {
    return <ErrorState />
  }

  return (
    <div className="relative flex flex-col gap-6">
      <LoadingOverlay show={startSession.isPending} label={t("common.generating")} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{content.name}</h1>
        <Button variant="ghost" onClick={() => navigate("/learn/grammar")}>
          {t("learn.grammar.library.backToTopics")}
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 py-6">
          <Badge variant="secondary" className="w-fit">{t("learn.grammar.library.theory")}</Badge>
          <TheoryText text={content.explanationEn} />
          <TheoryText text={content.explanationVi} muted />
        </CardContent>
      </Card>

      {content.illustrationText && (
        <Card>
          <CardContent className="flex flex-col gap-2 py-6">
            <Badge variant="secondary" className="w-fit">{t("learn.grammar.library.illustration")}</Badge>
            <GrammarIllustration text={content.illustrationText} />
          </CardContent>
        </Card>
      )}

      {content.examples.length > 0 && (
        <Card>
          <CardContent className="flex flex-col gap-2 py-6">
            <Badge variant="secondary" className="w-fit">{t("learn.grammar.library.examples")}</Badge>
            <ul className="flex flex-col gap-2">
              {content.examples.map((example, index) => (
                <li key={index} className="text-sm">
                  <p>{example.en}</p>
                  <p className="text-muted-foreground">{example.vi}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {content.questions.length > 0 && (
        <Card>
          <CardContent className="flex flex-col gap-3 py-6">
            <Badge variant="secondary" className="w-fit">{t("learn.grammar.library.sampleQuestions")}</Badge>
            {content.questions.map((question) => (
              <div key={question.questionId} className="rounded-lg border border-border/60 p-3 text-sm">
                {/* Per-type task requirement in the app language, matching the practice session. */}
                <p className="font-medium text-primary">
                  {t(`learn.grammar.exerciseInstructions.${question.type}`)}
                </p>
                <p className="font-medium">{question.prompt}</p>
                <p className="text-muted-foreground">
                  {t("learn.grammar.correctAnswerIs", { answer: question.answer })}
                  {question.explanationVi && ` (${question.explanationVi})`}
                </p>
                {question.translationVi && (
                  <p className="text-muted-foreground">
                    {t("learn.grammar.translationIs", { translation: question.translationVi })}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Button size="lg" className="w-fit" onClick={handleStart} loading={startSession.isPending}>
        <Wand2 /> {t("learn.grammar.library.startPractice")}
      </Button>
    </div>
  )
}
