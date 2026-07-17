import {
  INSIGHT_SEVERITY_STYLES,
} from '@/features/insights/insightsPresentation'
import type { Insight } from '@/types/insights'

interface InsightCardProps {
  insight: Insight
}

/**
 * Reusable Insight Card — title, explanation, supporting metric,
 * optional confidence and severity. Presentation only.
 */
export function InsightCard({ insight }: InsightCardProps) {
  const severity = insight.severity ?? 'neutral'
  const styles = INSIGHT_SEVERITY_STYLES[severity]

  return (
    <article
      className={`rounded-lg border bg-stone-950/50 px-3.5 py-3 ${styles.border}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-stone-100">{insight.title}</h3>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${styles.badge}`}
        >
          {styles.label}
        </span>
      </div>

      {insight.subject && (
        <p className="mt-1 text-xs text-stone-500">{insight.subject}</p>
      )}

      <p className="mt-2 text-sm leading-relaxed text-stone-300">
        {insight.explanation}
      </p>

      <div className="mt-3 flex items-end justify-between gap-2 border-t border-stone-800/50 pt-2.5">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-stone-500">
            {insight.metric.label}
          </p>
          <p className="text-base font-semibold text-stone-100">
            {insight.metric.value}
          </p>
        </div>
        {insight.confidence && (
          <p className="text-[10px] uppercase tracking-wider text-stone-500">
            Confidence · {insight.confidence}
          </p>
        )}
      </div>
    </article>
  )
}
