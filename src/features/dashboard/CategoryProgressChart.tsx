import { useTranslation } from "react-i18next"
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
import type { Category, CategoryProgress } from "@/types/api"

// Fixed left-to-right order so category position never shifts between renders.
const CATEGORY_ORDER: Category[] = ["vocabulary", "grammar", "pronunciation"]

interface ChartDatum {
  label: string
  value: number
}

interface MiniBarChartProps {
  title: string
  data: ChartDatum[]
  unit: string
}

// Single-series bar chart: one hue (the validated chart-1 blue) since there's only one metric
// per chart and categories are already identified by their x-axis label, not by color.
function MiniBarChart({ title, data, unit }: MiniBarChartProps) {
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
            <Bar dataKey="value" fill="var(--chart-1)" radius={[8, 8, 0, 0]} maxBarSize={36}>
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
  const byCategory = new Map(data.map((entry) => [entry.category, entry]))

  const countData: ChartDatum[] = CATEGORY_ORDER.map((category) => ({
    label: t(`categories.${category}`),
    value: byCategory.get(category)?.weakPointCount ?? 0,
  }))

  const scoreData: ChartDatum[] = CATEGORY_ORDER.map((category) => ({
    label: t(`categories.${category}`),
    value: Math.round((byCategory.get(category)?.avgForgettingScore ?? 0) * 100),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.categoryProgress")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-2">
        <MiniBarChart title={t("dashboard.weakPointsChart")} data={countData} unit="" />
        <MiniBarChart title={t("dashboard.avgForgettingScore")} data={scoreData} unit="%" />
      </CardContent>
    </Card>
  )
}
