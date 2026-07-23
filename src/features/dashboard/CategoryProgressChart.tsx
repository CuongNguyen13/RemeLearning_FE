import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { EmptyState } from "@/components/EmptyState"
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getCategoryLearnRoute } from "@/features/weak-points/card-visuals"
import type { Category, CategoryProgress } from "@/types/api"

// Fixed left-to-right order so category position never shifts between renders. "listening" is
// included even though no english-service domain table backs it yet (see the V14 migration note
// in ListeningLearnServiceImpl) - dashboard-service's own consumer is category-agnostic, so a
// listening weak point still produces a CategoryProgress row once one has ever been graded.
const CATEGORY_ORDER: Category[] = ["vocabulary", "grammar", "pronunciation", "listening"]

interface ChartDatum {
  label: string
  value: number
}

interface MiniBarChartProps {
  title: string
  data: ChartDatum[]
  unit: string
  /** Called with the clicked bar's index into `data` - lets the caller deep-link to that
   * category's practice route without this component knowing about routing. */
  onBarClick?: (index: number) => void
}

// Single-series bar chart: one hue (the validated chart-1 blue) since there's only one metric
// per chart and categories are already identified by their x-axis label, not by color.
function MiniBarChart({ title, data, unit, onBarClick }: MiniBarChartProps) {
  const { t } = useTranslation()
  const hasData = data.some((d) => d.value > 0)
  // Plain-text equivalent of the chart's data, read by screen readers instead of the SVG -
  // the chart itself is marked aria-hidden below so the two aren't both announced.
  const accessibleSummary = data.map((d) => `${d.label}: ${d.value}${unit}`).join(", ")

  if (!hasData) {
    return (
      <div>
        <p className="mb-2 text-sm font-medium text-muted-foreground">{title}</p>
        <EmptyState title={t("common.noData")} />
      </div>
    )
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-muted-foreground">{title}</p>
      <div aria-hidden="true">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart
            data={data}
            margin={{ top: 20, right: 8, left: 8, bottom: 0 }}
            accessibilityLayer
          >
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <YAxis hide domain={[0, (max: number) => Math.ceil(max * 1.25) || 1]} />
            <Tooltip
              cursor={{ fill: "var(--muted)" }}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                color: "var(--popover-foreground)",
                fontSize: 12,
              }}
              formatter={(value) => [`${Number(value)}${unit}`, ""]}
              labelStyle={{ color: "var(--foreground)", fontWeight: 500 }}
            />
            <Bar
              dataKey="value"
              fill="var(--chart-1)"
              radius={[8, 8, 0, 0]}
              maxBarSize={36}
              className={onBarClick ? "cursor-pointer" : undefined}
              onClick={(_, index) => onBarClick?.(index)}
            >
              <LabelList
                dataKey="value"
                position="top"
                formatter={(value) => `${Number(value)}${unit}`}
                style={{ fill: "var(--foreground)", fontSize: 12, fontWeight: 500 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="sr-only">{`${title}: ${accessibleSummary}`}</p>
    </div>
  )
}

interface CategoryProgressChartProps {
  data: CategoryProgress[]
}

export function CategoryProgressChart({ data }: CategoryProgressChartProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const byCategory = new Map(data.map((entry) => [entry.category, entry]))

  const countData: ChartDatum[] = CATEGORY_ORDER.map((category) => ({
    label: t(`categories.${category}`),
    value: byCategory.get(category)?.weakPointCount ?? 0,
  }))

  const scoreData: ChartDatum[] = CATEGORY_ORDER.map((category) => ({
    label: t(`categories.${category}`),
    value: Math.round((byCategory.get(category)?.avgForgettingScore ?? 0) * 100),
  }))

  // A bar's index always lines up with CATEGORY_ORDER (both charts are built from it above),
  // so the click just resolves that category's practice route and navigates there.
  function goToCategory(index: number) {
    const category = CATEGORY_ORDER[index]
    if (category) navigate(getCategoryLearnRoute(category))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.categoryProgress")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-2">
        <MiniBarChart
          title={t("dashboard.weakPointsChart")}
          data={countData}
          unit=""
          onBarClick={goToCategory}
        />
        <MiniBarChart
          title={t("dashboard.avgForgettingScore")}
          data={scoreData}
          unit="%"
          onBarClick={goToCategory}
        />
      </CardContent>
    </Card>
  )
}
