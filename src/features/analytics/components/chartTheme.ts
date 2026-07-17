/** Shared Recharts styling aligned with the Ascendant dashboard. */
export const CHART_THEME = {
  grid: '#44403c',
  axis: '#a8a29e',
  tooltipBg: '#1c1917',
  tooltipBorder: '#57534e',
  tooltipText: '#e7e5e4',
  colors: {
    amber: '#f59e0b',
    sky: '#38bdf8',
    emerald: '#34d399',
    rose: '#fb7185',
    violet: '#a78bfa',
  },
} as const

export type ChartColorKey = keyof typeof CHART_THEME.colors
