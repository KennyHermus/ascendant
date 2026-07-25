import type { CoachingRecommendation } from '@/types/progression'
import {
  CONFIDENCE_BADGE_CLASSES,
  CONFIDENCE_LABELS,
  formatRecommendationHeadline,
  formatRecommendationKind,
} from '@/features/progression/progressionPresentation'

export function CoachingRecommendationBanner({
  recommendation,
}: {
  recommendation: CoachingRecommendation
}) {
  return (
    <div className="mt-2 rounded-md border border-violet-800/40 bg-violet-950/20 px-3 py-2 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-violet-100">Coach</span>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${CONFIDENCE_BADGE_CLASSES[recommendation.confidence]}`}
        >
          {CONFIDENCE_LABELS[recommendation.confidence]}
        </span>
        <span className="text-violet-300/70">{formatRecommendationKind(recommendation.kind)}</span>
      </div>
      <p className="mt-1 font-medium text-violet-100">
        {formatRecommendationHeadline(recommendation)}
      </p>
      <p className="mt-0.5 text-violet-200/80">{recommendation.message}</p>
      <p className="mt-1 text-violet-300/60">{recommendation.reason}</p>
    </div>
  )
}

export function CoachingRecommendationList({
  recommendations,
}: {
  recommendations: CoachingRecommendation[]
}) {
  if (recommendations.length === 0) return null
  const primary = recommendations[0]
  return <CoachingRecommendationBanner recommendation={primary} />
}
