import mermaid from "mermaid"
import { useEffect, useId, useState } from "react"
import { useTheme } from "next-themes"

interface MermaidDiagramProps {
  chart: string
}

// Renders a mermaid diagram source string as SVG. Re-renders whenever the chart text or the
// resolved light/dark theme changes, since mermaid bakes theme colors into the SVG at render time.
export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "")
  const { resolvedTheme } = useTheme()
  const [svg, setSvg] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    mermaid.initialize({
      startOnLoad: false,
      suppressErrorRendering: true,
      theme: resolvedTheme === "dark" ? "dark" : "default",
    })
    mermaid
      .render(`mermaid-${id}`, chart)
      .then(({ svg: rendered }) => {
        if (!cancelled) setSvg(rendered)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [chart, id, resolvedTheme])

  if (error) {
    return <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-muted p-3 text-sm">{chart}</pre>
  }

  if (!svg) return null

  // eslint-disable-next-line react/no-danger -- svg is generated locally by mermaid, not user HTML
  return <div className="overflow-x-auto" dangerouslySetInnerHTML={{ __html: svg }} />
}
