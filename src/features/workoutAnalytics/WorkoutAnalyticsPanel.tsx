import { Accordion } from '@/components/Accordion'
import { AnalyticsPeriodFilter } from '@/features/analytics/AnalyticsPeriodFilter'
import { AnalyticsDomainPanel } from '@/features/analytics/components/AnalyticsDomainPanel'
import { ExerciseAnalyticsSection } from '@/features/workoutAnalytics/components/ExerciseAnalyticsSection'
import { PrAnalyticsSection } from '@/features/workoutAnalytics/components/PrAnalyticsSection'
import { TrainingDistributionSection } from '@/features/workoutAnalytics/components/TrainingDistributionSection'
import { WorkoutAnalyticsCharts } from '@/features/workoutAnalytics/components/WorkoutAnalyticsCharts'
import { WorkoutTemplateAnalyticsSection } from '@/features/workoutAnalytics/components/WorkoutTemplateAnalyticsSection'
import {
  useTrainingDistribution,
  useWorkoutAnalyticsChartBundle,
  useWorkoutAnalyticsDomainModel,
  useWorkoutAnalyticsState,
  useWorkoutPrAnalytics,
} from '@/features/workoutAnalytics/workoutAnalyticsSelectors'

/**
 * Workout Analytics — an Analytics Domain (see `types/analyticsDomain.ts`).
 * Fully separate from the core Hero Analytics Dashboard (`features/analytics/`).
 * Consumes `WorkoutActivities`, `PerformanceState`, and `CoachingState` only —
 * no persisted data is duplicated here.
 */
export function WorkoutAnalyticsPanel() {
  const state = useWorkoutAnalyticsState()
  const { period, setPeriod } = state

  const domainModel = useWorkoutAnalyticsDomainModel(period)
  const prAnalytics = useWorkoutPrAnalytics(period)
  const distribution = useTrainingDistribution(period)
  const chartBundle = useWorkoutAnalyticsChartBundle(period)

  return (
    <AnalyticsDomainPanel
      title={domainModel.title}
      periodLabel={domainModel.periodLabel}
      persistKeyPrefix="workoutAnalytics"
      headerControls={<AnalyticsPeriodFilter value={period} onChange={setPeriod} />}
      overview={domainModel.overview}
      insights={domainModel.insights}
      recommendations={domainModel.recommendations}
      visualizations={<WorkoutAnalyticsCharts bundle={chartBundle} />}
      statistics={
        <div className="space-y-3">
          <Accordion
            title="Exercises"
            meta={`${state.exerciseEntries.length} tracked`}
            defaultExpanded
            persistKey="workoutAnalytics:statistics:exercises"
            variant="subcategory"
          >
            <ExerciseAnalyticsSection
              period={period}
              entries={state.exerciseEntries}
              filteredEntries={state.filteredExerciseEntries}
              query={state.exerciseQuery}
              onQueryChange={state.setExerciseQuery}
              selectedExerciseId={state.selectedExerciseId}
              onSelectExercise={state.selectExercise}
            />
          </Accordion>

          <Accordion
            title="Workout Templates"
            meta={`${state.templateEntries.length} programs`}
            persistKey="workoutAnalytics:statistics:templates"
            variant="subcategory"
          >
            <WorkoutTemplateAnalyticsSection
              period={period}
              entries={state.templateEntries}
              selectedTemplateId={state.selectedTemplateId}
              onSelectTemplate={state.selectTemplate}
            />
          </Accordion>

          <Accordion
            title="Personal Records"
            meta={`${prAnalytics.currentOfficialPrs.length} official`}
            persistKey="workoutAnalytics:statistics:prs"
            variant="subcategory"
          >
            <PrAnalyticsSection pr={prAnalytics} />
          </Accordion>

          <Accordion
            title="Training Distribution"
            meta={`${distribution.totalCompletedSets} sets`}
            persistKey="workoutAnalytics:statistics:distribution"
            variant="subcategory"
          >
            <TrainingDistributionSection
              byFamily={distribution.byFamily}
              byRole={distribution.byRole}
              byMuscleRegion={distribution.byMuscleRegion}
              byTrainingType={distribution.byTrainingType}
              byWorkoutCategory={distribution.byWorkoutCategory}
              totalCompletedSets={distribution.totalCompletedSets}
            />
          </Accordion>
        </div>
      }
    />
  )
}
