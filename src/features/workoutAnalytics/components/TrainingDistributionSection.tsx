import { CompletionBar } from '@/features/analytics/components/CompletionBar'
import { distributionToPercentRows } from '@/features/workoutAnalytics/workoutAnalyticsPresentation'
import type { DistributionBucket } from '@/features/workoutAnalytics/trainingDistributionLogic'

interface TrainingDistributionSectionProps {
  byFamily: DistributionBucket[]
  byRole: DistributionBucket[]
  byMuscleRegion: DistributionBucket[]
  byTrainingType: DistributionBucket[]
  byWorkoutCategory: DistributionBucket[]
  totalCompletedSets: number
}

function DistributionGroup({
  title,
  buckets,
  color,
}: {
  title: string
  buckets: DistributionBucket[]
  color: 'amber' | 'emerald' | 'sky'
}) {
  if (buckets.length === 0) {
    return (
      <div>
        <h5 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400">
          {title}
        </h5>
        <p className="text-xs text-stone-500">No data yet.</p>
      </div>
    )
  }

  const rows = distributionToPercentRows(buckets)

  return (
    <div>
      <h5 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400">
        {title}
      </h5>
      <div className="space-y-1.5">
        {rows.map((row) => (
          <div key={row.id}>
            <div className="mb-0.5 flex items-baseline justify-between gap-2">
              <p className="text-xs text-stone-300">{row.label}</p>
              <p className="shrink-0 text-[11px] tabular-nums text-stone-500">{row.percent}%</p>
            </div>
            <CompletionBar percent={row.percent} label={row.label} color={color} />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Training balance across families, roles, muscle regions, training type, and workout category — surfaces imbalance. */
export function TrainingDistributionSection({
  byFamily,
  byRole,
  byMuscleRegion,
  byTrainingType,
  byWorkoutCategory,
  totalCompletedSets,
}: TrainingDistributionSectionProps) {
  if (totalCompletedSets === 0) {
    return (
      <p className="text-xs text-stone-500">
        No completed sets in this period yet — training distribution will appear once you log a
        workout.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <DistributionGroup title="Muscle Region (Upper / Lower / Core)" buckets={byMuscleRegion} color="sky" />
      <DistributionGroup title="Training Type (Strength / Cardio / Mobility)" buckets={byTrainingType} color="emerald" />
      <DistributionGroup title="Exercise Role (Foundation / Skill / Power / Strength)" buckets={byRole} color="amber" />
      <DistributionGroup title="Exercise Family" buckets={byFamily} color="sky" />
      <DistributionGroup title="Workout Category" buckets={byWorkoutCategory} color="emerald" />
    </div>
  )
}
