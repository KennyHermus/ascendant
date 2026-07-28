import { formatRatePercent } from '@/features/analytics/analyticsPresentationFormat'

export function formatHeroTitleDisplay(title: string | null): string {
  return title ?? 'Title Pending'
}

export function formatPercentDisplay(rate: number | null): string {
  return formatRatePercent(rate)
}
