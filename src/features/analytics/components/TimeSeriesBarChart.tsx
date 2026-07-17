import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  formatChartInteger,
  formatChartPercent,
  seriesToChartData,
  type ChartDataPoint,
} from '@/features/analytics/chartPresentation'
import { ChartPanel } from '@/features/analytics/components/ChartPanel'
import {
  CHART_THEME,
  type ChartColorKey,
} from '@/features/analytics/components/chartTheme'
import type { ChartSeries } from '@/features/analytics/analyticsSeries'

interface TimeSeriesBarChartProps {
  title: string
  series: ChartSeries
  color?: ChartColorKey
  valueMode?: 'integer' | 'percent'
}

function ChartTooltip({
  active,
  payload,
  valueMode,
}: {
  active?: boolean
  payload?: { payload: ChartDataPoint }[]
  valueMode: 'integer' | 'percent'
}) {
  if (!active || !payload?.[0]) return null
  const row = payload[0].payload
  const displayValue =
    valueMode === 'percent'
      ? formatChartPercent(row.value)
      : formatChartInteger(row.value)

  return (
    <div
      className="rounded-md border px-2.5 py-1.5 text-xs shadow-lg"
      style={{
        backgroundColor: CHART_THEME.tooltipBg,
        borderColor: CHART_THEME.tooltipBorder,
        color: CHART_THEME.tooltipText,
      }}
    >
      <p className="text-stone-400">{row.dateLabel}</p>
      <p className="font-semibold">{displayValue}</p>
    </div>
  )
}

/** Responsive bar chart — consumes ChartSeries only. */
export function TimeSeriesBarChart({
  title,
  series,
  color = 'sky',
  valueMode = 'integer',
}: TimeSeriesBarChartProps) {
  const data = seriesToChartData(series)
  const fill = CHART_THEME.colors[color]

  return (
    <ChartPanel title={title} seriesLabel={series.label} pointCount={data.length}>
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid stroke={CHART_THEME.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="dateLabel"
              tick={{ fill: CHART_THEME.axis, fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: CHART_THEME.grid }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: CHART_THEME.axis, fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={36}
            />
            <Tooltip
              content={({ active, payload }) => {
                const row = payload?.[0]?.payload as ChartDataPoint | undefined
                if (!active || !row) return null
                return (
                  <ChartTooltip active payload={[{ payload: row }]} valueMode={valueMode} />
                )
              }}
            />
            <Bar dataKey="value" fill={fill} radius={[3, 3, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartPanel>
  )
}
