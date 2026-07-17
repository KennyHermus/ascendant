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
  /** Raw 0–1 values; axis shows 0–100%. */
  valueMode?: 'integer' | 'percent'
  yDomain?: [number, number]
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
      ? formatChartPercent(row.value / 100)
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

/** Responsive line chart — consumes ChartSeries only. */
export function TimeSeriesLineChart({
  title,
  series,
  color = 'amber',
  valueMode = 'integer',
  yDomain,
}: TimeSeriesLineChartProps) {
  const rawData = seriesToChartData(series)
  const data =
    valueMode === 'percent'
      ? rawData.map((row) => ({ ...row, value: row.value * 100 }))
      : rawData

  const stroke = CHART_THEME.colors[color]

  return (
    <ChartPanel title={title} seriesLabel={series.label} pointCount={rawData.length}>
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
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
              domain={yDomain ?? ['auto', 'auto']}
              tickFormatter={(v) =>
                valueMode === 'percent'
                  ? `${Math.round(Number(v))}%`
                  : formatChartInteger(Number(v))
              }
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
            <Line
              type="monotone"
              dataKey="value"
              stroke={stroke}
              strokeWidth={2}
              dot={{ r: 2, fill: stroke }}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartPanel>
  )
}
