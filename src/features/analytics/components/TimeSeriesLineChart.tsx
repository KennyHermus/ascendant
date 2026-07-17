import {
  formatChartInteger,
  formatChartPercent,
  formatChartTimeOfDay,
  seriesToChartData,
  type ChartDataPoint,
} from '@/features/analytics/chartPresentation'
import { ChartPanel } from '@/features/analytics/components/ChartPanel'
import {
  CHART_THEME,
  type ChartColorKey,
} from '@/features/analytics/components/chartTheme'
import type { ChartSeries } from '@/features/analytics/analyticsSeries'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface TimeSeriesLineChartProps {
  title: string
  series: ChartSeries
  color?: ChartColorKey
  /** `percent`: series values in [0, 1]. `timeOfDay`: minutes from local midnight. */
  valueMode?: 'integer' | 'percent' | 'timeOfDay'
  yDomain?: [number, number]
  onDaySelect?: (date: string) => void
}

function ChartTooltip({
  active,
  payload,
  valueMode,
}: {
  active?: boolean
  payload?: { payload: ChartDataPoint }[]
  valueMode: 'integer' | 'percent' | 'timeOfDay'
}) {
  if (!active || !payload?.[0]) return null
  const row = payload[0].payload
  let displayValue: string
  if (valueMode === 'percent') {
    displayValue = formatChartPercent(row.value)
  } else if (valueMode === 'timeOfDay') {
    displayValue = formatChartTimeOfDay(row.value)
  } else {
    displayValue = formatChartInteger(row.value)
  }

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

/** Responsive line chart — consumes ChartSeries only. */
export function TimeSeriesLineChart({
  title,
  series,
  color = 'amber',
  valueMode = 'integer',
  yDomain,
  onDaySelect,
}: TimeSeriesLineChartProps) {
  const rawData = seriesToChartData(series)
  const data =
    valueMode === 'percent'
      ? rawData.map((row) => ({ ...row, value: row.value * 100 }))
      : rawData

  const stroke = CHART_THEME.colors[color]
  const resolvedYDomain =
    yDomain ??
    (valueMode === 'timeOfDay' ? ([0, 24 * 60] as [number, number]) : undefined)

  return (
    <ChartPanel title={title} seriesLabel={series.label} pointCount={rawData.length}>
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 4, right: 8, left: 4, bottom: 0 }}
          >
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
              domain={resolvedYDomain ?? ['auto', 'auto']}
              tickFormatter={(v) => {
                if (valueMode === 'percent') return `${Math.round(Number(v))}%`
                if (valueMode === 'timeOfDay') return formatChartTimeOfDay(Number(v))
                return formatChartInteger(Number(v))
              }}
              width={44}
            />
            <Tooltip
              content={({ active, payload }) => {
                const row = payload?.[0]?.payload as ChartDataPoint | undefined
                if (!active || !row) return null
                const tooltipValue =
                  valueMode === 'percent'
                    ? { ...row, value: row.value / 100 }
                    : row
                return (
                  <ChartTooltip
                    active
                    payload={[{ payload: tooltipValue }]}
                    valueMode={valueMode}
                  />
                )
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={stroke}
              strokeWidth={2}
              dot={{ r: 2, fill: stroke, cursor: onDaySelect ? 'pointer' : undefined }}
              activeDot={{ r: 4, cursor: onDaySelect ? 'pointer' : undefined }}
              isAnimationActive={false}
              onClick={(entry: unknown) => {
                const row = (entry as { payload?: ChartDataPoint }).payload
                if (row?.date) onDaySelect?.(row.date)
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartPanel>
  )
}
