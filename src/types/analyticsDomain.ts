/**
 * Analytics Domain architecture (v0.0.4).
 *
 * A self-contained analytics module alongside the core Hero Analytics
 * Dashboard (`features/analytics/`). Workout Analytics is the first domain;
 * future domains (Nutrition, Finance, Learning, Combat, ...) should follow
 * the same shape and reuse `AnalyticsDomainPanel` for UI chrome.
 *
 * Each domain conceptually exposes five sections:
 *
 *   Overview        - top-line scalar metrics (dashboard headline numbers)
 *   Statistics      - detailed per-entity breakdowns (drill-down lists)
 *   Visualizations  - charts, built from `ChartSeries` via existing
 *                     TimeSeriesLineChart / TimeSeriesBarChart components
 *   Insights        - objective, narrated observations (never prescriptive)
 *   Recommendations - domain-specific coaching / suggested next actions
 *
 * Domains own their underlying data types and logic; this file only
 * standardizes the presentation-layer contract consumed by the shared
 * `AnalyticsDomainPanel` component so every domain gets consistent
 * layout, accordions, and empty states for free.
 */

export interface AnalyticsDomainOverviewMetric {
  id: string
  label: string
  value: string
  hint?: string
}

export interface AnalyticsDomainInsight {
  id: string
  label: string
  detail: string
}

export interface AnalyticsDomainRecommendationSummary {
  id: string
  title: string
  message: string
  confidenceLabel?: string
}

/** Presentation DTO for one Analytics Domain's Overview section. */
export interface AnalyticsDomainModel {
  domainId: string
  title: string
  periodLabel: string
  overview: AnalyticsDomainOverviewMetric[]
  insights: AnalyticsDomainInsight[]
  recommendations: AnalyticsDomainRecommendationSummary[]
}
